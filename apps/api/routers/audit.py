"""Audit router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.audit import AuditResponse, CompareResponse, RunAuditRequest
from apps.api.services.audit_service import AuditService

router = APIRouter()


def get_service(db: DbSession) -> AuditService:
    return AuditService(db)


@router.get("", response_model=list[AuditResponse])
async def list_audits(product_id: UUID, user: CurrentUser = None, service: AuditService = Depends(get_service)):
    return await service.get_by_product(product_id)


@router.post("/run", response_model=AuditResponse)
async def run_audit(body: RunAuditRequest, user: CurrentUser = None, service: AuditService = Depends(get_service)):
    return await service.run_audit(body.product_id, user["id"])


@router.get("/compare", response_model=CompareResponse)
async def compare_audits(product_id: UUID, user: CurrentUser = None, service: AuditService = Depends(get_service)):
    return await service.compare(product_id)
