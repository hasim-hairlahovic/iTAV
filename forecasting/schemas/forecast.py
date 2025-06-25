"""
Pydantic schemas for forecasting API requests and responses
"""

from pydantic import BaseModel, Field, validator, root_validator
from typing import Dict, List, Optional, Union, Any
from datetime import date, datetime
from enum import Enum
import uuid


class ScenarioType(str, Enum):
    """Forecast scenario types"""
    OPTIMISTIC = "optimistic"
    REALISTIC = "realistic"
    PESSIMISTIC = "pessimistic"
    CUSTOM = "custom"


class SegmentAdjustments(BaseModel):
    """Customer segment adjustments"""
    highly_engaged: float = Field(default=0.0, ge=-50.0, le=100.0, description="Adjustment % for highly engaged segment")
    reactive_engagers: float = Field(default=0.0, ge=-50.0, le=100.0, description="Adjustment % for reactive engagers")
    content_complacent: float = Field(default=0.0, ge=-50.0, le=100.0, description="Adjustment % for content & complacent")
    unengaged: float = Field(default=0.0, ge=-50.0, le=100.0, description="Adjustment % for unengaged segment")


class CallVolumeFactors(BaseModel):
    """Call volume adjustment factors"""
    seasonal_factor: float = Field(default=1.0, ge=0.1, le=3.0, description="Seasonal adjustment factor")
    engagement_impact: float = Field(default=1.0, ge=0.1, le=3.0, description="Customer engagement impact factor")
    product_mix_impact: float = Field(default=1.0, ge=0.1, le=3.0, description="Product mix impact factor")
    regulatory_impact: float = Field(default=1.0, ge=0.1, le=3.0, description="Regulatory changes impact factor")


class StaffingParameters(BaseModel):
    """Staffing calculation parameters"""
    avg_handle_time: float = Field(default=6.2, ge=1.0, le=20.0, description="Average handle time in minutes")
    hours_per_agent: int = Field(default=160, ge=80, le=200, description="Working hours per agent per month")
    utilization_target: float = Field(default=0.85, ge=0.5, le=0.95, description="Target agent utilization rate")
    supervisor_ratio: float = Field(default=0.12, ge=0.05, le=0.25, description="Supervisor to agent ratio")
    target_service_level: float = Field(default=0.8, ge=0.5, le=0.99, description="Target service level (% answered within target time)")
    target_answer_time: int = Field(default=20, ge=5, le=60, description="Target answer time in seconds")


class RegulatoryChan1ges(BaseModel):
    """Regulatory changes that affect call volume"""
    benefit_changes: bool = Field(default=False, description="Benefit structure changes")
    formulary_updates: bool = Field(default=False, description="Drug formulary updates")
    network_changes: bool = Field(default=False, description="Provider network changes")
    premium_changes: bool = Field(default=False, description="Premium structure changes")


class ForecastScenarioCreate(BaseModel):
    """Create forecast scenario request"""
    name: str = Field(..., min_length=1, max_length=255, description="Scenario name")
    description: Optional[str] = Field(None, max_length=1000, description="Scenario description")
    base_month: date = Field(..., description="Base month for forecast (YYYY-MM-DD)")
    forecast_months: int = Field(default=12, ge=1, le=24, description="Number of months to forecast")
    
    # Growth parameters
    member_growth_rate: float = Field(default=2.5, ge=-10.0, le=20.0, description="Monthly member growth rate %")
    
    # Segment adjustments
    segment_adjustments: SegmentAdjustments = Field(default_factory=SegmentAdjustments)
    
    # Call volume factors
    call_volume_factors: CallVolumeFactors = Field(default_factory=CallVolumeFactors)
    
    # Staffing parameters
    staffing_parameters: StaffingParameters = Field(default_factory=StaffingParameters)
    
    # Regulatory changes
    regulatory_changes: RegulatoryChan1ges = Field(default_factory=RegulatoryChan1ges)
    
    # Monte Carlo simulation
    monte_carlo_iterations: int = Field(default=1000, ge=100, le=10000, description="Monte Carlo iterations")
    confidence_level: float = Field(default=0.9, ge=0.8, le=0.99, description="Confidence level for intervals")
    
    @validator('base_month')
    def validate_base_month(cls, v):
        if v < date.today():
            raise ValueError("Base month cannot be in the past")
        return v


class ForecastResult(BaseModel):
    """Individual month forecast result"""
    month: str = Field(..., description="Forecast month (YYYY-MM)")
    predicted_members: int = Field(..., description="Predicted total members")
    predicted_calls: int = Field(..., description="Predicted total calls")
    calls_per_member: float = Field(..., description="Calls per member ratio")
    required_staff: int = Field(..., description="Required staff count")
    required_supervisors: int = Field(..., description="Required supervisor count")
    agent_utilization: float = Field(..., description="Projected agent utilization rate")
    service_level: float = Field(..., description="Projected service level achievement")
    
    # Confidence intervals (from Monte Carlo simulation)
    members_confidence: Optional[Dict[str, int]] = Field(None, description="Member count confidence intervals")
    calls_confidence: Optional[Dict[str, int]] = Field(None, description="Call volume confidence intervals")
    staff_confidence: Optional[Dict[str, int]] = Field(None, description="Staff count confidence intervals")


