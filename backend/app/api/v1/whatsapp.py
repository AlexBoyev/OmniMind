"""WhatsApp webhook (Twilio) + link endpoint."""
from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.whatsapp_link import WhatsAppLink
from app.services.jarvis_service import jarvis_service
from app.bots.whatsapp_bot import send_whatsapp

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])
link_router = APIRouter(prefix="/me/whatsapp", tags=["whatsapp"])

# In-memory: {token: user_id_str}
_link_tokens: dict[str, str] = {}


@router.post("", status_code=status.HTTP_200_OK)
async def whatsapp_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    From: str = Form(default=""),
    Body: str = Form(default=""),
):
    """Receive WhatsApp messages via Twilio webhook."""
    phone = From.replace("whatsapp:", "")
    text = Body.strip()
    if not phone or not text:
        return Response(status_code=200)

    async with db:
        result = await db.execute(
            select(WhatsAppLink).where(WhatsAppLink.phone_number == phone)
        )
        link = result.scalar_one_or_none()

        if text.lower().startswith("link "):
            token = text.split(" ", 1)[1].strip()
            user_id_str = _link_tokens.pop(token, None)
            if not user_id_str:
                await send_whatsapp(phone, "Invalid or expired link token.")
            else:
                import uuid as _uuid
                existing = await db.execute(select(WhatsAppLink).where(WhatsAppLink.phone_number == phone))
                if existing.scalar_one_or_none():
                    await send_whatsapp(phone, "This number is already linked.")
                else:
                    wa_link = WhatsAppLink(user_id=_uuid.UUID(user_id_str), phone_number=phone)
                    db.add(wa_link)
                    await db.commit()
                    await send_whatsapp(phone, "✅ Your WhatsApp is now linked to OmniMind!")
            return Response(status_code=200)

        if not link:
            await send_whatsapp(phone, "Send 'link <token>' to link your OmniMind account first.")
            return Response(status_code=200)

        user_result = await db.execute(select(User).where(User.id == link.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            return Response(status_code=200)

        try:
            reply, *_ = await jarvis_service.chat(db=db, user=user, message_text=text)
            await send_whatsapp(phone, reply[:1500])
        except Exception:
            await send_whatsapp(phone, "Sorry, an error occurred. Please try again.")

    return Response(status_code=200)


@link_router.post("/link-token")
async def create_link_token(
    current_user: Annotated[User, Depends(get_current_user)],
):
    token = secrets.token_urlsafe(16)
    _link_tokens[token] = str(current_user.id)
    return {"token": token, "instruction": f"Send 'link {token}' on WhatsApp to get linked"}
