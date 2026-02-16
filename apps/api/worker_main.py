"""Entry point for the Arq background worker.

Usage: python -m apps.api.worker_main
"""

import asyncio

from arq import run_worker

from apps.api.jobs.worker import WorkerSettings


def main() -> None:
    """Start the Arq worker process."""
    run_worker(WorkerSettings)


if __name__ == "__main__":
    main()
