"""Telegram webhook endpoint + link-token generator."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/webhooks/telegram", tags=["telegram"])


@router.post("", status_code=status.HTTP_200_OK)
async def telegram_webhook(request: Request):
    """Receive updates from Telegram."""
    if not settings.TELEGRAM_BOT_TOKEN:
        return Response(status_code=200)
    try:
        from telegram import Update
        from app.bots.telegram_bot import build_application

        data = await request.json()
        app = build_application()
        update = Update.de_json(data, app.bot)
        await app.process_update(update)
    except Exception:
        pass  # Never fail a webhook — Telegram retries on non-2xx
    return Response(status_code=200)


link_router = APIRouter(prefix="/me/telegram", tags=["telegram"])


@link_router.post("/link-token")
async def create_link_token(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Generate a one-time token to link Telegram account."""
    from app.bots.telegram_bot import generate_link_token
    token = generate_link_token(str(current_user.id))
    return {"token": token, "instruction": f"Send /link {token} to @OmniMindBot on Telegram"}
