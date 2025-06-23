import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, Users, Phone, UserCheck } from "lucide-react";
import { format } from "date-fns";

export default function ForecastResults({ scenario, scenarios, onScenarioChange }) {
  if (!scenario || !scenario.forecast_results) {
    return (
      <Card className="glass-card border-none shadow-xl">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-500">No forecast results available</p>
        </CardContent>
      </Card>
    );
  }

  const prepareChartData = () => {
    return scenario.forecast_results.map(result => ({
      month: format(new Date(result.month + "-01"), "MMM yyyy"),
      members: result.predicted_members,
      calls: result.predicted_calls,
      staff: result.required_staff,
      supervisors: result.required_supervisors,
      callsPerMember: (result.predicted_calls / result.predicted_members * 1000).toFixed(1)
    }));
  };

  const chartData = prepareChartData();
  const totalStaffNeeded = scenario.forecast_results[scenario.forecast_results.length - 1];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
                <span className="text-slate-600">{item.name}:</span>
              </div>
              <span className="font-semibold text-slate-900">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Forecast Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Scenario:</span>
              <Select value={scenario.id} onValueChange={(id) => onScenarioChange(scenarios.find(s => s.id === id))}>
                <SelectTrigger className="w-[250px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Forecast Period</span>
              </div>
              <p className="text-xl font-bold text-blue-900">{scenario.forecast_months} months</p>
              <p className="text-xs text-blue-600">Growth: {scenario.member_growth_rate}% monthly</p>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Peak Calls</span>
              </div>
              <p className="text-xl font-bold text-emerald-900">
                {Math.max(...scenario.forecast_results.map(r => r.predicted_calls)).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600">Monthly maximum</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Staff Required</span>
              </div>
              <p className="text-xl font-bold text-purple-900">
                {totalStaffNeeded?.required_staff?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-purple-600">By end of period</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-blue-600" />
              Members & Call Volume Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="members" 
                    name="Members"
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    name="Calls"
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <UserCheck className="w-5 h-5 text-purple-600" />
              Staffing Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="staff" name="Agents" fill="#6366f1" />
                  <Bar dataKey="supervisors" name="Supervisors" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            Detailed Monthly Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 font-semibold text-slate-700">Month</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Members</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Calls</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Calls/1K</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Agents</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Supervisors</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{row.month}</td>
                    <td className="p-3 text-right text-slate-700">{row.members.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">{row.calls.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">{row.callsPerMember}</td>
                    <td className="p-3 text-right text-slate-700">{row.staff}</td>
                    <td className="p-3 text-right text-slate-700">{row.supervisors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}