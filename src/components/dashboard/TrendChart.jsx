import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Filter, BarChart3 } from "lucide-react";
import { format, parseISO } from "date-fns";
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

const METRIC_OPTIONS = [
  { value: "members", label: "Total Members", color: "#3b82f6" },
  { value: "calls", label: "Total Calls", color: "#6366f1" },
  { value: "callsPerMember", label: "Calls per 1K Members", color: "#10b981" },
  { value: "staff", label: "Total Staff", color: "#f59e0b" }
];

const DIMENSION_OPTIONS = [
  { value: "none", label: "No Breakdown", available: true },
  { value: "segment", label: "Customer Segment", field: "segment", available: true },
  { value: "region", label: "State", field: "region", available: true },
  { value: "gender", label: "Gender", field: "gender", available: false },
  { value: "age_band", label: "Age Band", field: "age_range", available: false },
  { value: "plan_name", label: "Plan Name", field: "product", available: false },
  { value: "line_of_business", label: "Line of Business", field: "product", available: false }
];

const BREAKDOWN_COLORS = [
  "#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316"
];

export default function TrendChart({ data, membershipData, callData, headcountData, selectedTimeframe, onTimeframeChange }) {
  const [selectedMetric, setSelectedMetric] = useState("members");
  const [selectedDimension, setSelectedDimension] = useState("none");

  // Helper: get all unique ISO dates, sorted ascending
  const getAllDates = () => {
    const allDates = new Set();
    if (membershipData) membershipData.forEach(m => allDates.add(m.date));
    if (callData) callData.forEach(c => allDates.add(c.date));
    if (headcountData) headcountData.forEach(h => allDates.add(h.date));
    return Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  };

  // Helper: filter dates by timeframe
  const filterDatesByTimeframe = (dates, timeframe) => {
    if (timeframe === "All") return dates;
    const months = timeframe === "3M" ? 3 : timeframe === "6M" ? 6 : 12;
    return dates.slice(-months);
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

  // Main data preparation
  const prepareChartData = () => {
    if (!membershipData || !callData || !headcountData) return [];
    const allDates = getAllDates();
    const filteredDates = filterDatesByTimeframe(allDates, selectedTimeframe);
    const selectedOption = DIMENSION_OPTIONS.find(opt => opt.value === selectedDimension);

    // No breakdown: aggregate for each date
    if (selectedDimension === "none" || !selectedOption?.available) {
      return filteredDates.map(date => {
        const monthMembership = membershipData.filter(m => m.date === date);
        const monthCalls = callData.filter(c => c.date === date);
        const monthStaff = headcountData.find(h => h.date === date);
        const totalMembers = monthMembership.reduce((sum, m) => sum + m.total_customers, 0);
        const totalCalls = monthCalls.reduce((sum, c) => sum + c.total_calls, 0);
        return {
          rawDate: date,
          date: format(parseISO(date), "MMM yyyy"),
          members: totalMembers,
          calls: totalCalls,
          staff: monthStaff?.total_staff || 0,
          callsPerMember: totalMembers > 0 ? (totalCalls / totalMembers) * 1000 : 0
        };
      });
    }

    // With breakdown: build a map of {date: {dimension: value}}
    const dimensionMap = {};
    filteredDates.forEach(date => {
      dimensionMap[date] = {};
      const monthMembership = membershipData.filter(m => m.date === date);
      const monthCalls = callData.filter(c => c.date === date);
      const monthStaff = headcountData.find(h => h.date === date);
      // Group by dimension
      monthMembership.forEach(record => {
        let dimensionValue = record[selectedOption.field];
        if (selectedDimension === "age_band") {
          dimensionValue = record.age_range || "Unknown";
        } else if (selectedDimension === "line_of_business") {
          dimensionValue = mapProductToLineOfBusiness(record.product);
        } else if (selectedDimension === "plan_name") {
          dimensionValue = record.product || "Unknown";
        } else if (selectedDimension === "gender") {
          dimensionValue = record.gender || "Unknown";
        } else if (selectedDimension === "region") {
          dimensionValue = record.region || "Unknown";
        } else {
          dimensionValue = record.segment || "Unknown";
        }
        if (!dimensionMap[date][dimensionValue]) {
          dimensionMap[date][dimensionValue] = { members: 0, calls: 0, staff: 0 };
        }
        dimensionMap[date][dimensionValue].members += record.total_customers;
      });
      // Distribute calls and staff proportionally
      const totalMembers = Object.values(dimensionMap[date]).reduce((sum, group) => sum + group.members, 0);
      monthCalls.forEach(record => {
        if (totalMembers > 0) {
          Object.values(dimensionMap[date]).forEach(group => {
            const proportion = group.members / totalMembers;
            group.calls += record.total_calls * proportion;
          });
        }
      });
      if (monthStaff && totalMembers > 0) {
        Object.values(dimensionMap[date]).forEach(group => {
          const proportion = group.members / totalMembers;
          group.staff += monthStaff.total_staff * proportion;
        });
      }
    });
    // Build chart data: one object per date, with each dimension as a key
    const allDimensions = Array.from(new Set(
      Object.values(dimensionMap).flatMap(obj => Object.keys(obj))
    ));
    return filteredDates.map(date => {
      const base = { rawDate: date, date: format(parseISO(date), "MMM yyyy") };
      allDimensions.forEach((dimension, idx) => {
        const group = dimensionMap[date][dimension];
        base[dimension] = group
          ? selectedMetric === "callsPerMember"
            ? group.members > 0 ? (group.calls / group.members) * 1000 : 0
            : group[selectedMetric] || 0
          : null;
      });
      return base;
    });
  };

  const chartData = prepareChartData();
  const selectedMetricOption = METRIC_OPTIONS.find(opt => opt.value === selectedMetric);
  const selectedDimensionOption = DIMENSION_OPTIONS.find(opt => opt.value === selectedDimension);

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
              <span className="text-slate-600">
                {selectedDimension !== "none" ? `${item.name}: ` : ""}
              </span>
              <span className="font-semibold text-slate-900">
                {typeof item.value === 'number' ? 
                  (selectedMetric === "callsPerMember" ? item.value.toFixed(1) : item.value.toLocaleString()) : 
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

  // X-axis tick formatter
  const xTickFormatter = (rawDate) => {
    try {
      return format(parseISO(rawDate), "MMM yyyy");
    } catch {
      return rawDate;
    }
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
              <button
                key={timeframe.value}
                onClick={() => onTimeframeChange(timeframe.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTimeframe === timeframe.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-48 h-8 text-xs">
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="rawDate" 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={xTickFormatter}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedDimension === "none" || !selectedDimensionOption?.available ? (
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={selectedMetricOption?.label}
                  stroke={selectedMetricOption?.color}
                  strokeWidth={3}
                  dot={{ fill: selectedMetricOption?.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: selectedMetricOption?.color, strokeWidth: 2 }}
                />
              ) : (
                // Render multiple lines for dimension breakdown
                (() => {
                  const allDimensions = Object.keys(chartData[0] || {}).filter(
                    key => !["rawDate", "date"].includes(key)
                  );
                  return allDimensions.map((dimension, index) => (
                    <Line
                      key={dimension}
                      type="monotone"
                      dataKey={dimension}
                      name={dimension}
                      stroke={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length], strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length], strokeWidth: 2 }}
                      connectNulls
                    />
                  ));
                })()
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {selectedDimension !== "none" && !selectedDimensionOption?.available && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Additional breakdown dimensions (Gender, Age Band, Plan Name, Line of Business) 
              require enhanced data import. Currently showing aggregated trends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}