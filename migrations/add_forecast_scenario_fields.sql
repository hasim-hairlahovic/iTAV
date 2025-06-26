-- Migration to add new fields to forecast_scenarios table
-- This migration adds support for storing complete scenario data

-- Add new columns to forecast_scenarios table
ALTER TABLE forecast_scenarios 
ADD COLUMN IF NOT EXISTS base_month DATE,
ADD COLUMN IF NOT EXISTS forecast_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS member_growth_rate REAL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS forecast_results JSONB,
ADD COLUMN IF NOT EXISTS segment_adjustments JSONB,
ADD COLUMN IF NOT EXISTS call_volume_factors JSONB,
ADD COLUMN IF NOT EXISTS staffing_parameters JSONB,
ADD COLUMN IF NOT EXISTS confidence_intervals JSONB,
ADD COLUMN IF NOT EXISTS computation_time REAL DEFAULT 0.0;

-- Update the scenario_type enum to include new types
ALTER TABLE forecast_scenarios DROP CONSTRAINT IF EXISTS forecast_scenarios_scenario_type_check;
ALTER TABLE forecast_scenarios ADD CONSTRAINT forecast_scenarios_scenario_type_check 
CHECK (scenario_type IN ('optimistic', 'realistic', 'pessimistic', 'baseline', 'custom'));

-- Update existing records to have default values for new fields
UPDATE forecast_scenarios 
SET 
  base_month = forecast_date,
  forecast_months = 12,
  member_growth_rate = 2.5,
  computation_time = 0.0
WHERE base_month IS NULL; 