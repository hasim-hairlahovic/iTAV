"""
Configuration management for the iTAV Forecasting Engine
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database configuration
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/analytics_db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour default
    
    # Application configuration
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # CORS configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://192.168.1.100:3000",
    ]
    
    # Forecasting engine configuration
    MAX_FORECAST_MONTHS: int = 24
    DEFAULT_FORECAST_MONTHS: int = 12
    MAX_MONTE_CARLO_ITERATIONS: int = 10000
    DEFAULT_MONTE_CARLO_ITERATIONS: int = 1000
    
    # Performance configuration
    MAX_WORKERS: int = 4
    MAX_CONCURRENT_FORECASTS: int = 50
    REQUEST_TIMEOUT: int = 300  # 5 minutes
    
    # Medicare specific configuration
    MEDICARE_SEASONAL_FACTORS: dict = {
        "AEP_period": {
            "months": [10, 11, 12],
            "call_multiplier": 2.1,
            "complexity_increase": 1.4
        },
        "plan_year_start": {
            "months": [1],
            "call_multiplier": 1.6,
            "complexity_increase": 1.2
        },
        "summer_lull": {
            "months": [6, 7, 8],
            "call_multiplier": 0.75,
            "complexity_increase": 0.9
        }
    }
    
    # Segment call rates per 1000 members
    SEGMENT_CALL_RATES: dict = {
        "Highly Engaged": 85,
        "Reactive Engagers": 145,
        "Content & Complacent": 95,
        "Unengaged": 180
    }
    
    # Model accuracy thresholds
    ACCURACY_THRESHOLDS: dict = {
        "short_term": {"months": 3, "mape_threshold": 15.0},
        "medium_term": {"months": 6, "mape_threshold": 22.0},
        "long_term": {"months": 12, "mape_threshold": 30.0}
    }
    
    # Security configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings() 