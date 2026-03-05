"""Redis connection pool for Arq job queue."""

from arq.connections import ArqRedis, RedisSettings, create_pool

from apps.api.config import settings

_pool: ArqRedis | None = None


def parse_redis_settings() -> RedisSettings:
    """Parse redis_url into Arq RedisSettings.

    Supports: redis://host:port, redis://:password@host:port, redis://user:password@host:port
    """
    from urllib.parse import urlparse

    parsed = urlparse(settings.redis_url)
    return RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        password=parsed.password,
        username=parsed.username or None,
    )


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
