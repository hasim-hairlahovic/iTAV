import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const SEGMENT_COLORS = {
  "Highly Engaged": "#3b82f6",
  "Reactive Engagers": "#6366f1", 
  "Content & Complacent": "#10b981",
  "Unengaged": "#f59e0b"
};

export default function SegmentDistribution({ membershipData }) {
  const prepareSegmentData = () => {
    if (!membershipData.length) return [];
    
    const latestDate = membershipData[0]?.date;
    const latestData = membershipData.filter(m => m.date === latestDate);
    
    const segmentTotals = {};
    latestData.forEach(record => {
      segmentTotals[record.segment] = (segmentTotals[record.segment] || 0) + record.total_customers;
    });
    
    return Object.entries(segmentTotals).map(([segment, total]) => ({
      name: segment,
      value: total,
      color: SEGMENT_COLORS[segment]
    }));
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

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Users className="w-5 h-5 text-blue-600" />
          Customer Segmentation
        </CardTitle>
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