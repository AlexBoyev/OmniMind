"""
Idempotent database seeder.
Run with: python -m app.db.seed
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session_maker
from app.models.user import Role, User


async def seed_user(
    db: AsyncSession,
    email: str,
    username: str,
    password: str,
    full_name: str,
    role: Role,
    is_verified: bool = True,
) -> None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  Already exists: {email} ({role.value})")
        return

    user = User(
        email=email.lower(),
        username=username,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
        is_verified=is_verified,
    )
    db.add(user)
    await db.flush()
    print(f"  Created {role.value}: {email}")


async def main() -> None:
    print("=== OmniMind DB Seed ===")
    async with async_session_maker() as db:
        await seed_user(
            db=db,
            email=settings.SEED_ADMIN_EMAIL,
            username="admin",
            password=settings.SEED_ADMIN_PASSWORD,
            full_name=settings.SEED_ADMIN_FULL_NAME,
            role=Role.ADMIN,
            is_verified=True,
        )
        await seed_user(
            db=db,
            email=settings.SEED_USER_EMAIL,
            username="user",
            password=settings.SEED_USER_PASSWORD,
            full_name=settings.SEED_USER_FULL_NAME,
            role=Role.USER,
            is_verified=True,
        )
        await db.commit()
    print("=== Seed complete ===")


if __name__ == "__main__":
    asyncio.run(main())
