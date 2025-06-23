import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function MemberSnapshotChart({ data, dimension, dimensionLabel }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
        <p className="text-lg font-semibold">No membership data available.</p>
        <p>Please upload data on the Data Management page.</p>
      </div>
    );
  }

  const processData = () => {
    const counts = data.reduce((acc, item) => {
      const key = item[dimension] || "N/A";
      acc[key] = (acc[key] || 0) + item.total_customers;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  const chartData = processData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-xl">
          <p className="font-semibold text-slate-900">{`${dimensionLabel}: ${label}`}</p>
          <p className="text-sm text-slate-600">
            Customers: <span className="font-bold">{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b" 
            fontSize={12} 
            width={120}
            tick={{ dy: 2 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(230, 230, 230, 0.3)' }} />
          <Bar dataKey="value" barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}