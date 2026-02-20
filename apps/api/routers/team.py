"""Team router."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.team import (
    AvailabilityResponse,
    HolidayCreate,
    HolidayResponse,
    NationalHolidayCreate,
    NationalHolidayResponse,
    NationalHolidayUpdate,
    ProfileResponse,
    ProfileUpdate,
)
from apps.api.services.team_service import TeamService

router = APIRouter()


def get_service(db: DbSession) -> TeamService:
    return TeamService(db)


@router.get("/profiles", response_model=list[ProfileResponse])
async def list_profiles(user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_all_profiles()


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: UUID, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_profile(profile_id)


@router.patch("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: UUID, body: ProfileUpdate, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.update_profile(profile_id, body.model_dump(exclude_unset=True))


@router.post("/profiles/{profile_id}/assign", response_model=ProfileResponse)
async def assign_to_project(
    profile_id: UUID,
    body: dict,
    user: CurrentUser,
    service: TeamService = Depends(get_service),
):
    return await service.assign_to_project(profile_id, body["product_id"])


@router.post("/profiles/task-counts")
async def get_task_counts(
    body: dict,
    user: CurrentUser,
    service: TeamService = Depends(get_service),
):
    return await service.get_task_counts(body["profile_ids"])


@router.get("/holidays", response_model=list[HolidayResponse])
async def list_holidays(user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_holidays()


@router.post("/holidays", response_model=HolidayResponse, status_code=201)
async def create_holiday(body: HolidayCreate, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.create_holiday(body)


@router.delete("/holidays/{holiday_id}", status_code=204)
async def delete_holiday(holiday_id: UUID, user: CurrentUser, service: TeamService = Depends(get_service)):
    await service.delete_holiday(holiday_id)


@router.get("/holidays/national", response_model=list[NationalHolidayResponse])
async def list_national_holidays(user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_national_holidays()


@router.post("/holidays/national", response_model=NationalHolidayResponse, status_code=201)
async def create_national_holiday(body: NationalHolidayCreate, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.create_national_holiday(body)


@router.patch("/holidays/national/{holiday_id}", response_model=NationalHolidayResponse)
async def update_national_holiday(holiday_id: UUID, body: NationalHolidayUpdate, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.update_national_holiday(holiday_id, body)


@router.delete("/holidays/national/{holiday_id}", status_code=204)
async def delete_national_holiday(holiday_id: UUID, user: CurrentUser, service: TeamService = Depends(get_service)):
    await service.delete_national_holiday(holiday_id)


@router.get("/users/{user_id}/roles", response_model=list[str])
async def get_user_roles(user_id: str, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_user_roles(user_id)


@router.post("/profiles/{profile_id}/avatar", response_model=ProfileResponse)
async def upload_avatar(
    profile_id: UUID,
    file: UploadFile = File(...),
    user: CurrentUser,
    service: TeamService = Depends(get_service),
):
    return await service.upload_avatar(profile_id, file)


@router.delete("/profiles/{profile_id}/avatar", response_model=ProfileResponse)
async def delete_avatar(
    profile_id: UUID,
    user: CurrentUser,
    service: TeamService = Depends(get_service),
):
    return await service.delete_avatar(profile_id)


@router.get("/availability/{profile_id}", response_model=AvailabilityResponse)
async def get_availability(profile_id: UUID, user: CurrentUser, service: TeamService = Depends(get_service)):
    return await service.get_availability(profile_id)
