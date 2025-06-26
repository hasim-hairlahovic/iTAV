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
  const [activeTab, setActiveTab] = useState("results");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load historical data and scenarios in parallel
      const [membership, calls, headcount, savedScenarios] = await Promise.all([
        MembershipData.list("-date"),
        CallData.list("-date"),
        HeadcountData.list("-date"),
        // Load scenarios from the Node.js database
        fetch('/api/forecast')
          .then(response => response.ok ? response.json() : [])
          .catch(error => {
            console.warn("Could not load scenarios from database:", error);
            return [];
          })
      ]);
      
      setHistoricalData({ membership, calls, headcount });
      
      // Transform database scenarios to frontend format
      const transformedScenarios = savedScenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        base_month: scenario.base_month || scenario.forecast_date,
        forecast_months: scenario.forecast_months || 12,
        member_growth_rate: scenario.member_growth_rate || 2.5,
        forecast_results: scenario.forecast_results || [],
        scenario_type: scenario.scenario_type || 'realistic',
        created_at: scenario.created_at,
        updated_at: scenario.updated_at,
        computation_time: scenario.computation_time || 0,
        confidence_intervals: scenario.confidence_intervals || {},
        segment_adjustments: scenario.segment_adjustments || {},
        call_volume_factors: scenario.call_volume_factors || {},
        staffing_parameters: scenario.staffing_parameters || {}
      }));
      
      setScenarios(transformedScenarios);
      
      if (transformedScenarios.length > 0) {
        setActiveScenario(transformedScenarios[0]);
      }
      
      console.log(`Loaded ${transformedScenarios.length} forecast scenarios`);
    } catch (error) {
      console.error("Error loading forecasting data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBaseline = async () => {
    setIsGenerating(true);
    
    try {
      console.log('Generating baseline forecast using Python service...');
      
      // Call the Python forecasting service via Node.js API
      const response = await fetch('/api/forecast/baseline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forecast_months: 12
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate baseline forecast');
      }

      const forecastData = await response.json();
      console.log('Baseline forecast generated successfully:', forecastData);

      // Convert Python service response to our format
      const baselineScenario = {
        id: forecastData.scenario_id || `baseline-${Date.now()}`,
        name: "Baseline Forecast",
        description: "Standard forecast based on historical trends and sophisticated algorithms",
        base_month: new Date().toISOString().slice(0, 10),
        forecast_months: 12,
        member_growth_rate: 2.5,
        forecast_results: forecastData.forecast_results || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        computation_time: forecastData.computation_time || 0,
        confidence_intervals: forecastData.confidence_intervals || {},
        scenario_type: 'baseline'
      };

      // Save to database via Node.js API
      const saveResponse = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: baselineScenario.name,
          description: baselineScenario.description,
          forecast_date: baselineScenario.base_month,
          predicted_members: baselineScenario.forecast_results.length > 0 ? 
            baselineScenario.forecast_results[baselineScenario.forecast_results.length - 1].predicted_members : 0,
          predicted_calls: baselineScenario.forecast_results.length > 0 ? 
            baselineScenario.forecast_results[baselineScenario.forecast_results.length - 1].predicted_calls : 0,
          confidence_level: 0.9,
          scenario_type: 'baseline',
          base_month: baselineScenario.base_month,
          forecast_months: baselineScenario.forecast_months,
          member_growth_rate: baselineScenario.member_growth_rate,
          forecast_results: baselineScenario.forecast_results,
          confidence_intervals: baselineScenario.confidence_intervals,
          computation_time: baselineScenario.computation_time
        })
      });

      if (saveResponse.ok) {
        const savedScenario = await saveResponse.json();
        baselineScenario.id = savedScenario.id;
        console.log('Baseline scenario saved to database:', savedScenario.id);
      } else {
        console.warn('Failed to save baseline scenario to database, using temporary ID');
      }

      // Add to scenarios list
      setScenarios(prev => [baselineScenario, ...prev]);
      setActiveScenario(baselineScenario);
      
      // If there are other scenarios, navigate to Compare tab to show comparison
      if (scenarios.length > 0) {
        console.log(`✅ Baseline forecast created successfully!`);
        setTimeout(() => {
          setActiveTab("compare");
        }, 500);
      }
      
    } catch (error) {
      console.error("Error generating baseline:", error);
      alert(`Failed to generate baseline forecast: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };



  const handleScenarioSave = async (scenarioData) => {
    try {
      console.log('Generating custom forecast scenario using Python service...');
      
      // Call the Python forecasting service to generate the forecast
      const response = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_data: {
            name: scenarioData.name,
            description: scenarioData.description,
            base_month: scenarioData.base_month || new Date().toISOString().slice(0, 10),
            forecast_months: scenarioData.forecast_months || 12,
            member_growth_rate: scenarioData.member_growth_rate || 2.5,
            segment_adjustments: scenarioData.segment_adjustments || {
              highly_engaged: 0,
              reactive_engagers: 0,
              content_complacent: 0,
              unengaged: 0
            },
            call_volume_factors: scenarioData.call_volume_factors || {
              seasonal_factor: 1.0,
              engagement_impact: 1.0,
              product_mix_impact: 1.0,
              regulatory_impact: 1.0
            },
            staffing_parameters: scenarioData.staffing_parameters || {
              avg_handle_time: 6.2,
              hours_per_agent: 160,
              utilization_target: 0.85,
              supervisor_ratio: 0.12,
              target_service_level: 0.8,
              target_answer_time: 20
            },
            monte_carlo_iterations: scenarioData.monte_carlo_iterations || 1000,
            confidence_level: scenarioData.confidence_level || 0.9
          },
          save_scenario: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate forecast scenario');
      }

      const forecastData = await response.json();
      console.log('Custom forecast scenario generated successfully:', forecastData);

      // Convert Python service response to our format
      const completeScenario = {
        id: forecastData.scenario_id || `scenario-${Date.now()}`,
        name: scenarioData.name,
        description: scenarioData.description,
        base_month: scenarioData.base_month || new Date().toISOString().slice(0, 10),
        forecast_months: scenarioData.forecast_months || 12,
        member_growth_rate: scenarioData.member_growth_rate || 2.5,
        forecast_results: forecastData.forecast_results || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        computation_time: forecastData.computation_time || 0,
        confidence_intervals: forecastData.confidence_intervals || {},
        scenario_type: 'custom',
        // Include original scenario parameters
        segment_adjustments: scenarioData.segment_adjustments,
        call_volume_factors: scenarioData.call_volume_factors,
        staffing_parameters: scenarioData.staffing_parameters
      };

      // Save to database via Node.js API
      const saveResponse = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: completeScenario.name,
          description: completeScenario.description,
          forecast_date: completeScenario.base_month,
          predicted_members: completeScenario.forecast_results.length > 0 ? 
            completeScenario.forecast_results[completeScenario.forecast_results.length - 1].predicted_members : 0,
          predicted_calls: completeScenario.forecast_results.length > 0 ? 
            completeScenario.forecast_results[completeScenario.forecast_results.length - 1].predicted_calls : 0,
          confidence_level: scenarioData.confidence_level || 0.9,
          scenario_type: 'custom',
          base_month: completeScenario.base_month,
          forecast_months: completeScenario.forecast_months,
          member_growth_rate: completeScenario.member_growth_rate,
          forecast_results: completeScenario.forecast_results,
          segment_adjustments: completeScenario.segment_adjustments,
          call_volume_factors: completeScenario.call_volume_factors,
          staffing_parameters: completeScenario.staffing_parameters,
          confidence_intervals: completeScenario.confidence_intervals,
          computation_time: completeScenario.computation_time
        })
      });

      if (saveResponse.ok) {
        const savedScenario = await saveResponse.json();
        completeScenario.id = savedScenario.id;
        console.log('Custom scenario saved to database:', savedScenario.id);
      } else {
        console.warn('Failed to save custom scenario to database, using temporary ID');
      }
      
      setScenarios(prev => [completeScenario, ...prev]);
      setActiveScenario(completeScenario);
      
      // Show success feedback and navigate to Compare tab
      console.log(`✅ Scenario "${scenarioData.name}" created successfully!`);
      
      // Automatically navigate to Compare tab after a brief delay
      setTimeout(() => {
        setActiveTab("compare");
      }, 500);
      
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert(`Failed to generate forecast scenario: ${error.message}`);
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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