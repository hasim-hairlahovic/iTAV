"""
iTAV Forecasting Engine - Core Implementation
Sophisticated workforce planning system implementing all algorithms from the technical specification
"""

import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from concurrent.futures import ProcessPoolExecutor
import math
import asyncio
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
import hashlib
import time
from loguru import logger

from core.config import get_settings
from core.cache import get_cache_manager
from schemas.forecast import (
    ForecastScenarioCreate, ForecastResult, AccuracyMetrics,
    SegmentAdjustments, CallVolumeFactors, StaffingParameters
)

settings = get_settings()


class SeasonalDecompositionModel:
    """
    Seasonal decomposition model for time series forecasting
    Implements additive decomposition: y(t) = Trend(t) + Seasonal(t) + Residual(t)
    """
    
    def __init__(self):
        self.trend = None
        self.seasonal = None
        self.residual = None
        self.seasonal_indices = {}
    
    def fit(self, data: pd.Series, period: int = 12) -> Dict[str, np.ndarray]:
        """
        Decompose time series into trend, seasonal, and residual components
        """
        try:
            decomposition = seasonal_decompose(
                data, 
                model='additive',
                period=period,
                extrapolate_trend='freq'
            )
            
            self.trend = decomposition.trend
            self.seasonal = decomposition.seasonal
            self.residual = decomposition.resid
            
            # Calculate seasonal indices for each month
            for i in range(12):
                month_values = self.seasonal[self.seasonal.index.month == (i + 1)]
                if len(month_values) > 0:
                    self.seasonal_indices[i + 1] = float(month_values.mean())
            
            return {
                'trend': self.trend.values,
                'seasonal': self.seasonal.values,
                'residual': self.residual.values,
                'seasonal_indices': self.seasonal_indices
            }
        except Exception as e:
            logger.error(f"Seasonal decomposition failed: {e}")
            # Fallback to simple seasonal pattern
            return self._simple_seasonal_pattern(data, period)
    
    def _simple_seasonal_pattern(self, data: pd.Series, period: int) -> Dict[str, np.ndarray]:
        """Fallback seasonal pattern calculation"""
        seasonal_pattern = np.tile(np.arange(period), len(data) // period + 1)[:len(data)]
        seasonal_pattern = (seasonal_pattern - seasonal_pattern.mean()) * 0.1
        
        trend = np.linspace(data.iloc[0], data.iloc[-1], len(data))
        residual = data.values - trend - seasonal_pattern
        
        return {
            'trend': trend,
            'seasonal': seasonal_pattern,
            'residual': residual,
            'seasonal_indices': {i+1: 0.0 for i in range(12)}
        }


class ErlangCStaffingModel:
    """
    Erlang C staffing model for call center workforce planning
    Industry standard for calculating required agents
    """
    
    @staticmethod
    def calculate_required_agents(
        call_volume: int,
        avg_handle_time: float,
        target_service_level: float = 0.8,
        target_answer_time: int = 20
    ) -> Tuple[int, float, float]:
        """
        Calculate required agents using Erlang C formula
        
        Returns:
        - required_agents: Minimum agents needed
        - utilization: Agent utilization percentage
        - achieved_service_level: Actual service level achieved
        """
        if call_volume <= 0 or avg_handle_time <= 0:
            return 0, 0.0, 0.0
        
        # Calculate traffic intensity (Erlangs)
        traffic_intensity = (call_volume * avg_handle_time) / 60  # Convert to hours
        
        if traffic_intensity <= 0:
            return 1, 0.0, 1.0
        
        # Start with minimum agents (ceil of traffic intensity)
        agents = max(1, math.ceil(traffic_intensity))
        
        # Iteratively find minimum agents to meet service level
        max_iterations = 100
        for _ in range(max_iterations):
            if agents <= traffic_intensity:
                agents += 1
                continue
            
            # Calculate Erlang C probability
            erlang_c_prob = ErlangCStaffingModel._erlang_c_probability(agents, traffic_intensity)
            
            # Calculate probability of answering within target time
            prob_within_target = 1 - (erlang_c_prob * math.exp(
                -(agents - traffic_intensity) * target_answer_time / avg_handle_time
            ))
            
            if prob_within_target >= target_service_level:
                break
            
            agents += 1
        
        utilization = traffic_intensity / agents if agents > 0 else 0.0
        achieved_service_level = prob_within_target if 'prob_within_target' in locals() else 0.0
        
        return agents, utilization, achieved_service_level
    
    @staticmethod
    def _erlang_c_probability(agents: int, traffic: float) -> float:
        """Calculate Erlang C probability"""
        try:
            numerator = (traffic ** agents / math.factorial(agents)) * (agents / (agents - traffic))
            
            denominator = sum(traffic ** k / math.factorial(k) for k in range(agents))
            denominator += (traffic ** agents / math.factorial(agents)) * (agents / (agents - traffic))
            
            return numerator / denominator
        except (OverflowError, ZeroDivisionError):
            return 0.0


class SegmentImpactModel:
    """
    Customer segment impact modeling for Medicare call patterns
    """
    
    def __init__(self):
        self.segment_call_rates = settings.SEGMENT_CALL_RATES
    
    def calculate_segment_impact(
        self, 
        member_distribution: Dict[str, int], 
        segment_adjustments: SegmentAdjustments
    ) -> float:
        """
        Calculate weighted call volume based on segment mix changes
        """
        total_weighted_rate = 0.0
        total_members = sum(member_distribution.values())
        
        if total_members == 0:
            return 0.0
        
        adjustment_map = {
            'Highly Engaged': segment_adjustments.highly_engaged,
            'Reactive Engagers': segment_adjustments.reactive_engagers,
            'Content & Complacent': segment_adjustments.content_complacent,
            'Unengaged': segment_adjustments.unengaged
        }
        
        for segment, members in member_distribution.items():
            base_rate = self.segment_call_rates.get(segment, 120)  # Default rate
            adjustment = adjustment_map.get(segment, 0.0)
            adjusted_rate = base_rate * (1 + adjustment / 100)
            
            weight = members / total_members
            total_weighted_rate += adjusted_rate * weight
        
        return total_weighted_rate / 1000  # Convert to calls per member


class MonteCarloSimulator:
    """
    Monte Carlo simulation for uncertainty quantification
    """
    
    @staticmethod
    def run_forecast_simulation(
        base_scenario: Dict[str, Any],
        iterations: int = 1000
    ) -> Dict[str, np.ndarray]:
        """
        Run Monte Carlo simulation with randomized parameters
        """
        results = {
            'predicted_members': [],
            'predicted_calls': [],
            'required_staff': []
        }
        
        for _ in range(iterations):
            # Add random variation to key parameters
            growth_rate_var = np.random.normal(0, 0.5)  # ±0.5% std dev
            seasonality_var = np.random.normal(1, 0.1)   # ±10% std dev
            handle_time_var = np.random.normal(1, 0.05)  # ±5% std dev
            
            modified_scenario = base_scenario.copy()
            modified_scenario['member_growth_rate'] += growth_rate_var
            modified_scenario['seasonality_factor'] *= seasonality_var
            modified_scenario['avg_handle_time'] *= handle_time_var
            
            # Run single forecast iteration
            iteration_result = MonteCarloSimulator._single_iteration(modified_scenario)
            
            for key in results:
                if key in iteration_result:
                    results[key].append(iteration_result[key])
        
        # Convert to numpy arrays and calculate percentiles
        percentile_results = {}
        for key, values in results.items():
            if values:
                arr = np.array(values)
                percentile_results[key] = {
                    'p10': np.percentile(arr, 10, axis=0),
                    'p25': np.percentile(arr, 25, axis=0),
                    'median': np.percentile(arr, 50, axis=0),
                    'p75': np.percentile(arr, 75, axis=0),
                    'p90': np.percentile(arr, 90, axis=0)
                }
        
        return percentile_results
    
    @staticmethod
    def _single_iteration(scenario: Dict[str, Any]) -> Dict[str, List[float]]:
        """Run a single forecast iteration"""
        # Simplified forecast calculation for Monte Carlo
        months = scenario.get('forecast_months', 12)
        base_members = scenario.get('base_members', 10000)
        growth_rate = scenario.get('member_growth_rate', 2.5) / 100
        
        results = {
            'predicted_members': [],
            'predicted_calls': [],
            'required_staff': []
        }
        
        for month in range(1, months + 1):
            members = int(base_members * (1 + growth_rate) ** month)
            calls = int(members * scenario.get('calls_per_member', 0.15))
            staff = max(1, int(calls * scenario.get('avg_handle_time', 6.2) / 8000))  # Simplified
            
            results['predicted_members'].append(members)
            results['predicted_calls'].append(calls)
            results['required_staff'].append(staff)
        
        return results


class AnomalyDetector:
    """
    Anomaly detection for identifying unusual patterns in historical data
    """
    
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
    
    def detect_anomalies(self, historical_data: pd.DataFrame) -> Tuple[pd.Index, np.ndarray]:
        """
        Identify unusual patterns that might affect forecast accuracy
        """
        if len(historical_data) < 10:
            return pd.Index([]), np.array([])
        
        # Feature engineering
        features = pd.DataFrame({
            'calls_per_member': historical_data['total_calls'] / historical_data['total_members'].clip(lower=1),
            'month': pd.to_datetime(historical_data['date']).dt.month,
            'year': pd.to_datetime(historical_data['date']).dt.year,
            'day_of_week': pd.to_datetime(historical_data['date']).dt.dayofweek
        })
        
        # Handle missing values
        features = features.fillna(features.mean())
        
        # Normalize features
        features_scaled = self.scaler.fit_transform(features)
        
        # Detect anomalies
        anomalies = self.isolation_forest.fit_predict(features_scaled)
        decision_scores = self.isolation_forest.decision_function(features_scaled)
        
        # Return anomalous periods
        anomaly_mask = anomalies == -1
        anomaly_periods = historical_data.index[anomaly_mask]
        
        return anomaly_periods, decision_scores


class AdaptiveForecastModel:
    """
    Adaptive learning model that adjusts weights based on recent accuracy
    """
    
    def __init__(self):
        self.model_weights = {
            'seasonal': 0.4,
            'trend': 0.3,
            'growth': 0.2,
            'ml_prediction': 0.1
        }
    
    def update_weights(self, recent_accuracy: Dict[str, float]):
        """
        Adjust model weights based on recent forecast accuracy
        """
        component_errors = self._calculate_component_errors(recent_accuracy)
        
        for component, error in component_errors.items():
            if component in self.model_weights:
                if error < 0.05:  # Good performance - increase weight
                    self.model_weights[component] *= 1.1
                elif error > 0.15:  # Poor performance - decrease weight
                    self.model_weights[component] *= 0.9
        
        # Normalize weights to sum to 1.0
        total_weight = sum(self.model_weights.values())
        if total_weight > 0:
            self.model_weights = {k: v/total_weight for k, v in self.model_weights.items()}
    
    def _calculate_component_errors(self, accuracy_data: Dict[str, float]) -> Dict[str, float]:
        """Calculate error rates for each model component"""
        # Simplified component error calculation
        return {
            'seasonal': accuracy_data.get('seasonal_error', 0.1),
            'trend': accuracy_data.get('trend_error', 0.1),
            'growth': accuracy_data.get('growth_error', 0.1),
            'ml_prediction': accuracy_data.get('ml_error', 0.1)
        }


class ForecastEngine:
    """
    Main forecasting engine coordinating all models and algorithms
    """
    
    def __init__(self):
        self.seasonal_model = SeasonalDecompositionModel()
        self.erlang_model = ErlangCStaffingModel()
        self.segment_model = SegmentImpactModel()
        self.anomaly_detector = AnomalyDetector()
        self.adaptive_model = AdaptiveForecastModel()
        self.cache_manager = get_cache_manager()
    
    async def generate_forecast(
        self,
        scenario: ForecastScenarioCreate,
        historical_data: Optional[pd.DataFrame] = None
    ) -> Tuple[List[ForecastResult], Dict[str, Any]]:
        """
        Generate comprehensive forecast using all models
        """
        start_time = time.time()
        
        try:
            # Load historical data if not provided
            if historical_data is None:
                historical_data = await self._load_historical_data()
            
            # Check cache for identical scenario
            scenario_hash = self._generate_scenario_hash(scenario)
            cached_result = await self.cache_manager.get_forecast_result(scenario_hash)
            if cached_result:
                logger.info(f"Using cached forecast result for scenario: {scenario.name}")
                return cached_result['results'], cached_result['metadata']
            
            # Detect anomalies in historical data
            anomaly_periods, _ = self.anomaly_detector.detect_anomalies(historical_data)
            
            # Perform seasonal decomposition
            decomposition = await self._perform_seasonal_decomposition(historical_data)
            
            # Calculate base metrics
            base_metrics = self._calculate_base_metrics(historical_data)
            
            # Generate forecast results
            forecast_results = []
            base_date = scenario.base_month
            
            for month_offset in range(1, scenario.forecast_months + 1):
                forecast_month = base_date + relativedelta(months=month_offset)
                month_result = await self._forecast_single_month(
                    forecast_month,
                    month_offset,
                    scenario,
                    base_metrics,
                    decomposition
                )
                forecast_results.append(month_result)
            
            # Run Monte Carlo simulation for confidence intervals
            if scenario.monte_carlo_iterations > 0:
                confidence_intervals = await self._run_monte_carlo(scenario, base_metrics)
                # Apply confidence intervals to results
                self._apply_confidence_intervals(forecast_results, confidence_intervals)
            
            # Calculate metadata
            computation_time = time.time() - start_time
            metadata = {
                'computation_time': computation_time,
                'anomaly_count': len(anomaly_periods),
                'data_quality_score': self._calculate_data_quality_score(historical_data),
                'model_weights': self.adaptive_model.model_weights.copy()
            }
            
            # Cache results
            cache_data = {
                'results': forecast_results,
                'metadata': metadata
            }
            await self.cache_manager.cache_forecast_result(scenario_hash, cache_data)
            
            logger.info(f"Forecast generated in {computation_time:.2f} seconds for scenario: {scenario.name}")
            return forecast_results, metadata
            
        except Exception as e:
            logger.error(f"Forecast generation failed: {e}")
            raise
    
    async def _load_historical_data(self) -> pd.DataFrame:
        """Load historical data from database"""
        # This would be implemented to load from the actual database
        # For now, return sample data structure
        sample_data = pd.DataFrame({
            'date': pd.date_range('2023-01-01', '2024-06-01', freq='MS'),
            'total_members': np.random.randint(8000, 12000, 18),
            'total_calls': np.random.randint(1200, 2000, 18),
            'avg_handle_time': np.random.uniform(5.5, 7.0, 18)
        })
        return sample_data
    
    async def _perform_seasonal_decomposition(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Perform seasonal decomposition with caching"""
        data_hash = hashlib.md5(str(data.values.tobytes()).encode()).hexdigest()
        
        # Check cache first
        cached_decomposition = await self.cache_manager.get_seasonal_patterns(data_hash)
        if cached_decomposition:
            return cached_decomposition
        
        # Perform decomposition
        if 'total_calls' in data.columns and len(data) >= 24:
            call_series = pd.Series(data['total_calls'].values, index=pd.to_datetime(data['date']))
            decomposition = self.seasonal_model.fit(call_series)
        else:
            # Fallback for insufficient data
            decomposition = {'seasonal_indices': {i+1: 0.0 for i in range(12)}}
        
        # Cache results
        await self.cache_manager.cache_seasonal_patterns(data_hash, decomposition)
        return decomposition
    
    def _calculate_base_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate base metrics from historical data"""
        if len(data) == 0:
            return {
                'base_members': 10000,
                'base_calls_per_member': 0.15,
                'base_handle_time': 6.2,
                'growth_trend': 0.025
            }
        
        latest_data = data.iloc[-1]
        total_members = latest_data.get('total_members', 10000)
        total_calls = latest_data.get('total_calls', 1500)
        
        return {
            'base_members': float(total_members),
            'base_calls_per_member': float(total_calls / max(total_members, 1)),
            'base_handle_time': float(latest_data.get('avg_handle_time', 6.2)),
            'growth_trend': self._calculate_growth_trend(data)
        }
    
    def _calculate_growth_trend(self, data: pd.DataFrame) -> float:
        """Calculate historical growth trend"""
        if len(data) < 3:
            return 0.025  # Default 2.5% monthly growth
        
        members_data = data['total_members'].values
        growth_rates = []
        
        for i in range(1, len(members_data)):
            if members_data[i-1] > 0:
                growth_rate = (members_data[i] - members_data[i-1]) / members_data[i-1]
                growth_rates.append(growth_rate)
        
        return float(np.mean(growth_rates)) if growth_rates else 0.025
    
    async def _forecast_single_month(
        self,
        forecast_month: date,
        month_offset: int,
        scenario: ForecastScenarioCreate,
        base_metrics: Dict[str, float],
        decomposition: Dict[str, Any]
    ) -> ForecastResult:
        """Generate forecast for a single month"""
        
        # Calculate predicted members
        growth_factor = (1 + scenario.member_growth_rate / 100) ** month_offset
        predicted_members = int(base_metrics['base_members'] * growth_factor)
        
        # Apply seasonal factors
        month_num = forecast_month.month
        seasonal_factor = decomposition.get('seasonal_indices', {}).get(month_num, 0.0)
        seasonal_multiplier = 1.0 + seasonal_factor
        
        # Apply Medicare specific seasonal patterns
        medicare_multiplier = self._get_medicare_seasonal_multiplier(month_num)
        
        # Calculate segment impact
        default_distribution = {
            'Highly Engaged': predicted_members * 0.25,
            'Reactive Engagers': predicted_members * 0.35,
            'Content & Complacent': predicted_members * 0.25,
            'Unengaged': predicted_members * 0.15
        }
        
        calls_per_member = self.segment_model.calculate_segment_impact(
            default_distribution, 
            scenario.segment_adjustments
        )
        
        # Apply all volume factors
        total_volume_factor = (
            scenario.call_volume_factors.seasonal_factor *
            scenario.call_volume_factors.engagement_impact *
            scenario.call_volume_factors.product_mix_impact *
            scenario.call_volume_factors.regulatory_impact *
            seasonal_multiplier *
            medicare_multiplier
        )
        
        predicted_calls = int(predicted_members * calls_per_member * total_volume_factor)
        
        # Calculate staffing requirements using Erlang C
        required_staff, utilization, service_level = self.erlang_model.calculate_required_agents(
            predicted_calls,
            scenario.staffing_parameters.avg_handle_time,
            scenario.staffing_parameters.target_service_level,
            scenario.staffing_parameters.target_answer_time
        )
        
        required_supervisors = max(1, int(required_staff * scenario.staffing_parameters.supervisor_ratio))
        
        return ForecastResult(
            month=forecast_month.strftime('%Y-%m'),
            predicted_members=predicted_members,
            predicted_calls=predicted_calls,
            calls_per_member=calls_per_member,
            required_staff=required_staff,
            required_supervisors=required_supervisors,
            agent_utilization=utilization,
            service_level=service_level
        )
    
    def _get_medicare_seasonal_multiplier(self, month: int) -> float:
        """Get Medicare-specific seasonal multipliers"""
        seasonal_factors = settings.MEDICARE_SEASONAL_FACTORS
        
        # Check each seasonal period
        for period_name, period_data in seasonal_factors.items():
            if month in period_data['months']:
                return period_data['call_multiplier']
        
        return 1.0  # Default multiplier
    
    async def _run_monte_carlo(
        self, 
        scenario: ForecastScenarioCreate, 
        base_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """Run Monte Carlo simulation for uncertainty quantification"""
        
        base_scenario_dict = {
            'forecast_months': scenario.forecast_months,
            'member_growth_rate': scenario.member_growth_rate,
            'base_members': base_metrics['base_members'],
            'calls_per_member': base_metrics['base_calls_per_member'],
            'avg_handle_time': scenario.staffing_parameters.avg_handle_time,
            'seasonality_factor': scenario.call_volume_factors.seasonal_factor
        }
        
        return MonteCarloSimulator.run_forecast_simulation(
            base_scenario_dict,
            scenario.monte_carlo_iterations
        )
    
    def _apply_confidence_intervals(
        self, 
        forecast_results: List[ForecastResult], 
        confidence_intervals: Dict[str, Any]
    ):
        """Apply Monte Carlo confidence intervals to forecast results"""
        for i, result in enumerate(forecast_results):
            if i < len(confidence_intervals.get('predicted_members', {}).get('p25', [])):
                result.members_confidence = {
                    'p10': int(confidence_intervals['predicted_members']['p10'][i]),
                    'p25': int(confidence_intervals['predicted_members']['p25'][i]),
                    'p75': int(confidence_intervals['predicted_members']['p75'][i]),
                    'p90': int(confidence_intervals['predicted_members']['p90'][i])
                }
                
                result.calls_confidence = {
                    'p10': int(confidence_intervals['predicted_calls']['p10'][i]),
                    'p25': int(confidence_intervals['predicted_calls']['p25'][i]),
                    'p75': int(confidence_intervals['predicted_calls']['p75'][i]),
                    'p90': int(confidence_intervals['predicted_calls']['p90'][i])
                }
                
                result.staff_confidence = {
                    'p10': int(confidence_intervals['required_staff']['p10'][i]),
                    'p25': int(confidence_intervals['required_staff']['p25'][i]),
                    'p75': int(confidence_intervals['required_staff']['p75'][i]),
                    'p90': int(confidence_intervals['required_staff']['p90'][i])
                }
    
    def _calculate_data_quality_score(self, data: pd.DataFrame) -> float:
        """Calculate data quality score (0-1)"""
        if len(data) == 0:
            return 0.0
        
        score = 1.0
        
        # Penalize for missing data
        missing_ratio = data.isnull().sum().sum() / (len(data) * len(data.columns))
        score -= missing_ratio * 0.3
        
        # Penalize for insufficient data points
        if len(data) < 12:
            score -= (12 - len(data)) * 0.05
        
        # Penalize for extreme outliers
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            q99 = data[col].quantile(0.99)
            q01 = data[col].quantile(0.01)
            outlier_ratio = len(data[(data[col] > q99) | (data[col] < q01)]) / len(data)
            score -= outlier_ratio * 0.1
        
        return max(0.0, min(1.0, score))
    
    def _generate_scenario_hash(self, scenario: ForecastScenarioCreate) -> str:
        """Generate hash for scenario caching"""
        scenario_str = (
            f"{scenario.name}_{scenario.base_month}_{scenario.forecast_months}_"
            f"{scenario.member_growth_rate}_{scenario.segment_adjustments}_{scenario.call_volume_factors}_"
            f"{scenario.staffing_parameters}_{scenario.monte_carlo_iterations}"
        )
        return hashlib.md5(scenario_str.encode()).hexdigest()
    
    async def calculate_accuracy_metrics(
        self, 
        actual: List[float], 
        predicted: List[float]
    ) -> AccuracyMetrics:
        """Calculate forecast accuracy metrics"""
        actual_arr = np.array(actual)
        predicted_arr = np.array(predicted)
        
        if len(actual_arr) == 0 or len(predicted_arr) == 0:
            return AccuracyMetrics(
                mape=0.0, mae=0.0, rmse=0.0, wmape=0.0, smape=0.0, r_squared=0.0
            )
        
        # Mean Absolute Percentage Error (MAPE)
        mape = np.mean(np.abs((actual_arr - predicted_arr) / np.clip(actual_arr, 1e-10, None))) * 100
        
        # Mean Absolute Error (MAE)
        mae = np.mean(np.abs(actual_arr - predicted_arr))
        
        # Root Mean Square Error (RMSE)
        rmse = np.sqrt(np.mean((actual_arr - predicted_arr) ** 2))
        
        # Weighted MAPE
        wmape = np.sum(np.abs(actual_arr - predicted_arr)) / np.sum(actual_arr) * 100
        
        # Symmetric MAPE
        smape = np.mean(2 * np.abs(actual_arr - predicted_arr) / 
                       (np.abs(actual_arr) + np.abs(predicted_arr))) * 100
        
        # R-squared
        ss_res = np.sum((actual_arr - predicted_arr) ** 2)
        ss_tot = np.sum((actual_arr - np.mean(actual_arr)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0.0
        
        return AccuracyMetrics(
            mape=float(mape),
            mae=float(mae),
            rmse=float(rmse),
            wmape=float(wmape),
            smape=float(smape),
            r_squared=float(r_squared)
        ) 