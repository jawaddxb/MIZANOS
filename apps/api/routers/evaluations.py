"""Evaluations router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.evaluation import (
    EvaluationCreate,
    EvaluationResponse,
    EvaluationSummary,
    ProjectCompletionCreate,
    ProjectCompletionResponse,
)
from apps.api.services.evaluation_service import EvaluationService

router = APIRouter()


def get_service(db: DbSession) -> EvaluationService:
    return EvaluationService(db)


@router.get("/summaries", response_model=list[EvaluationSummary])
async def list_all_summaries(
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    return await service.get_all_latest_evaluations()


@router.post(
    "/{profile_id}",
    response_model=EvaluationResponse,
    status_code=201,
)
async def create_evaluation(
    profile_id: UUID,
    body: EvaluationCreate,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    evaluated_by = UUID(user.id) if user else None
    return await service.create_evaluation(profile_id, evaluated_by, body)


@router.get(
    "/{profile_id}",
    response_model=list[EvaluationResponse],
)
async def list_evaluations(
    profile_id: UUID,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    return await service.get_evaluations(profile_id)


@router.get(
    "/{profile_id}/latest",
    response_model=EvaluationResponse | None,
)
async def get_latest_evaluation(
    profile_id: UUID,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    return await service.get_latest_evaluation(profile_id)


@router.get("/{profile_id}/summary")
async def get_evaluation_summary(
    profile_id: UUID,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    return await service.get_evaluation_summary(profile_id)


@router.post(
    "/{profile_id}/completions",
    response_model=ProjectCompletionResponse,
    status_code=201,
)
async def create_project_completion(
    profile_id: UUID,
    body: ProjectCompletionCreate,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    created_by = UUID(user.id) if user else None
    return await service.create_project_completion(profile_id, created_by, body)


@router.get(
    "/{profile_id}/completions",
    response_model=list[ProjectCompletionResponse],
)
async def list_project_completions(
    profile_id: UUID,
    user: CurrentUser = None,
    service: EvaluationService = Depends(get_service),
):
    return await service.get_project_completions(profile_id)
