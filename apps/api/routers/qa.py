"""QA checks router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.qa import QACheckCreate, QACheckResponse, QACheckUpdate
from apps.api.services.qa_service import QAService

router = APIRouter()


def get_service(db: DbSession) -> QAService:
    return QAService(db)


@router.get("", response_model=list[QACheckResponse])
async def list_qa_checks(
    product_id: UUID,
    user: CurrentUser,
    service: QAService = Depends(get_service),
):
    return await service.get_by_product(product_id)


@router.post("", response_model=QACheckResponse, status_code=201)
async def create_qa_check(body: QACheckCreate, user: CurrentUser, service: QAService = Depends(get_service)):
    return await service.create_check(body)


@router.patch("/{check_id}", response_model=QACheckResponse)
async def update_qa_check(check_id: UUID, body: QACheckUpdate, user: CurrentUser, service: QAService = Depends(get_service)):
    return await service.update(check_id, body.model_dump(exclude_unset=True))


@router.post("/generate", response_model=list[QACheckResponse])
async def generate_qa_checklist(product_id: UUID, user: CurrentUser, service: QAService = Depends(get_service)):
    """Generate QA checklist from product context."""
    return await service.generate_checklist(product_id)
