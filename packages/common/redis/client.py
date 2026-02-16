"""Redis connection pool for Arq job queue."""

from arq.connections import ArqRedis, RedisSettings, create_pool

from apps.api.config import settings

_pool: ArqRedis | None = None


def parse_redis_settings() -> RedisSettings:
    """Parse redis_url into Arq RedisSettings."""
    url = settings.redis_url  # e.g. "redis://localhost:6380"
    parts = url.replace("redis://", "").split(":")
    host = parts[0] if parts else "localhost"
    port = int(parts[1]) if len(parts) > 1 else 6379
    return RedisSettings(host=host, port=port)


async def get_arq_redis() -> ArqRedis:
    """Get or create the shared Arq Redis connection pool."""
    global _pool  # noqa: PLW0603
    if _pool is None:
        _pool = await create_pool(parse_redis_settings())
    return _pool


async def close_arq_redis() -> None:
    """Close the shared Arq Redis pool on shutdown."""
    global _pool  # noqa: PLW0603
    if _pool is not None:
        await _pool.aclose()
        _pool = None
