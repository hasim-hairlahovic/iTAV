"""
iTAV Forecasting Engine
FastAPI-based sophisticated workforce planning system for Medicare Advantage call centers
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger
import sys

from core.config import get_settings
from core.database import get_database, init_db
from core.cache import get_cache_manager
from api.routes import forecasting, scenarios, analytics, health
from services.forecast_engine import ForecastEngine

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO", format="{time} | {level} | {message}")
logger.add("logs/forecasting.log", rotation="10 MB", retention="30 days", level="DEBUG")

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting iTAV Forecasting Engine...")
    
    # Initialize database connection
    await init_db()
    logger.info("Database connection established")
    
    # Initialize cache
    cache_manager = get_cache_manager()
    await cache_manager.connect()
    logger.info("Cache connection established")
    
    # Initialize forecast engine
    app.state.forecast_engine = ForecastEngine()
    logger.info("Forecast engine initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down iTAV Forecasting Engine...")
    await cache_manager.disconnect()

# Create FastAPI application
app = FastAPI(
    title="iTAV Forecasting Engine",
    description="Sophisticated workforce planning system for Medicare Advantage call centers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(forecasting.router, prefix="/api/forecasting", tags=["forecasting"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "iTAV Forecasting Engine",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 