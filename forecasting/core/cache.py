Redis-based caching system for the iTAV Forecasting Engine
"""

# Redis disabled for now - using in-memory fallback
REDIS_AVAILABLE = False
aioredis = None

import pickle
import hashlib
from typing import Any, Optional, Union
from datetime import datetime, timedelta
from functools import lru_cache
from loguru import logger

from core.config import get_settings

settings = get_settings()


class CacheManager:
    """Redis cache manager for forecast results and seasonal patterns"""
    
    def __init__(self):
        self.redis: Optional[Any] = None
        self.default_ttl = settings.CACHE_TTL
        self.enabled = REDIS_AVAILABLE
    
    async def connect(self):
        """Connect to Redis"""
        if not self.enabled:
            logger.warning("Redis not available, caching disabled")
            return
            
        try:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8", 
                decode_responses=False
            )
            # Test connection
            await self.redis.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.redis = None
            self.enabled = False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        data_str = str(data) if not isinstance(data, (dict, list)) else str(sorted(data.items()) if isinstance(data, dict) else data)
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    async def get_seasonal_patterns(self, data_hash: str) -> Optional[dict]:
        """Get cached seasonal decomposition results"""
        if not self.enabled or not self.redis:
            return None
        
        try:
            key = f"seasonal:{data_hash}"
            cached_data = await self.redis.get(key)
            if cached_data:
                return pickle.loads(cached_data)
        except Exception as e:
            logger.error(f"Error retrieving seasonal patterns from cache: {e}")
        return None
    
    async def cache_seasonal_patterns(self, data_hash: str, patterns: dict, ttl: Optional[int] = None):
        """Cache seasonal decomposition results"""
        if not self.enabled or not self.redis:
            return
        
        try:
            key = f"seasonal:{data_hash}"
            ttl = ttl or self.default_ttl
            await self.redis.setex(key, ttl, pickle.dumps(patterns))
            logger.debug(f"Cached seasonal patterns: {key}")
        except Exception as e:
            logger.error(f"Error caching seasonal patterns: {e}")
    
    async def get_forecast_result(self, scenario_hash: str) -> Optional[dict]:
        """Get cached forecast results for identical scenarios"""
        if not self.enabled or not self.redis:
            return None
        
        try:
            key = f"forecast:{scenario_hash}"
            cached_data = await self.redis.get(key)
            if cached_data:
                return pickle.loads(cached_data)
        except Exception as e:
            logger.error(f"Error retrieving forecast from cache: {e}")
        return None
    
    async def cache_forecast_result(self, scenario_hash: str, result: dict, ttl: Optional[int] = None):
        """Cache complete forecast results for identical scenarios"""
        if not self.enabled or not self.redis:
            return
        
        try:
            key = f"forecast:{scenario_hash}"
            ttl = ttl or self.default_ttl
            await self.redis.setex(key, ttl, pickle.dumps(result))
            logger.debug(f"Cached forecast result: {key}")
        except Exception as e:
            logger.error(f"Error caching forecast result: {e}")
    
    async def get_model_weights(self, model_id: str) -> Optional[dict]:
        """Get cached adaptive model weights"""
        if not self.enabled or not self.redis:
            return None
        
        try:
            key = f"model_weights:{model_id}"
            cached_data = await self.redis.get(key)
            if cached_data:
                return pickle.loads(cached_data)
        except Exception as e:
            logger.error(f"Error retrieving model weights from cache: {e}")
        return None
    
    async def cache_model_weights(self, model_id: str, weights: dict, ttl: Optional[int] = None):
        """Cache adaptive model weights"""
        if not self.enabled or not self.redis:
            return
        
        try:
            key = f"model_weights:{model_id}"
            ttl = ttl or self.default_ttl * 24  # Keep model weights longer
            await self.redis.setex(key, ttl, pickle.dumps(weights))
            logger.debug(f"Cached model weights: {key}")
        except Exception as e:
            logger.error(f"Error caching model weights: {e}")
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        if not self.enabled or not self.redis:
            return
        
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cache entries matching pattern: {pattern}")
        except Exception as e:
            logger.error(f"Error invalidating cache pattern {pattern}: {e}")
    
    async def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        if not self.enabled or not self.redis:
            return {"status": "disabled"}
        
        try:
            info = await self.redis.info("memory")
            keyspace = await self.redis.info("keyspace")
            
            return {
                "status": "connected",
                "memory_used": info.get("used_memory_human", "N/A"),
                "memory_peak": info.get("used_memory_peak_human", "N/A"),
                "total_keys": sum(keyspace.get(db, {}).get("keys", 0) for db in keyspace if db.startswith("db")),
                "keyspace": keyspace
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"status": "error", "message": str(e)}


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


@lru_cache()
def get_cache_manager() -> CacheManager:
    """Get cached cache manager instance"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager 