"""Team service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import TeamHoliday
from apps.api.models.user import Profile
from apps.api.schemas.team import HolidayCreate
from packages.common.utils.error_handlers import not_found


class TeamService:
    """Team management business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all_profiles(self) -> list[Profile]:
        stmt = select(Profile).order_by(Profile.full_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_profile(self, profile_id: UUID) -> Profile:
        profile = await self.session.get(Profile, profile_id)
        if not profile:
            raise not_found("Profile")
        return profile

    async def update_profile(self, profile_id: UUID, data: dict) -> Profile:
        profile = await self.get_profile(profile_id)
        for key, value in data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        await self.session.flush()
        await self.session.refresh(profile)
        return profile

    async def get_holidays(self) -> list[TeamHoliday]:
        stmt = select(TeamHoliday).order_by(TeamHoliday.start_date)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_holiday(self, data: HolidayCreate) -> TeamHoliday:
        holiday = TeamHoliday(**data.model_dump())
        self.session.add(holiday)
        await self.session.flush()
        await self.session.refresh(holiday)
        return holiday

    async def delete_holiday(self, holiday_id: UUID) -> None:
        holiday = await self.session.get(TeamHoliday, holiday_id)
        if not holiday:
            raise not_found("Holiday")
        await self.session.delete(holiday)
