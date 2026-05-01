from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class JarvisChatRequest(BaseModel):
    message: str
    conversation_id: uuid.UUID | None = None


class JarvisChatResponse(BaseModel):
    reply: str
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    tokens_in: int
    tokens_out: int


class ConversationSummary(BaseModel):
    id: uuid.UUID
    title: str | None
    last_message_preview: str
    updated_at: datetime
