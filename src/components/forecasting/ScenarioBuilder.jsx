import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Save, Settings, Users, TrendingUp } from "lucide-react";

export default function ScenarioBuilder({ historicalData, onSave, baseScenario }) {
  const [scenario, setScenario] = useState({
    name: "",
    description: "",
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
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!scenario.name.trim()) {
      alert("Please enter a scenario name");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(scenario);
      // Reset form
      setScenario(prev => ({
        ...prev,
        name: "",
        description: ""
      }));
    } catch (error) {
      console.error("Error saving scenario:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSegmentAdjustment = (segment, value) => {
    setScenario(prev => ({
      ...prev,
      segment_adjustments: {
        ...prev.segment_adjustments,
        [segment]: value[0]
      }
    }));
  };

  const updateCallFactor = (factor, value) => {
    setScenario(prev => ({
      ...prev,
      call_volume_factors: {
        ...prev.call_volume_factors,
        [factor]: value[0]
      }
    }));
  };

  const updateStaffingParam = (param, value) => {
    setScenario(prev => ({
      ...prev,
      staffing_parameters: {
        ...prev.staffing_parameters,
        [param]: value[0]
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Settings className="w-5 h-5 text-emerald-600" />
            Scenario Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={scenario.name}
                onChange={(e) => setScenario(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High Growth Scenario"
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="forecast_months">Forecast Period (months)</Label>
              <Input
                id="forecast_months"
                type="number"
                min="1"
                max="36"
                value={scenario.forecast_months}
                onChange={(e) => setScenario(prev => ({ ...prev, forecast_months: parseInt(e.target.value) || 12 }))}
                className="bg-white"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={scenario.description}
              onChange={(e) => setScenario(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the scenario assumptions and context"
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Growth Parameters */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Growth & Volume Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Monthly Member Growth Rate</Label>
              <span className="text-sm font-semibold text-slate-600">{scenario.member_growth_rate}%</span>
            </div>
            <Slider
              value={[scenario.member_growth_rate]}
              onValueChange={(value) => setScenario(prev => ({ ...prev, member_growth_rate: value[0] }))}
              min={-5}
              max={10}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>-5%</span>
              <span>10%</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Seasonal Factor</Label>
                <span className="text-sm font-semibold text-slate-600">{scenario.call_volume_factors.seasonal_factor.toFixed(2)}x</span>
              </div>
              <Slider
                value={[scenario.call_volume_factors.seasonal_factor]}
                onValueChange={(value) => updateCallFactor('seasonal_factor', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Engagement Impact</Label>
                <span className="text-sm font-semibold text-slate-600">{scenario.call_volume_factors.engagement_impact.toFixed(2)}x</span>
              </div>
              <Slider
                value={[scenario.call_volume_factors.engagement_impact]}
                onValueChange={(value) => updateCallFactor('engagement_impact', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Product Mix Impact</Label>
                <span className="text-sm font-semibold text-slate-600">{scenario.call_volume_factors.product_mix_impact.toFixed(2)}x</span>
              </div>
              <Slider
                value={[scenario.call_volume_factors.product_mix_impact]}
                onValueChange={(value) => updateCallFactor('product_mix_impact', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segment Adjustments */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-purple-600" />
            Customer Segment Mix Changes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(scenario.segment_adjustments).map(([segment, value]) => (
            <div key={segment}>
              <div className="flex justify-between items-center mb-2">
                <Label className="capitalize">
                  {segment.replace(/_/g, ' ')} Adjustment
                </Label>
                <span className="text-sm font-semibold text-slate-600">
                  {value > 0 ? '+' : ''}{value}%
                </span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(newValue) => updateSegmentAdjustment(segment, newValue)}
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>-20%</span>
                <span>+20%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Staffing Parameters */}
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-orange-600" />
            Staffing Model Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Average Handle Time (minutes)</Label>
                <span className="text-sm font-semibold text-slate-600">{scenario.staffing_parameters.avg_handle_time.toFixed(1)}</span>
              </div>
              <Slider
                value={[scenario.staffing_parameters.avg_handle_time]}
                onValueChange={(value) => updateStaffingParam('avg_handle_time', value)}
                min={3}
                max={15}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Hours per Agent (monthly)</Label>
                <span className="text-sm font-semibold text-slate-600">{scenario.staffing_parameters.hours_per_agent}</span>
              </div>
              <Slider
                value={[scenario.staffing_parameters.hours_per_agent]}
                onValueChange={(value) => updateStaffingParam('hours_per_agent', value)}
                min={120}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Utilization Target</Label>
                <span className="text-sm font-semibold text-slate-600">{(scenario.staffing_parameters.utilization_target * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[scenario.staffing_parameters.utilization_target]}
                onValueChange={(value) => updateStaffingParam('utilization_target', value)}
                min={0.6}
                max={0.95}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Supervisor Ratio</Label>
                <span className="text-sm font-semibold text-slate-600">{(scenario.staffing_parameters.supervisor_ratio * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[scenario.staffing_parameters.supervisor_ratio]}
                onValueChange={(value) => updateStaffingParam('supervisor_ratio', value)}
                min={0.05}
                max={0.25}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving || !scenario.name.trim()}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Save className="w-5 h-5 mr-2 animate-spin" />
              Saving Scenario...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save & Generate Forecast
            </>
          )}
        </Button>
      </div>
    </div>
  );
}