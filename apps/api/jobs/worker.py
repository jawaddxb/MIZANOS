"""Arq worker settings — registers job functions and Redis config."""

from apps.api.jobs.scan_job import high_level_scan_job
from packages.common.redis.client import parse_redis_settings


class WorkerSettings:
    """Arq worker configuration."""

    functions = [high_level_scan_job]
    redis_settings = parse_redis_settings()
    max_jobs = 5
    job_timeout = 900  # 15 minutes
    max_tries = 2
    health_check_interval = 30
