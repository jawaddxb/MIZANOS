"""Team service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.settings import NationalHoliday, TeamHoliday
from apps.api.models.user import Profile, UserRole
from apps.api.schemas.team import HolidayCreate, NationalHolidayCreate, NationalHolidayUpdate
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

    async def get_national_holidays(self) -> list[NationalHoliday]:
        stmt = select(NationalHoliday).order_by(NationalHoliday.date)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_roles(self, user_id: str) -> list[str]:
        """Get all roles for a user."""
        stmt = select(UserRole.role).where(UserRole.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_national_holiday(
        self, data: NationalHolidayCreate,
    ) -> NationalHoliday:
        holiday = NationalHoliday(**data.model_dump())
        self.session.add(holiday)
        await self.session.flush()
        await self.session.refresh(holiday)
        return holiday

    async def update_national_holiday(
        self, holiday_id: UUID, data: NationalHolidayUpdate,
    ) -> NationalHoliday:
        holiday = await self.session.get(NationalHoliday, holiday_id)
        if not holiday:
            raise not_found("NationalHoliday")
        for key, value in data.model_dump(exclude_unset=True).items():
            if hasattr(holiday, key):
                setattr(holiday, key, value)
        await self.session.flush()
        await self.session.refresh(holiday)
        return holiday

    async def delete_national_holiday(self, holiday_id: UUID) -> None:
        holiday = await self.session.get(NationalHoliday, holiday_id)
        if not holiday:
            raise not_found("NationalHoliday")
        await self.session.delete(holiday)
        await self.session.flush()

    async def assign_to_project(
        self, profile_id: UUID, product_id: UUID
    ) -> Profile:
        """Assign a profile to a product via product members."""
        from apps.api.models.product import ProductMember

        profile = await self.get_profile(profile_id)
        member = ProductMember(
            product_id=product_id,
            profile_id=profile_id,
        )
        self.session.add(member)
        await self.session.flush()
        return profile

    async def get_task_counts(
        self, profile_ids: list[UUID]
    ) -> dict[str, dict]:
        """Get task counts for multiple profiles."""
        from apps.api.models.task import Task

        result: dict[str, dict] = {}
        for pid in profile_ids:
            stmt = select(Task).where(Task.assignee_id == pid)
            tasks_result = await self.session.execute(stmt)
            tasks = list(tasks_result.scalars().all())
            total = len(tasks)
            completed = sum(1 for t in tasks if t.status == "completed")
            in_progress = sum(1 for t in tasks if t.status == "in_progress")
            result[str(pid)] = {
                "total": total,
                "completed": completed,
                "in_progress": in_progress,
                "pending": total - completed - in_progress,
            }
        return result

    async def get_availability(self, profile_id: UUID) -> dict:
        """Get combined availability for a profile."""
        profile = await self.session.get(Profile, profile_id)
        if not profile:
            raise not_found("Profile")
        personal_stmt = (
            select(TeamHoliday)
            .where(TeamHoliday.profile_id == profile_id)
            .order_by(TeamHoliday.start_date)
        )
        personal_result = await self.session.execute(personal_stmt)
        personal_holidays = list(personal_result.scalars().all())
        national_holidays = await self.get_national_holidays()
        return {
            "profile_id": profile_id,
            "personal_holidays": personal_holidays,
            "national_holidays": national_holidays,
        }
