import React, { useState, useEffect } from "react";
import { MembershipData, CallData, HeadcountData } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Phone, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO } from "date-fns";

import MetricCard from "../components/dashboard/MetricCard";
import TrendChart from "../components/dashboard/TrendChart";
import SegmentDistribution from "../components/dashboard/SegmentDistribution";
import CallVolumeChart from "../components/dashboard/CallVolumeChart";

export default function Dashboard() {
  const [membershipData, setMembershipData] = useState([]);
  const [callData, setCallData] = useState([]);
  const [headcountData, setHeadcountData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("3M");
  const [selectedSegmentationDimension, setSelectedSegmentationDimension] = useState("segment");
  const [selectedSegmentationValue, setSelectedSegmentationValue] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [membership, calls, headcount] = await Promise.all([
        MembershipData.list("-date"),
        CallData.list("-date"),
        HeadcountData.list("-date")
      ]);
      
      setMembershipData(membership);
      setCallData(calls);
      setHeadcountData(headcount);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!membershipData.length || !callData.length || !headcountData.length) {
      return {
        totalMembers: 0,
        totalCalls: 0,
        totalStaff: 0,
        avgResolution: 0,
        callsPerMember: 0,
        memberGrowth: 0,
        callGrowth: 0,
        staffEfficiency: 0
      };
    }

    // Current month totals
    const currentMonth = membershipData[0]?.date;
    const currentMembership = membershipData.filter(m => m.date === currentMonth);
    const currentCalls = callData.filter(c => c.date === currentMonth);
    const currentStaff = headcountData.find(h => h.date === currentMonth);

    const totalMembers = currentMembership.reduce((sum, m) => sum + m.total_customers, 0);
    const totalCalls = currentCalls.reduce((sum, c) => sum + c.total_calls, 0);
    const avgResolution = currentCalls.reduce((sum, c) => sum + c.resolution_rate, 0) / currentCalls.length;

    // Previous month for growth calculation
    const dates = [...new Set(membershipData.map(m => m.date))].sort().reverse();
    const prevMonth = dates[1];
    
    if (prevMonth) {
      const prevMembership = membershipData.filter(m => m.date === prevMonth);
      const prevCalls = callData.filter(c => c.date === prevMonth);
      
      const prevTotalMembers = prevMembership.reduce((sum, m) => sum + m.total_customers, 0);
      const prevTotalCalls = prevCalls.reduce((sum, c) => sum + c.total_calls, 0);
      
      const memberGrowth = ((totalMembers - prevTotalMembers) / prevTotalMembers) * 100;
      const callGrowth = ((totalCalls - prevTotalCalls) / prevTotalCalls) * 100;
      
      return {
        totalMembers,
        totalCalls,
        totalStaff: currentStaff?.total_staff || 0,
        avgResolution,
        callsPerMember: (totalCalls / totalMembers) * 1000,
        memberGrowth,
        callGrowth,
        staffEfficiency: totalCalls / (currentStaff?.total_staff || 1)
      };
    }

    return {
      totalMembers,
      totalCalls,
      totalStaff: currentStaff?.total_staff || 0,
      avgResolution,
      callsPerMember: (totalCalls / totalMembers) * 1000,
      memberGrowth: 0,
      callGrowth: 0,
      staffEfficiency: totalCalls / (currentStaff?.total_staff || 1)
    };
  };

  const metrics = calculateMetrics();

  const prepareTrendData = () => {
    const dates = [...new Set(membershipData.map(m => m.date))].sort((a, b) => new Date(a) - new Date(b));
    
    return dates.map(date => {
      const monthMembership = membershipData.filter(m => m.date === date);
      const monthCalls = callData.filter(c => c.date === date);
      const monthStaff = headcountData.find(h => h.date === date);
      
      const totalMembers = monthMembership.reduce((sum, m) => sum + m.total_customers, 0);
      const totalCalls = monthCalls.reduce((sum, c) => sum + c.total_calls, 0);
      
      return {
        date: format(parseISO(date), "MMM yyyy"),
        members: totalMembers,
        calls: totalCalls,
        staff: monthStaff?.total_staff || 0,
        callsPerMember: (totalCalls / totalMembers) * 1000
      };
    });
  };

  const trendData = prepareTrendData();

  // Handler for when a segment is clicked in SegmentDistribution
  const handleSegmentationSelection = (dimension, value) => {
    setSelectedSegmentationDimension(dimension);
    setSelectedSegmentationValue(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white/50 rounded-xl"></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/50 rounded-xl"></div>
          <div className="h-96 bg-white/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Customer & Sector Insights
          </h1>
          <p className="text-slate-600 text-lg">
            Real-time workforce analytics and customer insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Live Data
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Members"
          value={metrics.totalMembers.toLocaleString()}
          change={metrics.memberGrowth}
          icon={Users}
          gradient="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Monthly Calls"
          value={metrics.totalCalls.toLocaleString()}
          change={metrics.callGrowth}
          icon={Phone}
          gradient="from-indigo-500 to-indigo-600"
        />
        <MetricCard
          title="Calls per 1,000 Members"
          value={metrics.callsPerMember.toFixed(1)}
          change={2.3}
          icon={Target}
          gradient="from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Staff Efficiency"
          value={`${metrics.staffEfficiency.toFixed(0)} calls/agent`}
          change={-1.8}
          icon={TrendingUp}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Customer Segmentation */}
        <div>
          <SegmentDistribution 
            membershipData={membershipData} 
            selectedDimension={selectedSegmentationDimension}
            selectedValue={selectedSegmentationValue}
            onSelectionChange={handleSegmentationSelection}
          />
        </div>

        {/* Trend Analysis and Call Volume by Type stacked */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <TrendChart 
            data={trendData} 
            membershipData={membershipData}
            callData={callData}
            headcountData={headcountData}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
          <CallVolumeChart 
            callData={callData}
            selectedTimeframe={selectedTimeframe}
            filterDimension={selectedSegmentationDimension}
            filterValue={selectedSegmentationValue}
            membershipData={membershipData}
          />
        </div>
      </div>
    </div>
  );
}