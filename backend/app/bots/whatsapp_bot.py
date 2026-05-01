"""WhatsApp bot via Twilio."""
from __future__ import annotations

import logging

from twilio.rest import Client as TwilioClient

from app.core.config import settings

logger = logging.getLogger(__name__)

_twilio: TwilioClient | None = None


def get_twilio() -> TwilioClient | None:
    global _twilio
    if _twilio is None and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        _twilio = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    return _twilio


async def send_whatsapp(to: str, body: str) -> bool:
    """Send a WhatsApp message via Twilio. Returns True on success."""
    client = get_twilio()
    if not client:
        logger.warning("Twilio not configured — cannot send WhatsApp message")
        return False
    try:
        client.messages.create(
            body=body,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{to}" if not to.startswith("whatsapp:") else to,
        )
        return True
    except Exception as exc:
        logger.error("WhatsApp send failed: %s", exc)
        return False
