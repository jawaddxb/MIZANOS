"""Team router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.team import HolidayCreate, HolidayResponse, ProfileResponse, ProfileUpdate
from apps.api.services.team_service import TeamService

router = APIRouter()


def get_service(db: DbSession) -> TeamService:
    return TeamService(db)


@router.get("/profiles", response_model=list[ProfileResponse])
async def list_profiles(user: CurrentUser = None, service: TeamService = Depends(get_service)):
    return await service.get_all_profiles()


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: UUID, user: CurrentUser = None, service: TeamService = Depends(get_service)):
    return await service.get_profile(profile_id)


@router.patch("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: UUID, body: ProfileUpdate, user: CurrentUser = None, service: TeamService = Depends(get_service)):
    return await service.update_profile(profile_id, body.model_dump(exclude_unset=True))


@router.get("/holidays", response_model=list[HolidayResponse])
async def list_holidays(user: CurrentUser = None, service: TeamService = Depends(get_service)):
    return await service.get_holidays()


@router.post("/holidays", response_model=HolidayResponse, status_code=201)
async def create_holiday(body: HolidayCreate, user: CurrentUser = None, service: TeamService = Depends(get_service)):
    return await service.create_holiday(body)


@router.delete("/holidays/{holiday_id}", status_code=204)
async def delete_holiday(holiday_id: UUID, user: CurrentUser = None, service: TeamService = Depends(get_service)):
    await service.delete_holiday(holiday_id)
