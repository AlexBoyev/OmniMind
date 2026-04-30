from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import async_session_maker

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    db_status = "ok"
    redis_status = "ok"

    # Check DB
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_status = "down"

    # Check Redis
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        await client.ping()
        await client.aclose()
    except Exception:
        redis_status = "down"

    return {
        "status": "ok",
        "db": db_status,
        "redis": redis_status,
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
    }
