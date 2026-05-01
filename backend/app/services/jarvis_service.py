from __future__ import annotations

import json
import logging
import uuid
from typing import Any

import anthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.conversation import Conversation, Message
from app.models.user import Role, User

logger = logging.getLogger(__name__)

# Module-level async client — shared, thread-safe
_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


# ── Admin tools ────────────────────────────────────────────────────────────────

ADMIN_TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_user_count",
        "description": "Returns the total number of registered users in OmniMind.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_recent_audit_events",
        "description": "Returns the most recent audit log entries (up to 10).",
        "input_schema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "description": "Filter by action type (e.g. login_failed, user_updated). Leave empty for all.",
                },
                "limit": {"type": "integer", "description": "Number of records (1-10)", "default": 5},
            },
            "required": [],
        },
    },
    {
        "name": "get_failed_logins",
        "description": "Returns the count of failed login attempts in the last 24 hours.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


async def _execute_admin_tool(name: str, tool_input: dict, db: AsyncSession) -> str:
    """Run an admin tool and return a JSON-serialised result."""
    if name == "get_user_count":
        from sqlalchemy import func
        result = await db.execute(select(func.count(User.id)))
        return json.dumps({"user_count": result.scalar_one()})

    if name == "get_recent_audit_events":
        limit = min(int(tool_input.get("limit", 5)), 10)
        action = tool_input.get("action")
        q = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if action:
            q = q.where(AuditLog.action == action)
        result = await db.execute(q)
        logs = result.scalars().all()
        return json.dumps(
            [
                {
                    "action": lg.action,
                    "user_id": str(lg.user_id) if lg.user_id else None,
                    "ip_address": lg.ip_address,
                    "created_at": lg.created_at.isoformat(),
                }
                for lg in logs
            ]
        )

    if name == "get_failed_logins":
        from datetime import UTC, datetime, timedelta
        from sqlalchemy import func
        since = datetime.now(tz=UTC) - timedelta(hours=24)
        result = await db.execute(
            select(func.count(AuditLog.id)).where(
                AuditLog.action == "login_failed",
                AuditLog.created_at >= since,
            )
        )
        return json.dumps({"failed_logins_last_24h": result.scalar_one()})

    return json.dumps({"error": f"Unknown tool: {name}"})


# ── Core chat ──────────────────────────────────────────────────────────────────

class JarvisService:

    async def chat(
        self,
        db: AsyncSession,
        user: User,
        message_text: str,
        conversation_id: uuid.UUID | None = None,
    ) -> tuple[str, uuid.UUID, uuid.UUID, int, int]:
        """
        Send a message to Claude, handle tool use, persist to DB.
        Returns (reply, conversation_id, message_id, tokens_in, tokens_out).
        """
        if not settings.ANTHROPIC_API_KEY:
            return (
                "Jarvis is not configured — please set ANTHROPIC_API_KEY in your environment.",
                conversation_id or uuid.uuid4(),
                uuid.uuid4(),
                0,
                0,
            )

        client = _get_client()
        is_admin = user.role == Role.ADMIN

        # ── Fetch or create conversation ────────────────────────────────────────
        if conversation_id:
            result = await db.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user.id,
                )
            )
            conversation = result.scalar_one_or_none()
        else:
            conversation = None

        if conversation is None:
            conversation = Conversation(user_id=user.id, title=message_text[:60] or "Conversation")
            db.add(conversation)
            await db.flush()

        # ── Load history ────────────────────────────────────────────────────────
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .limit(settings.JARVIS_HISTORY_LIMIT)
        )
        history = result.scalars().all()

        api_messages: list[dict] = [
            {"role": m.role, "content": m.content}
            for m in history
            if m.role in ("user", "assistant")
        ]
        api_messages.append({"role": "user", "content": message_text})

        # ── Tool set ────────────────────────────────────────────────────────────
        tools = ADMIN_TOOLS if (is_admin and settings.JARVIS_ADMIN_TOOLS_ENABLED) else []

        # ── Claude API call (with prompt caching on system prompt) ──────────────
        system_blocks: list[dict] = [
            {
                "type": "text",
                "text": settings.CLAUDE_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # cache stable system prompt
            }
        ]

        tokens_in = 0
        tokens_out = 0
        reply = ""

        # Manual agentic loop — handles tool_use responses from Claude
        while True:
            kwargs: dict[str, Any] = {
                "model": settings.CLAUDE_MODEL,
                "max_tokens": settings.CLAUDE_MAX_TOKENS,
                "system": system_blocks,
                "messages": api_messages,
            }
            if tools:
                kwargs["tools"] = tools

            response = await client.messages.create(**kwargs)

            tokens_in += response.usage.input_tokens + (response.usage.cache_read_input_tokens or 0)
            tokens_out += response.usage.output_tokens

            # Collect text from response
            text_parts = [b.text for b in response.content if hasattr(b, "text")]
            if text_parts:
                reply = " ".join(text_parts)

            if response.stop_reason == "end_turn" or response.stop_reason != "tool_use":
                break

            # Handle tool calls
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
            if not tool_use_blocks:
                break

            # Append assistant's response with tool_use blocks
            api_messages.append({"role": "assistant", "content": response.content})

            # Execute each tool and gather results
            tool_results = []
            for block in tool_use_blocks:
                try:
                    result_content = await _execute_admin_tool(block.name, block.input, db)
                except Exception as exc:
                    logger.error("Tool %s failed: %s", block.name, exc)
                    result_content = json.dumps({"error": str(exc)})

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_content,
                })

            api_messages.append({"role": "user", "content": tool_results})

        # ── Persist to DB ───────────────────────────────────────────────────────
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=message_text,
            tokens_in=tokens_in,
            tokens_out=0,
        )
        db.add(user_msg)
        await db.flush()

        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=reply,
            tokens_in=0,
            tokens_out=tokens_out,
        )
        db.add(assistant_msg)
        await db.flush()

        # Bump conversation updated_at
        conversation.updated_at = assistant_msg.created_at

        return reply, conversation.id, assistant_msg.id, tokens_in, tokens_out

    async def list_conversations(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> list[dict]:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(50)
        )
        convos = result.scalars().all()
        out = []
        for c in convos:
            # Get last message
            last = await db.execute(
                select(Message)
                .where(Message.conversation_id == c.id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = last.scalar_one_or_none()
            preview = (last_msg.content[:80] if last_msg else "") + ("…" if last_msg and len(last_msg.content) > 80 else "")
            out.append({
                "id": str(c.id),
                "title": c.title,
                "last_message_preview": preview,
                "updated_at": c.updated_at.isoformat(),
            })
        return out


jarvis_service = JarvisService()