class AccuracyMetrics(BaseModel):
    """Forecast accuracy metrics"""
    mape: float = Field(..., description="Mean Absolute Percentage Error")
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Square Error")
    wmape: float = Field(..., description="Weighted Mean Absolute Percentage Error")
    smape: float = Field(..., description="Symmetric Mean Absolute Percentage Error")
    r_squared: float = Field(..., description="R-squared correlation coefficient")


class ForecastScenarioResponse(BaseModel):
    """Forecast scenario response"""
    id: str = Field(..., description="Scenario unique identifier")
    name: str = Field(..., description="Scenario name")
    description: Optional[str] = Field(None, description="Scenario description")
    scenario_type: ScenarioType = Field(..., description="Scenario type")
    
    # Request parameters
    base_month: date = Field(..., description="Base month for forecast")
    forecast_months: int = Field(..., description="Number of months forecasted")
    member_growth_rate: float = Field(..., description="Member growth rate used")
    
    # Results
    forecast_results: List[ForecastResult] = Field(..., description="Month-by-month forecast results")
    accuracy_metrics: Optional[AccuracyMetrics] = Field(None, description="Accuracy metrics (if historical data available)")
    
    # Metadata
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    computation_time: Optional[float] = Field(None, description="Computation time in seconds")


class ForecastRequest(BaseModel):
    """Direct forecast request (without saving scenario)"""
    scenario_data: ForecastScenarioCreate = Field(..., description="Forecast scenario parameters")
    save_scenario: bool = Field(default=False, description="Whether to save scenario for future reference")


class ForecastResponse(BaseModel):
    """Direct forecast response"""
    forecast_results: List[ForecastResult] = Field(..., description="Forecast results")
    scenario_id: Optional[str] = Field(None, description="Scenario ID if saved")
    computation_time: float = Field(..., description="Computation time in seconds")
    confidence_intervals: Dict[str, Any] = Field(..., description="Confidence intervals and uncertainty metrics")


class HistoricalData(BaseModel):
    """Historical data for forecast input"""
    membership_data: List[Dict[str, Any]] = Field(..., description="Historical membership data")
    call_data: List[Dict[str, Any]] = Field(..., description="Historical call data")
    headcount_data: List[Dict[str, Any]] = Field(..., description="Historical headcount data")


class BacktestRequest(BaseModel):
    """Backtest request for model validation"""
    start_date: date = Field(..., description="Start date for backtesting")
    end_date: date = Field(..., description="End date for backtesting")
    forecast_horizon: int = Field(default=6, ge=1, le=12, description="Forecast horizon in months")
    validation_method: str = Field(default="rolling", description="Validation method (rolling, expanding)")


class BacktestResult(BaseModel):
    """Backtest result"""
    test_period: str = Field(..., description="Test period")
    actual_values: List[float] = Field(..., description="Actual values")
    predicted_values: List[float] = Field(..., description="Predicted values")
    accuracy_metrics: AccuracyMetrics = Field(..., description="Accuracy metrics for this period")


class BacktestResponse(BaseModel):
    """Backtest response"""
    overall_accuracy: AccuracyMetrics = Field(..., description="Overall accuracy across all test periods")
    period_results: List[BacktestResult] = Field(..., description="Results for each test period")
    model_performance: Dict[str, float] = Field(..., description="Model component performance breakdown")


class ModelDiagnostics(BaseModel):
    """Model diagnostics and health metrics"""
    data_quality_score: float = Field(..., description="Data quality score (0-1)")
    model_stability: float = Field(..., description="Model stability score (0-1)")
    seasonal_strength: float = Field(..., description="Seasonal pattern strength")
    trend_strength: float = Field(..., description="Trend pattern strength")
    outlier_count: int = Field(..., description="Number of outliers detected")
    last_calibration: datetime = Field(..., description="Last model calibration timestamp")
    next_calibration: datetime = Field(..., description="Next recommended calibration")


class ScenarioComparison(BaseModel):
    """Scenario comparison request"""
    scenario_ids: List[str] = Field(..., min_items=2, max_items=5, description="Scenario IDs to compare")
    comparison_metrics: List[str] = Field(
        default=["predicted_calls", "required_staff", "member_growth"],
        description="Metrics to compare across scenarios"
    )


class ComparisonResult(BaseModel):
    """Scenario comparison result"""
    metric: str = Field(..., description="Comparison metric")
    scenarios: Dict[str, List[float]] = Field(..., description="Values by scenario over time")
    variance_analysis: Dict[str, float] = Field(..., description="Variance statistics across scenarios")


class ScenarioComparisonResponse(BaseModel):
    """Scenario comparison response"""
    comparison_results: List[ComparisonResult] = Field(..., description="Comparison results by metric")
    summary_statistics: Dict[str, Any] = Field(..., description="Summary statistics")
    recommendations: List[str] = Field(..., description="Analysis recommendations") 