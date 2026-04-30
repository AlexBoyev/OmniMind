from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import Role, User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse


def _utcnow() -> datetime:
    return datetime.now(tz=UTC)


class AuthService:
    # ─── Register ─────────────────────────────────────────────────────────────

    async def register(self, db: AsyncSession, data: RegisterRequest) -> UserResponse:
        # Check uniqueness
        existing = await self._get_by_email_or_username(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered."
            )
        existing = await self._get_by_email_or_username(db, data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username already taken."
            )

        user = User(
            email=data.email.lower(),
            username=data.username,
            hashed_password=hash_password(data.password),
            role=Role.USER,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return UserResponse.model_validate(user)

    # ─── Login ────────────────────────────────────────────────────────────────

    async def login(self, db: AsyncSession, data: LoginRequest) -> tuple[str, str, User]:
        user = await self._get_by_email_or_username(db, data.email_or_username)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated."
            )

        access_token = create_access_token(str(user.id), user.role.value)
        refresh_token_jwt = create_refresh_token(str(user.id))

        # Persist hashed refresh token
        from app.core.config import settings

        rt = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token_jwt),
            expires_at=_utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(rt)

        user.last_login_at = _utcnow()
        await db.flush()

        return access_token, refresh_token_jwt, user

    # ─── Refresh ──────────────────────────────────────────────────────────────

    async def refresh(self, db: AsyncSession, refresh_token_jwt: str) -> str:
        payload = decode_token(refresh_token_jwt)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type."
            )

        token_hash = hash_token(refresh_token_jwt)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        rt = result.scalar_one_or_none()
        if not rt or rt.expires_at.replace(tzinfo=UTC) < _utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked."
            )

        user_id = payload["sub"]
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive."
            )

        return create_access_token(str(user.id), user.role.value)

    # ─── Logout ───────────────────────────────────────────────────────────────

    async def logout(self, db: AsyncSession, refresh_token_jwt: str) -> None:
        token_hash = hash_token(refresh_token_jwt)
        result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        rt = result.scalar_one_or_none()
        if rt:
            rt.revoked = True
            await db.flush()

    # ─── Internal ─────────────────────────────────────────────────────────────

    async def _get_by_email_or_username(self, db: AsyncSession, identifier: str) -> User | None:
        result = await db.execute(
            select(User).where((User.email == identifier.lower()) | (User.username == identifier))
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


auth_service = AuthService()
