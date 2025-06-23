import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle } from "lucide-react";

export default function GenericTrendChart({ data, dataKey, lineColor, yAxisLabel }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
        <p className="text-lg font-semibold">No trend data available.</p>
        <p>Ensure data is uploaded and processed.</p>
      </div>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-xl">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-sm" style={{ color: lineColor }}>
            {yAxisLabel}: <span className="font-bold">{payload[0].value.toLocaleString(undefined, {maximumFractionDigits: 1})}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12, dx: -5 }} 
            stroke="#64748b" 
            fontSize={12}
            tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={lineColor} 
            strokeWidth={3} 
            dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            name={yAxisLabel}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}