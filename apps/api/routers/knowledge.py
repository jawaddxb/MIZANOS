"""Knowledge base router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.knowledge import KnowledgeCreate, KnowledgeResponse, KnowledgeUpdate
from apps.api.services.knowledge_service import KnowledgeService

router = APIRouter()


def get_service(db: DbSession) -> KnowledgeService:
    return KnowledgeService(db)


@router.get("", response_model=list[KnowledgeResponse])
async def list_entries(
    category: str | None = None,
    search: str | None = None,
    user: CurrentUser = None,
    service: KnowledgeService = Depends(get_service),
):
    return await service.list_entries(category=category, search=search)


@router.get("/{entry_id}", response_model=KnowledgeResponse)
async def get_entry(entry_id: UUID, user: CurrentUser = None, service: KnowledgeService = Depends(get_service)):
    return await service.get_or_404(entry_id)


@router.post("", response_model=KnowledgeResponse, status_code=201)
async def create_entry(body: KnowledgeCreate, user: CurrentUser = None, service: KnowledgeService = Depends(get_service)):
    return await service.create_entry(body)


@router.patch("/{entry_id}", response_model=KnowledgeResponse)
async def update_entry(entry_id: UUID, body: KnowledgeUpdate, user: CurrentUser = None, service: KnowledgeService = Depends(get_service)):
    return await service.update(entry_id, body.model_dump(exclude_unset=True))


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(entry_id: UUID, user: CurrentUser = None, service: KnowledgeService = Depends(get_service)):
    await service.delete(entry_id)
