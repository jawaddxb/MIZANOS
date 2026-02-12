"""Grant admin role to existing user (one-time fix)."""

import asyncio

from sqlalchemy import func, select

from packages.common.db.session import async_session_factory
from apps.api.models.user import Profile, UserRole


async def grant_admin_role() -> None:
    async with async_session_factory() as session:
        # Find all profiles to show what's in the DB
        all_stmt = select(Profile)
        all_result = await session.execute(all_stmt)
        profiles = all_result.scalars().all()

        print("All profiles in DB:")
        for p in profiles:
            print(f"  {p.user_id} | {p.email} | role={p.role}")

        # Grant admin to every profile that doesn't already have it
        for profile in profiles:
            role_stmt = select(UserRole).where(
                UserRole.user_id == profile.user_id,
                UserRole.role == "admin",
            )
            role_result = await session.execute(role_stmt)
            if role_result.scalar_one_or_none():
                print(f"  -> {profile.email} already has admin role")
                continue

            user_role = UserRole(user_id=profile.user_id, role="admin")
            session.add(user_role)
            print(f"  -> Granted admin role to {profile.email} ({profile.user_id})")

        await session.commit()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(grant_admin_role())
