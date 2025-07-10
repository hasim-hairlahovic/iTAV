import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { parseISO, format } from "date-fns";

const CALL_TYPE_COLORS = {
  "Customer Service": "#3b82f6",
  "Billing": "#6366f1",
  "Enrollment": "#10b981",
  "Tele-sales": "#f59e0b",
  "Grievance": "#ef4444"
};

export default function CallVolumeChart({ callData, selectedTimeframe, filterDimension, filterValue, membershipData }) {
  // If filterValue is set, filter callData to only include calls for members matching the selected segment
  let filteredCallData = callData;
  if (filterValue && filterDimension && membershipData && membershipData.length) {
    // Get the set of dates and regions/segments/etc. for the selected filter
    const matchingDates = new Set(
      membershipData
        .filter(m => {
          if (filterDimension === "segment") return m.segment === filterValue;
          if (filterDimension === "region") return m.region === filterValue;
          if (filterDimension === "gender") return m.gender === filterValue;
          if (filterDimension === "age_band") return m.age_range === filterValue;
          if (filterDimension === "plan_name") return m.product === filterValue;
          if (filterDimension === "line_of_business") return mapProductToLineOfBusiness(m.product) === filterValue;
          return false;
        })
        .map(m => m.date)
    );
    filteredCallData = callData.filter(c => matchingDates.has(c.date));
  }

  const getAllDates = () => {
    const allDates = new Set();
    if (filteredCallData) filteredCallData.forEach(c => allDates.add(c.date));
    return Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  };

  const filterDatesByTimeframe = (dates, timeframe) => {
    if (timeframe === "All") return dates;
    const months = timeframe === "3M" ? 3 : timeframe === "6M" ? 6 : 12;
    return dates.slice(-months);
  };

  const prepareCallData = () => {
    if (!filteredCallData.length) return [];
    const allDates = getAllDates();
    const filteredDates = filterDatesByTimeframe(allDates, selectedTimeframe || "6M");
    return filteredDates.map(date => {
      const monthCalls = filteredCallData.filter(c => c.date === date);
      const result = { 
        month: format(parseISO(date), 'MMM yy')
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

function mapProductToLineOfBusiness(product) {
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
}