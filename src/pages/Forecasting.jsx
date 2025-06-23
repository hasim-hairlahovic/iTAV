import React, { useState, useEffect } from "react";
import { MembershipData, CallData, HeadcountData, ForecastScenario } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Calculator, 
  Play, 
  Save,
  BarChart3,
  Settings,
  Zap
} from "lucide-react";

import ForecastModel from "../components/forecasting/ForecastModel";
import ScenarioBuilder from "../components/forecasting/ScenarioBuilder";
import ForecastResults from "../components/forecasting/ForecastResults";
import ScenarioComparison from "../components/forecasting/ScenarioComparison";

export default function ForecastingPage() {
  const [historicalData, setHistoricalData] = useState({
    membership: [],
    calls: [],
    headcount: []
  });
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [membership, calls, headcount, savedScenarios] = await Promise.all([
        MembershipData.list("-date"),
        CallData.list("-date"),
        HeadcountData.list("-date"),
        ForecastScenario.list("-createdAt")
      ]);
      
      setHistoricalData({ membership, calls, headcount });
      setScenarios(savedScenarios);
      
      if (savedScenarios.length > 0) {
        setActiveScenario(savedScenarios[0]);
      }
    } catch (error) {
      console.error("Error loading forecasting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBaseline = async () => {
    setIsGenerating(true);
    
    try {
      // Create baseline scenario with default parameters
      const baselineScenario = {
        name: "Baseline Forecast",
        description: "Standard forecast based on historical trends",
        base_month: new Date().toISOString().slice(0, 10),
        forecast_months: 12,
        member_growth_rate: 2.5,
        segment_adjustments: {
          highly_engaged: 0,
          reactive_engagers: 0,
          content_complacent: 0,
          unengaged: 0
        },
        call_volume_factors: {
          seasonal_factor: 1.0,
          engagement_impact: 1.0,
          product_mix_impact: 1.0
        },
        staffing_parameters: {
          avg_handle_time: 6.2,
          hours_per_agent: 160,
          utilization_target: 0.85,
          supervisor_ratio: 0.12
        }
      };

      // Generate forecast results
      const forecastResults = generateForecastData(baselineScenario);
      baselineScenario.forecast_results = forecastResults;

      // Save scenario
      const savedScenario = await ForecastScenario.create(baselineScenario);
      setScenarios(prev => [savedScenario, ...prev]);
      setActiveScenario(savedScenario);
      
    } catch (error) {
      console.error("Error generating baseline:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateForecastData = (scenario) => {
    const { historicalData: hist } = this.state || { historicalData };
    
    // Calculate baseline metrics from historical data
    const latestMonth = hist.membership.filter(m => m.date === hist.membership[0]?.date);
    const totalMembers = latestMonth.reduce((sum, m) => sum + m.total_customers, 0);
    
    const latestCalls = hist.calls.filter(c => c.date === hist.calls[0]?.date);
    const totalCalls = latestCalls.reduce((sum, c) => sum + c.total_calls, 0);
    
    const callsPerMember = totalCalls / totalMembers;
    
    // Generate forecast for each month
    const results = [];
    for (let i = 1; i <= scenario.forecast_months; i++) {
      const growthFactor = Math.pow(1 + scenario.member_growth_rate / 100, i);
      const predictedMembers = Math.round(totalMembers * growthFactor);
      
      // Apply seasonal and engagement factors
      const seasonalMultiplier = 1 + 0.15 * Math.sin((i - 1) * Math.PI / 6); // Seasonal pattern
      const predictedCalls = Math.round(
        predictedMembers * 
        callsPerMember * 
        scenario.call_volume_factors.seasonal_factor * 
        seasonalMultiplier
      );
      
      // Calculate required staffing
      const totalMinutes = predictedCalls * scenario.staffing_parameters.avg_handle_time;
      const availableMinutes = scenario.staffing_parameters.hours_per_agent * 60 * scenario.staffing_parameters.utilization_target;
      const requiredStaff = Math.ceil(totalMinutes / availableMinutes);
      const requiredSupervisors = Math.ceil(requiredStaff * scenario.staffing_parameters.supervisor_ratio);
      
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      
      results.push({
        month: month.toISOString().slice(0, 7),
        predicted_members: predictedMembers,
        predicted_calls: predictedCalls,
        required_staff: requiredStaff,
        required_supervisors: requiredSupervisors
      });
    }
    
    return results;
  };

  const handleScenarioSave = async (scenarioData) => {
    try {
      const forecastResults = generateForecastData(scenarioData);
      const completeScenario = {
        ...scenarioData,
        forecast_results: forecastResults
      };
      
      const savedScenario = await ForecastScenario.create(completeScenario);
      setScenarios(prev => [savedScenario, ...prev]);
      setActiveScenario(savedScenario);
    } catch (error) {
      console.error("Error saving scenario:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-16 bg-white/50 rounded-xl mb-8"></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white/50 rounded-xl"></div>
          <div className="h-96 bg-white/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Forecasting & Scenario Planning
          </h1>
          <p className="text-slate-600 text-lg">
            Predict future workforce needs and explore strategic scenarios
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {scenarios.length === 0 && (
            <Button 
              onClick={generateBaseline} 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Calculator className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Baseline
                </>
              )}
            </Button>
          )}
          
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            {scenarios.length} Scenarios
          </Badge>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-800">
              Start Your Workforce Forecasting
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Generate a baseline forecast based on your historical data, then create custom scenarios 
              to explore different business conditions and their impact on staffing needs.
            </p>
            <Button 
              onClick={generateBaseline} 
              disabled={isGenerating}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Calculator className="w-5 h-5 mr-2 animate-spin" />
                  Generating Baseline...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Generate Baseline Forecast
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex bg-slate-100 p-1 rounded-lg mb-6">
            <TabsTrigger value="results" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" /> Results
            </TabsTrigger>
            <TabsTrigger value="builder" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" /> Builder
            </TabsTrigger>
            <TabsTrigger value="model" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Calculator className="w-4 h-4 mr-2" /> Model
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" /> Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <ForecastResults 
              scenario={activeScenario}
              scenarios={scenarios}
              onScenarioChange={setActiveScenario}
            />
          </TabsContent>

          <TabsContent value="builder">
            <ScenarioBuilder 
              historicalData={historicalData}
              onSave={handleScenarioSave}
              baseScenario={activeScenario}
            />
          </TabsContent>

          <TabsContent value="model">
            <ForecastModel 
              historicalData={historicalData}
              scenarios={scenarios}
            />
          </TabsContent>

          <TabsContent value="compare">
            <ScenarioComparison 
              scenarios={scenarios}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}