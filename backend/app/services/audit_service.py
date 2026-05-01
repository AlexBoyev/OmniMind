from __future__ import annotations

import logging
import uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        action: str,
        request: Request,
        user_id: str | uuid.UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        commit: bool = False,
        **metadata: object,
    ) -> None:
        """Write an audit log entry.

        Pass commit=True when the entry must survive a transaction rollback
        (e.g. login_failed — the outer transaction will be rolled back after
        the HTTPException is raised, so the audit log needs its own commit).
        """
        try:
            ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            if not ip:
                ip = request.client.host if request.client else "unknown"

            user_agent = request.headers.get("User-Agent", "unknown")

            uid: uuid.UUID | None = None
            if user_id is not None:
                uid = uuid.UUID(str(user_id))

            entry = AuditLog(
                user_id=uid,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip,
                user_agent=user_agent,
                extra=metadata if metadata else None,
            )
            db.add(entry)
            if commit:
                await db.commit()
            else:
                await db.flush()
        except Exception as exc:
            logger.error("Failed to write audit log: %s", exc)


audit_service = AuditService()
