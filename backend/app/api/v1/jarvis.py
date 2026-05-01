from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.user import User
from app.schemas.jarvis import JarvisChatRequest, JarvisChatResponse
from app.services.audit_service import audit_service
from app.services.jarvis_service import jarvis_service
from sqlalchemy import select

router = APIRouter(prefix="/jarvis", tags=["jarvis"])


@router.post("/chat", response_model=JarvisChatResponse)
async def chat(
    body: JarvisChatRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    reply, conv_id, msg_id, tok_in, tok_out = await jarvis_service.chat(
        db=db,
        user=current_user,
        message_text=body.message,
        conversation_id=body.conversation_id,
    )
    await audit_service.log(
        db, "jarvis_chat", request,
        user_id=current_user.id,
        tokens_in=tok_in,
        tokens_out=tok_out,
    )
    return JarvisChatResponse(
        reply=reply,
        conversation_id=conv_id,
        message_id=msg_id,
        tokens_in=tok_in,
        tokens_out=tok_out,
    )


@router.get("/conversations")
async def list_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await jarvis_service.list_conversations(db, current_user.id)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    await db.delete(conv)
