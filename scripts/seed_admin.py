"""Seed the admin user into the database."""

import asyncio
import uuid

from packages.common.db.session import async_session_factory
from apps.api.models.user import Profile
from apps.api.services.auth_service import pwd_context


async def seed_admin() -> None:
    async with async_session_factory() as session:
        from sqlalchemy import select

        stmt = select(Profile).where(Profile.email == "jawad@vanarchain.com")
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            print("Admin user already exists.")
            return

        admin_id = uuid.uuid4()
        profile = Profile(
            id=admin_id,
            user_id=str(admin_id),
            email="jawad@vanarchain.com",
            full_name="Jawaad Ashraf",
            password_hash=pwd_context.hash("Jaajaa10!p"),
            role="admin",
            status="active",
        )
        session.add(profile)
        await session.commit()
        print(f"Admin user created: {admin_id}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
