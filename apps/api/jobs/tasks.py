"""Arq job functions — wrappers around existing service logic."""

import logging
from uuid import UUID

from apps.api.jobs.context import JobContext
from apps.api.services.system_doc_generator import SystemDocGenerator

logger = logging.getLogger(__name__)

_DOC_LABELS = {
    "functional_spec": "Generating functional specification",
    "implementation_spec": "Generating implementation specification",
    "deployment_docs": "Generating deployment documentation",
}


async def generate_system_docs_job(ctx: dict, job_id_str: str) -> None:
    """Generate all 3 system docs for a product (runs in Arq worker)."""
    job_id = UUID(job_id_str)
    jctx = JobContext()

    try:
        session = await jctx.get_session()

        from apps.api.models.job import Job
        job = await session.get(Job, job_id)
        if job is None:
            logger.error("Job %s not found", job_id)
            return

        product_id = job.product_id
        is_regenerate = (job.input_data or {}).get("regenerate", False)

        await jctx.update_progress(job_id, 5, "Gathering project context")

        generator = SystemDocGenerator(session)
        context = await generator._gather_context(product_id)

        if is_regenerate:
            commit_sha = (job.input_data or {}).get("commit_sha")
            if commit_sha:
                context += f"\n\nLatest commit: {commit_sha}"

        await jctx.update_progress(job_id, 15, "Context gathered, starting generation")

        doc_types = ("functional_spec", "implementation_spec", "deployment_docs")
        progress_values = (30, 55, 80)
        docs = []

        for doc_type, progress_pct in zip(doc_types, progress_values):
            await jctx.update_progress(job_id, progress_pct, _DOC_LABELS[doc_type])
            doc = await generator._generate_doc(product_id, doc_type, context)
            docs.append(doc)

        await jctx.update_progress(job_id, 95, "Saving documents")
        await session.commit()

        await jctx.mark_completed(
            job_id,
            result_data={
                "documents_created": len(docs),
                "doc_types": [d.doc_type for d in docs],
            },
        )

    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        await jctx.mark_failed(job_id, str(exc))
    finally:
        await jctx.close()
