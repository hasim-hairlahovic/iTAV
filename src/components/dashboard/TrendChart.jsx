import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

const timeframes = [
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "All" }
];

export default function TrendChart({ data }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("6M");
  const [selectedMetrics, setSelectedMetrics] = useState({
    members: true,
    calls: true,
    callsPerMember: false
  });

  const filterDataByTimeframe = (data, timeframe) => {
    if (timeframe === "All") return data;
    
    const months = timeframe === "3M" ? 3 : timeframe === "6M" ? 6 : 12;
    return data.slice(-months);
  };

  const filteredData = filterDataByTimeframe(data, selectedTimeframe);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-slate-200 shadow-xl">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600">{item.name}:</span>
              <span className="font-semibold text-slate-900">
                {typeof item.value === 'number' ? 
                  item.value.toLocaleString() : 
                  item.value
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Trend Analysis
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe.value)}
                className={
                  selectedTimeframe === timeframe.value
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "hover:bg-blue-50"
                }
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.members}
              onChange={(e) => setSelectedMetrics(prev => ({
                ...prev,
                members: e.target.checked
              }))}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-600">Members</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.calls}
              onChange={(e) => setSelectedMetrics(prev => ({
                ...prev,
                calls: e.target.checked
              }))}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-600">Call Volume</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.callsPerMember}
              onChange={(e) => setSelectedMetrics(prev => ({
                ...prev,
                callsPerMember: e.target.checked
              }))}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-600">Calls per 1K Members</span>
          </label>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {selectedMetrics.members && (
                <Line
                  type="monotone"
                  dataKey="members"
                  name="Members"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                />
              )}
              
              {selectedMetrics.calls && (
                <Line
                  type="monotone"
                  dataKey="calls"
                  name="Total Calls"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2 }}
                />
              )}
              
              {selectedMetrics.callsPerMember && (
                <Line
                  type="monotone"
                  dataKey="callsPerMember"
                  name="Calls per 1K Members"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}