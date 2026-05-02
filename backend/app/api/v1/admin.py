from __future__ import annotations

import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.auth import PaginatedUsers, UserResponse, UserUpdateRequest
from app.services.audit_service import audit_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
):
    offset = (page - 1) * size

    total_result = await db.execute(select(func.count(User.id)))
    total: int = total_result.scalar_one()

    result = await db.execute(select(User).offset(offset).limit(size).order_by(User.created_at))
    users = result.scalars().all()

    return PaginatedUsers(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdateRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user_id == current_user.id and data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role

    await db.flush()
    await db.refresh(user)

    await audit_service.log(
        db, "user_updated", request,
        user_id=current_user.id,
        resource_type="user",
        resource_id=str(user_id),
        changes=data.model_dump(exclude_unset=True),
    )

    return UserResponse.model_validate(user)


@router.get("/audit-log")
async def get_audit_log(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    user_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    count_query = select(func.count(AuditLog.id))

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        count_query = count_query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)

    offset = (page - 1) * size
    query = query.offset(offset).limit(size)

    result = await db.execute(query)
    logs = result.scalars().all()

    total_result = await db.execute(count_query)
    total: int = total_result.scalar_one()

    return {
        "logs": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "metadata": log.extra,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "size": size,
    }
