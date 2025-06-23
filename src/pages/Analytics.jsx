import React, { useState, useEffect } from "react";
import { MembershipData, CallData } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Phone, TrendingUp, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";

import MemberSnapshotChart from "../components/analytics/MemberSnapshotChart";
import GenericTrendChart from "../components/analytics/GenericTrendChart";
import CallMetricsTable from "../components/analytics/CallMetricsTable";

const DIMENSIONS = [
  { value: "age_range", label: "Age Range" },
  { value: "gender", label: "Gender" },
  { value: "segment", label: "Customer Segment" },
  { value: "product", label: "Product Type" },
  { value: "region", label: "Region" },
  { value: "language_preference", label: "Language Preference" },
];

export default function AnalyticsPage() {
  const [membershipData, setMembershipData] = useState([]);
  const [callData, setCallData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState(DIMENSIONS[0].value);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [members, calls] = await Promise.all([
        MembershipData.list("-date"),
        CallData.list("-date"),
      ]);
      setMembershipData(members);
      setCallData(calls);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareMembershipTrend = () => {
    const groupedByDate = membershipData.reduce((acc, curr) => {
      const date = format(parseISO(curr.date), "MMM yyyy");
      acc[date] = (acc[date] || 0) + curr.total_customers;
      return acc;
    }, {});
    return Object.entries(groupedByDate)
      .map(([date, members]) => ({ date, members }))
      .sort((a, b) => parseISO(a.dateInput || a.date) - parseISO(b.dateInput || b.date)); // Ensure correct date sorting
  };
  
  const prepareCallVolumeTrend = () => {
    const groupedByDate = callData.reduce((acc, curr) => {
      const date = format(parseISO(curr.date), "MMM yyyy");
      acc[date] = (acc[date] || 0) + curr.total_calls;
      return acc;
    }, {});
    return Object.entries(groupedByDate)
      .map(([date, calls]) => ({ date, calls }))
      .sort((a, b) => parseISO(a.dateInput || a.date) - parseISO(b.dateInput || b.date));
  };

  const prepareCallsPerMemberTrend = () => {
    const memberCounts = membershipData.reduce((acc, curr) => {
      const date = format(parseISO(curr.date), "yyyy-MM");
      acc[date] = (acc[date] || 0) + curr.total_customers;
      return acc;
    }, {});

    const callCounts = callData.reduce((acc, curr) => {
      const date = format(parseISO(curr.date), "yyyy-MM");
      acc[date] = (acc[date] || 0) + curr.total_calls;
      return acc;
    }, {});
    
    const trend = Object.keys(memberCounts).map(dateKey => {
      const members = memberCounts[dateKey];
      const calls = callCounts[dateKey] || 0;
      const dateFormatted = format(parseISO(dateKey + "-01"), "MMM yyyy");
      return {
        date: dateFormatted,
        callsPer1000Members: members > 0 ? (calls / members) * 1000 : 0,
        dateInput: dateKey + "-01" // for sorting
      };
    }).sort((a,b) => parseISO(a.dateInput) - parseISO(b.dateInput));
    return trend;
  };


  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-16 bg-white/50 rounded-xl mb-8"></div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="h-96 bg-white/50 rounded-xl"></div>
          <div className="h-96 bg-white/50 rounded-xl"></div>
        </div>
        <div className="h-96 bg-white/50 rounded-xl"></div>
      </div>
    );
  }
  
  const latestMembershipData = membershipData.filter(m => m.date === membershipData[0]?.date);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Analytics Hub
          </h1>
          <p className="text-slate-600 text-lg">
            Deep dive into membership, call patterns, and performance metrics.
          </p>
        </div>
      </div>

      {/* Member Snapshot Section */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-blue-600" />
              Member Snapshot
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Select Dimension" />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS.map((dim) => (
                    <SelectItem key={dim.value} value={dim.value}>
                      {dim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MemberSnapshotChart 
            data={latestMembershipData} 
            dimension={selectedDimension} 
            dimensionLabel={DIMENSIONS.find(d => d.value === selectedDimension)?.label}
          />
        </CardContent>
      </Card>

      {/* Trend Charts Section */}
      <Tabs defaultValue="membershipTrends" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-slate-100 p-1 rounded-lg mb-6">
          <TabsTrigger value="membershipTrends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" /> Membership
          </TabsTrigger>
          <TabsTrigger value="callVolumeTrends" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Phone className="w-4 h-4 mr-2" /> Call Volume
          </TabsTrigger>
          <TabsTrigger value="performanceTrends" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membershipTrends">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 text-blue-600" />
                Membership Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GenericTrendChart 
                data={prepareMembershipTrend()} 
                dataKey="members" 
                lineColor="#3b82f6" 
                yAxisLabel="Total Members"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="callVolumeTrends">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Phone className="w-5 h-5 text-indigo-600" />
                Call Volume Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GenericTrendChart 
                data={prepareCallVolumeTrend()} 
                dataKey="calls" 
                lineColor="#6366f1" 
                yAxisLabel="Total Calls"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performanceTrends">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Calls per 1,000 Members
              </CardTitle>
            </CardHeader>
            <CardContent>
               <GenericTrendChart 
                data={prepareCallsPerMemberTrend()} 
                dataKey="callsPer1000Members" 
                lineColor="#10b981" 
                yAxisLabel="Calls per 1K Members"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Call Metrics Table */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Detailed Call Metrics (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CallMetricsTable callData={callData} />
        </CardContent>
      </Card>

    </div>
  );
}