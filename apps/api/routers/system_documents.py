"""System documents router."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy import select, func

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.models.system_document import SystemDocument
from apps.api.schemas.system_document import (
    GenerateDocsRequest,
    GenerateDocsResponse,
    SystemDocumentListResponse,
    SystemDocumentResponse,
)
from apps.api.services.system_doc_generator import SystemDocGenerator
from apps.api.services.github_webhook_service import GitHubWebhookService
from apps.api.config import settings

router = APIRouter()


@router.get("", response_model=SystemDocumentListResponse)
async def list_system_documents(
    product_id: UUID,
    db: DbSession,
    user: CurrentUser = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List all system documents for a product."""
    stmt = (
        select(SystemDocument)
        .where(SystemDocument.product_id == product_id)
        .order_by(SystemDocument.doc_type, SystemDocument.version.desc())
    )
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    data = list(result.scalars().all())

    return {"data": data, "total": total, "page": page, "page_size": page_size}


@router.get("/{doc_id}", response_model=SystemDocumentResponse)
async def get_system_document(
    doc_id: UUID, db: DbSession, user: CurrentUser = None
):
    """Get a single system document."""
    doc = await db.get(SystemDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="System document not found")
    return doc


@router.get("/{doc_id}/versions")
async def get_versions(
    doc_id: UUID, db: DbSession, user: CurrentUser = None
):
    """Get version history for a document type."""
    doc = await db.get(SystemDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="System document not found")

    stmt = (
        select(SystemDocument)
        .where(
            SystemDocument.product_id == doc.product_id,
            SystemDocument.doc_type == doc.doc_type,
        )
        .order_by(SystemDocument.version.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/{product_id}/generate", response_model=GenerateDocsResponse)
async def generate_docs(
    product_id: UUID,
    body: GenerateDocsRequest,
    db: DbSession,
    user: CurrentUser = None,
):
    """Generate all system documents for a product."""
    try:
        generator = SystemDocGenerator(db)
        docs = await generator.generate_all(product_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Document generation failed: {exc}"
        )
    return GenerateDocsResponse(
        documents_created=len(docs),
        doc_types=[d.doc_type for d in docs],
    )


@router.post("/{product_id}/regenerate", response_model=GenerateDocsResponse)
async def regenerate_docs(
    product_id: UUID,
    db: DbSession,
    user: CurrentUser = None,
):
    """Regenerate system documents from current state."""
    try:
        generator = SystemDocGenerator(db)
        docs = await generator.regenerate_from_github(product_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Document generation failed: {exc}"
        )
    return GenerateDocsResponse(
        documents_created=len(docs),
        doc_types=[d.doc_type for d in docs],
    )


@router.post("/webhook/github")
async def github_webhook(request: Request, db: DbSession):
    """Handle GitHub push webhook — no auth, validates signature."""
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    webhook_secret = getattr(settings, "github_webhook_secret", "")
    if webhook_secret and signature:
        if not GitHubWebhookService.verify_signature(body, signature, webhook_secret):
            raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()
    service = GitHubWebhookService(db)
    result = await service.handle_push_event(payload)

    if result is None:
        return {"status": "ignored", "reason": "No matching product"}
    return {"status": "ok", **result}
