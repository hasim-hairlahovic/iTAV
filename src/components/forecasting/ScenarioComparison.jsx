import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

const SCENARIO_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ScenarioComparison({ scenarios }) {
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState("required_staff");

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId].slice(0, 5) // Max 5 scenarios
    );
  };

  const prepareComparisonData = () => {
    if (selectedScenarios.length === 0) return [];

    const selectedScenarioData = scenarios.filter(s => selectedScenarios.includes(s.id));
    
    // Get all unique months across scenarios
    const allMonths = new Set();
    selectedScenarioData.forEach(scenario => {
      scenario.forecast_results?.forEach(result => {
        allMonths.add(result.month);
      });
    });

    const sortedMonths = Array.from(allMonths).sort();

    return sortedMonths.map(month => {
      const dataPoint = {
        month: format(new Date(month + "-01"), "MMM yyyy")
      };

      selectedScenarioData.forEach((scenario, index) => {
        const result = scenario.forecast_results?.find(r => r.month === month);
        if (result) {
          dataPoint[scenario.name] = result[comparisonMetric];
        }
      });

      return dataPoint;
    });
  };

  const calculateScenarioSummary = (scenario) => {
    if (!scenario.forecast_results) return null;

    const finalResult = scenario.forecast_results[scenario.forecast_results.length - 1];
    const initialResult = scenario.forecast_results[0];
    
    const staffGrowth = ((finalResult.required_staff - initialResult.required_staff) / initialResult.required_staff) * 100;
    const memberGrowth = ((finalResult.predicted_members - initialResult.predicted_members) / initialResult.predicted_members) * 100;

    return {
      finalStaff: finalResult.required_staff,
      finalMembers: finalResult.predicted_members,
      staffGrowth: staffGrowth.toFixed(1),
      memberGrowth: memberGrowth.toFixed(1)
    };
  };

  const chartData = prepareComparisonData();

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
                <span className="text-slate-600">{item.dataKey}:</span>
              </div>
              <span className="font-semibold text-slate-900">
                {item.value?.toLocaleString() || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (scenarios.length === 0) {
    return (
      <Card className="glass-card border-none shadow-xl">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-500">No scenarios available for comparison</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <ArrowUpDown className="w-5 h-5 text-orange-600" />
            Scenario Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Comparison Metric
              </label>
              <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required_staff">Required Staff</SelectItem>
                  <SelectItem value="predicted_members">Predicted Members</SelectItem>
                  <SelectItem value="predicted_calls">Predicted Calls</SelectItem>
                  <SelectItem value="required_supervisors">Required Supervisors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">
              Select Scenarios to Compare (max 5)
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scenarios.map((scenario) => {
                const isSelected = selectedScenarios.includes(scenario.id);
                const summary = calculateScenarioSummary(scenario);
                
                return (
                  <div
                    key={scenario.id}
                    onClick={() => handleScenarioToggle(scenario.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{scenario.name}</h4>
                      {isSelected && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    {summary && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Final Staff:</span>
                          <span className="font-semibold">{summary.finalStaff}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Growth Rate:</span>
                          <span className={`font-semibold ${parseFloat(summary.memberGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {summary.memberGrowth}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      {selectedScenarios.length > 0 && (
        <Card className="glass-card border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {comparisonMetric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Comparison
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
                  
                  {scenarios
                    .filter(s => selectedScenarios.includes(s.id))
                    .map((scenario, index) => (
                      <Line
                        key={scenario.id}
                        type="monotone"
                        dataKey={scenario.name}
                        name={scenario.name}
                        stroke={SCENARIO_COLORS[index % SCENARIO_COLORS.length]}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Table */}
      {selectedScenarios.length > 0 && (
        <Card className="glass-card border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="w-5 h-5 text-purple-600" />
              Scenario Summary Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-semibold text-slate-700">Scenario</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Growth Rate</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Final Members</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Final Staff</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Staff Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios
                    .filter(s => selectedScenarios.includes(s.id))
                    .map((scenario) => {
                      const summary = calculateScenarioSummary(scenario);
                      return (
                        <tr key={scenario.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-900">{scenario.name}</td>
                          <td className="p-3 text-right text-slate-700">{scenario.member_growth_rate}%</td>
                          <td className="p-3 text-right text-slate-700">{summary?.finalMembers.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700">{summary?.finalStaff}</td>
                          <td className={`p-3 text-right font-semibold ${parseFloat(summary?.staffGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {summary?.staffGrowth}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}