"""Background job definitions for the Arq worker."""

from .tasks import generate_system_docs_job

__all__ = ["generate_system_docs_job"]
