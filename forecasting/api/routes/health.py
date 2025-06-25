"""
Health check endpoints for the iTAV Forecasting Engine
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Dict, Any
import asyncio
from loguru import logger

from core.database import get_database
from core.cache import get_cache_manager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "iTAV Forecasting Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/detailed")
async def detailed_health_check(
    db: AsyncSession = Depends(get_database)
) -> Dict[str, Any]:
    """Detailed health check including dependencies"""
    
    health_status = {
        "status": "healthy",
        "service": "iTAV Forecasting Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "dependencies": {}
    }
    
    # Check database connection
    try:
        result = await db.execute(text("SELECT 1"))
        await result.fetchone()
        health_status["dependencies"]["database"] = {
            "status": "healthy",
            "response_time_ms": 0  # Would measure actual time in production
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["dependencies"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # Check cache connection
    try:
        cache_manager = get_cache_manager()
        cache_stats = await cache_manager.get_cache_stats()
        health_status["dependencies"]["cache"] = {
            "status": "healthy" if cache_stats.get("status") == "connected" else "unhealthy",
            "stats": cache_stats
        }
        
        if cache_stats.get("status") != "connected":
            health_status["status"] = "degraded"
            
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        health_status["dependencies"]["cache"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    return health_status


@router.get("/readiness")
async def readiness_check(
    db: AsyncSession = Depends(get_database)
) -> Dict[str, Any]:
    """Readiness check for Kubernetes/deployment orchestration"""
    
    try:
        # Test database connection
        result = await db.execute(text("SELECT 1"))
        await result.fetchone()
        
        # Test cache connection
        cache_manager = get_cache_manager()
        await cache_manager.get_cache_stats()
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/liveness")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check for Kubernetes/deployment orchestration"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    } 