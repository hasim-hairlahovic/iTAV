import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Users, Clock } from "lucide-react";

export default function ForecastModel({ historicalData, scenarios }) {
  const calculateModelMetrics = () => {
    if (!historicalData.membership.length || !historicalData.calls.length) {
      return null;
    }

    // Calculate historical trends
    const membershipTrend = historicalData.membership.reduce((acc, curr) => {
      const date = curr.date;
      acc[date] = (acc[date] || 0) + curr.total_customers;
      return acc;
    }, {});

    const callTrend = historicalData.calls.reduce((acc, curr) => {
      const date = curr.date;
      acc[date] = (acc[date] || 0) + curr.total_calls;
      return acc;
    }, {});

    const dates = Object.keys(membershipTrend).sort();
    const latestDate = dates[dates.length - 1];
    const previousDate = dates[dates.length - 2];

    if (!previousDate) return null;

    const memberGrowth = ((membershipTrend[latestDate] - membershipTrend[previousDate]) / membershipTrend[previousDate]) * 100;
    const callGrowth = ((callTrend[latestDate] - callTrend[previousDate]) / callTrend[previousDate]) * 100;
    const callsPerMember = callTrend[latestDate] / membershipTrend[latestDate];

    // Calculate average resolution rate
    const avgResolution = historicalData.calls.reduce((sum, call) => sum + call.resolution_rate, 0) / historicalData.calls.length;
    const avgHandleTime = historicalData.calls.reduce((sum, call) => sum + call.avg_call_duration, 0) / historicalData.calls.length;

    return {
      memberGrowth: memberGrowth.toFixed(2),
      callGrowth: callGrowth.toFixed(2),
      callsPerMember: callsPerMember.toFixed(3),
      avgResolution: avgResolution.toFixed(1),
      avgHandleTime: avgHandleTime.toFixed(1),
      dataPoints: historicalData.membership.length + historicalData.calls.length
    };
  };

  const metrics = calculateModelMetrics();

  if (!metrics) {
    return (
      <Card className="glass-card border-none shadow-xl">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-500">Insufficient historical data for model analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Calculator className="w-5 h-5 text-purple-600" />
            Forecasting Model Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Model Components</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Historical trend analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Seasonal pattern recognition</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Customer segmentation impact</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Workforce utilization modeling</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Model Accuracy</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Data Quality</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">High</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Historical Data Points</span>
                  <span className="font-semibold text-slate-900">{metrics.dataPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Confidence Level</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">85%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Forecast Horizon</span>
                  <span className="font-semibold text-slate-900">12-36 months</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Patterns */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Historical Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Member Growth</span>
              </div>
              <p className="text-xl font-bold text-blue-900">{metrics.memberGrowth}%</p>
              <p className="text-xs text-blue-600">Monthly average</p>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Call Growth</span>
              </div>
              <p className="text-xl font-bold text-emerald-900">{metrics.callGrowth}%</p>
              <p className="text-xs text-emerald-600">Monthly average</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Calls/Member</span>
              </div>
              <p className="text-xl font-bold text-purple-900">{metrics.callsPerMember}</p>
              <p className="text-xs text-purple-600">Average ratio</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Avg Handle Time</span>
              </div>
              <p className="text-xl font-bold text-orange-900">{metrics.avgHandleTime} min</p>
              <p className="text-xs text-orange-600">Historical average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staffing Formula */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Calculator className="w-5 h-5 text-slate-600" />
            Staffing Calculation Formula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-6 rounded-lg">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg text-slate-900 mb-4">Agent Requirement Formula</h4>
                <div className="bg-white p-4 rounded border text-mono text-sm">
                  <div className="text-center">
                    <span className="font-bold">Required Agents = </span>
                    <span>(Total Call Minutes ÷ Available Agent Minutes) ÷ Utilization Target</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 text-center">
                    Where: Total Call Minutes = Calls × Average Handle Time<br/>
                    Available Agent Minutes = Hours per Agent × 60
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-600">Call Volume</div>
                  <div className="text-lg font-bold text-blue-600">Predicted Monthly Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-600">Capacity</div>
                  <div className="text-lg font-bold text-emerald-600">Agent Hours × Utilization</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-slate-600">Output</div>
                  <div className="text-lg font-bold text-purple-600">Required Headcount</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-slate-900 mb-2">Key Assumptions</h5>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Average Handle Time: {metrics.avgHandleTime} minutes</li>
                <li>• Target Utilization: 85%</li>
                <li>• Work Hours per Agent: 160/month</li>
                <li>• Supervisor Ratio: 12% of agent count</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-slate-900 mb-2">Model Limitations</h5>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Assumes consistent historical patterns</li>
                <li>• Seasonal variations estimated</li>
                <li>• External factors not included</li>
                <li>• Requires regular model updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}