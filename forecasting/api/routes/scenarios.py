"""
Scenario management API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from core.database import get_database
from schemas.forecast import (
    ForecastScenarioCreate, ForecastScenarioResponse,
    ScenarioComparison, ScenarioComparisonResponse
)
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/", response_model=List[ForecastScenarioResponse])
async def list_scenarios(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at"),
    order: str = Query(default="desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_database)
) -> List[ForecastScenarioResponse]:
    """
    List all forecast scenarios with pagination and sorting
    """
    try:
        # This would implement actual database query
        # For now, return sample scenarios
        
        sample_scenarios = [
            ForecastScenarioResponse(
                id="scenario-1",
                name="Q4 2024 Baseline",
                description="Conservative forecast for Q4 2024",
                scenario_type="realistic",
                base_month=datetime(2024, 10, 1).date(),
                forecast_months=12,
                member_growth_rate=2.5,
                forecast_results=[],
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            ForecastScenarioResponse(
                id="scenario-2", 
                name="Aggressive Growth Scenario",
                description="Optimistic growth projection",
                scenario_type="optimistic",
                base_month=datetime(2024, 10, 1).date(),
                forecast_months=12,
                member_growth_rate=5.0,
                forecast_results=[],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
        
        logger.info(f"Retrieved {len(sample_scenarios)} scenarios")
        return sample_scenarios
        
    except Exception as e:
        logger.error(f"Failed to list scenarios: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list scenarios: {str(e)}"
        )


@router.get("/{scenario_id}", response_model=ForecastScenarioResponse)
async def get_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_database)
) -> ForecastScenarioResponse:
    """
    Get a specific forecast scenario by ID
    """
    try:
        # This would implement actual database query
        # For now, return a sample scenario
        
        if scenario_id not in ["scenario-1", "scenario-2"]:
            raise HTTPException(
                status_code=404,
                detail=f"Scenario {scenario_id} not found"
            )
        
        scenario = ForecastScenarioResponse(
            id=scenario_id,
            name="Sample Scenario",
            description="Sample forecast scenario",
            scenario_type="realistic",
            base_month=datetime(2024, 10, 1).date(),
            forecast_months=12,
            member_growth_rate=2.5,
            forecast_results=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info(f"Retrieved scenario: {scenario_id}")
        return scenario
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scenario {scenario_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get scenario: {str(e)}"
        )


@router.post("/", response_model=ForecastScenarioResponse)
async def create_scenario(
    scenario: ForecastScenarioCreate,
    db: AsyncSession = Depends(get_database)
) -> ForecastScenarioResponse:
    """
    Create a new forecast scenario
    """
    try:
        # This would implement actual database save
        # For now, return a mock response
        
        scenario_id = f"scenario-{datetime.now().timestamp()}"
        
        created_scenario = ForecastScenarioResponse(
            id=scenario_id,
            name=scenario.name,
            description=scenario.description,
            scenario_type="custom",
            base_month=scenario.base_month,
            forecast_months=scenario.forecast_months,
            member_growth_rate=scenario.member_growth_rate,
            forecast_results=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info(f"Created scenario: {scenario_id}")
        return created_scenario
        
    except Exception as e:
        logger.error(f"Failed to create scenario: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create scenario: {str(e)}"
        )


@router.put("/{scenario_id}", response_model=ForecastScenarioResponse)
async def update_scenario(
    scenario_id: str,
    scenario: ForecastScenarioCreate,
    db: AsyncSession = Depends(get_database)
) -> ForecastScenarioResponse:
    """
    Update an existing forecast scenario
    """
    try:
        # This would implement actual database update
        # First check if scenario exists
        existing_scenario = await get_scenario(scenario_id, db)
        
        # Update the scenario
        updated_scenario = ForecastScenarioResponse(
            id=scenario_id,
            name=scenario.name,
            description=scenario.description,
            scenario_type="custom",
            base_month=scenario.base_month,
            forecast_months=scenario.forecast_months,
            member_growth_rate=scenario.member_growth_rate,
            forecast_results=[],
            created_at=existing_scenario.created_at,
            updated_at=datetime.now()
        )
        
        logger.info(f"Updated scenario: {scenario_id}")
        return updated_scenario
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update scenario {scenario_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update scenario: {str(e)}"
        )


@router.delete("/{scenario_id}")
async def delete_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_database)
) -> Dict[str, str]:
    """
    Delete a forecast scenario
    """
    try:
        # This would implement actual database deletion
        # First check if scenario exists
        await get_scenario(scenario_id, db)
        
        # Delete the scenario
        logger.info(f"Deleted scenario: {scenario_id}")
        return {"message": f"Scenario {scenario_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete scenario {scenario_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete scenario: {str(e)}"
        )


@router.post("/compare", response_model=ScenarioComparisonResponse)
async def compare_scenarios(
    comparison: ScenarioComparison,
    db: AsyncSession = Depends(get_database)
) -> ScenarioComparisonResponse:
    """
    Compare multiple forecast scenarios
    """
    try:
        logger.info(f"Comparing {len(comparison.scenario_ids)} scenarios")
        
        # This would implement actual scenario comparison logic
        # For now, return mock comparison data
        
        from schemas.forecast import ComparisonResult
        
        comparison_results = []
        for metric in comparison.comparison_metrics:
            variance_analysis = {
                "mean": 1500.0,
                "std_dev": 250.0,
                "min": 1200.0,
                "max": 1800.0,
                "coefficient_of_variation": 0.167
            }
            
            scenarios_data = {}
            for scenario_id in comparison.scenario_ids:
                # Mock data for each scenario
                scenarios_data[scenario_id] = [
                    1400.0, 1450.0, 1500.0, 1550.0, 1600.0, 1650.0
                ]
            
            comparison_results.append(ComparisonResult(
                metric=metric,
                scenarios=scenarios_data,
                variance_analysis=variance_analysis
            ))
        
        summary_statistics = {
            "total_scenarios": len(comparison.scenario_ids),
            "forecast_period": "6 months",
            "highest_variance_metric": "predicted_calls",
            "most_conservative_scenario": comparison.scenario_ids[0],
            "most_aggressive_scenario": comparison.scenario_ids[-1]
        }
        
        recommendations = [
            "Consider the baseline scenario for conservative planning",
            "The aggressive growth scenario shows 25% higher call volume",
            "Staff requirements vary by up to 15% between scenarios",
            "Monitor actual vs. predicted for model calibration"
        ]
        
        response = ScenarioComparisonResponse(
            comparison_results=comparison_results,
            summary_statistics=summary_statistics,
            recommendations=recommendations
        )
        
        logger.info("Scenario comparison completed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Scenario comparison failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Scenario comparison failed: {str(e)}"
        )


@router.get("/{scenario_id}/clone", response_model=ForecastScenarioResponse)
async def clone_scenario(
    scenario_id: str,
    new_name: str = Query(..., description="Name for the cloned scenario"),
    db: AsyncSession = Depends(get_database)
) -> ForecastScenarioResponse:
    """
    Clone an existing scenario with a new name
    """
    try:
        # Get the original scenario
        original_scenario = await get_scenario(scenario_id, db)
        
        # Create a new scenario ID
        new_scenario_id = f"scenario-{datetime.now().timestamp()}"
        
        # Clone the scenario
        cloned_scenario = ForecastScenarioResponse(
            id=new_scenario_id,
            name=new_name,
            description=f"Cloned from {original_scenario.name}",
            scenario_type=original_scenario.scenario_type,
            base_month=original_scenario.base_month,
            forecast_months=original_scenario.forecast_months,
            member_growth_rate=original_scenario.member_growth_rate,
            forecast_results=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info(f"Cloned scenario {scenario_id} to {new_scenario_id}")
        return cloned_scenario
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clone scenario {scenario_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clone scenario: {str(e)}"
        ) 