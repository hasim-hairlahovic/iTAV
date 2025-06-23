import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CALL_TYPE_COLORS = {
  "Customer Service": "#3b82f6",
  "Billing": "#6366f1",
  "Enrollment": "#10b981",
  "Tele-sales": "#f59e0b",
  "Grievance": "#ef4444"
};

export default function CallVolumeChart({ callData }) {
  const prepareCallData = () => {
    if (!callData.length) return [];
    
    const dates = [...new Set(callData.map(c => c.date))].sort().slice(-6);
    
    return dates.map(date => {
      const monthCalls = callData.filter(c => c.date === date);
      const result = { 
        month: new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      };
      
      monthCalls.forEach(call => {
        result[call.call_type] = call.total_calls;
      });
      
      return result;
    });
  };

  const chartData = prepareCallData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, item) => sum + item.value, 0);
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-slate-200 shadow-xl">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600">{item.dataKey}:</span>
              </div>
              <span className="font-semibold text-slate-900">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-slate-200 mt-2 pt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total:</span>
              <span>{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Phone className="w-5 h-5 text-blue-600" />
          Call Volume by Type
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {Object.entries(CALL_TYPE_COLORS).map(([callType, color]) => (
                <Bar
                  key={callType}
                  dataKey={callType}
                  stackId="calls"
                  fill={color}
                  name={callType}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}