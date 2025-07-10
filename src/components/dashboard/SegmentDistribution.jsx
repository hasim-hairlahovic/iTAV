import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Filter } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const SEGMENT_COLORS = {
  "Highly Engaged": "#3b82f6",
  "Reactive Engagers": "#6366f1", 
  "Content & Complacent": "#10b981",
  "Unengaged": "#f59e0b"
};

// Extended color palette for additional dimensions
const EXTENDED_COLORS = [
  "#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316"
];

const DIMENSION_OPTIONS = [
  { value: "segment", label: "Customer Segment", field: "segment", available: true },
  { value: "region", label: "State", field: "region", available: true },
  { value: "gender", label: "Gender", field: "gender", available: false },
  { value: "age_band", label: "Age Band", field: "age_range", available: false },
  { value: "plan_name", label: "Plan Name", field: "product", available: false },
  { value: "line_of_business", label: "Line of Business", field: "product", available: false }
];

export default function SegmentDistribution({ membershipData }) {
  const [selectedDimension, setSelectedDimension] = useState("segment");

  const prepareSegmentData = () => {
    if (!membershipData.length) return [];
    
    const latestDate = membershipData[0]?.date;
    const latestData = membershipData.filter(m => m.date === latestDate);
    
    const selectedOption = DIMENSION_OPTIONS.find(opt => opt.value === selectedDimension);
    
    // Check if the selected dimension is available in current data
    if (!selectedOption?.available) {
      return [{
        name: "Data Not Available",
        value: latestData.reduce((sum, record) => sum + record.total_customers, 0),
        color: "#94a3b8",
        unavailable: true
      }];
    }
    
    const field = selectedOption?.field || "segment";
    
    const dimensionTotals = {};
    latestData.forEach(record => {
      let value = record[field];
      
      // Handle special cases for derived dimensions
      if (selectedDimension === "age_band") {
        value = record.age_range || "Unknown";
      } else if (selectedDimension === "line_of_business") {
        // Map product to line of business
        value = mapProductToLineOfBusiness(record.product);
      } else if (selectedDimension === "plan_name") {
        value = record.product || "Unknown";
      } else if (selectedDimension === "gender") {
        value = record.gender || "Unknown";
      } else if (selectedDimension === "region") {
        value = record.region || "Unknown";
      } else {
        value = record.segment || "Unknown";
      }
      
      dimensionTotals[value] = (dimensionTotals[value] || 0) + record.total_customers;
    });
    
    return Object.entries(dimensionTotals)
      .map(([dimension, total], index) => ({
        name: dimension,
        value: total,
        color: SEGMENT_COLORS[dimension] || EXTENDED_COLORS[index % EXTENDED_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  const mapProductToLineOfBusiness = (product) => {
    if (!product) return "Unknown";
    
    const productMap = {
      "Basic": "Standard Plans",
      "Enhanced": "Premium Plans", 
      "Premium": "Premium Plans",
      "Medicare Advantage": "Medicare Advantage",
      "Medicare Supplement": "Medicare Supplement",
      "Part D": "Prescription Drug Plans"
    };
    
    return productMap[product] || product;
  };

  const segmentData = prepareSegmentData();
  const totalMembers = segmentData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalMembers) * 100).toFixed(1);
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-slate-200 shadow-xl">
          <p className="font-semibold text-slate-900">{data.payload.name}</p>
          <p className="text-sm text-slate-600">
            {data.value.toLocaleString()} members ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const selectedOption = DIMENSION_OPTIONS.find(opt => opt.value === selectedDimension);

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Segmentation
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={!option.available}
                    className={!option.available ? "opacity-50" : ""}
                  >
                    {option.label}
                    {!option.available && " (Coming Soon)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          {segmentData.map((segment) => {
            const percentage = ((segment.value / totalMembers) * 100).toFixed(1);
            return (
              <div key={segment.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm font-medium text-slate-700">{segment.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {segment.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {segmentData.length === 1 && segmentData[0]?.unavailable && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Additional segmentation dimensions (Gender, Age Band, Plan Name, Line of Business) 
              require enhanced data import. Currently showing total membership distribution.
            </p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Total Members</span>
            <span className="text-lg font-bold text-slate-900">{totalMembers.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}