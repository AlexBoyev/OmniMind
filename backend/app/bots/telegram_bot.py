"""Telegram bot command handlers using python-telegram-bot v21+."""
from __future__ import annotations

import logging
import secrets

from sqlalchemy import select
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from app.core.config import settings
from app.db.session import async_session_maker
from app.models.telegram_link import TelegramLink
from app.models.user import User
from app.services.jarvis_service import jarvis_service

logger = logging.getLogger(__name__)

# In-memory token store: {token: user_id_str}
_link_tokens: dict[str, str] = {}


def generate_link_token(user_id: str) -> str:
    token = secrets.token_urlsafe(16)
    _link_tokens[token] = user_id
    return token


async def _start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 Hi! I'm Jarvis, the OmniMind AI assistant.\n\n"
        "To link your account: login to OmniMind and use the /link command from the app.\n"
        "Once linked, use /ask <your question> to chat with me."
    )


async def _link(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Usage: /link <token>")
        return
    token = context.args[0]
    user_id_str = _link_tokens.pop(token, None)
    if not user_id_str:
        await update.message.reply_text("Invalid or expired link token. Please generate a new one from the app.")
        return
    chat_id = update.effective_chat.id
    username = update.effective_user.username
    async with async_session_maker() as db:
        existing = await db.execute(select(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id))
        if existing.scalar_one_or_none():
            await update.message.reply_text("This Telegram account is already linked.")
            return
        import uuid
        link = TelegramLink(
            user_id=uuid.UUID(user_id_str),
            telegram_chat_id=chat_id,
            telegram_username=username,
        )
        db.add(link)
        await db.commit()
    await update.message.reply_text("✅ Your Telegram account is now linked to OmniMind!")


async def _ask(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Usage: /ask <your question>")
        return
    question = " ".join(context.args)
    chat_id = update.effective_chat.id

    async with async_session_maker() as db:
        result = await db.execute(
            select(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id)
        )
        link = result.scalar_one_or_none()
        if not link:
            await update.message.reply_text("Please link your account first with /link <token>.")
            return
        user_result = await db.execute(select(User).where(User.id == link.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            await update.message.reply_text("Your linked account was not found.")
            return

        await update.message.chat.send_action("typing")
        try:
            reply, *_ = await jarvis_service.chat(db=db, user=user, message_text=question)
            await update.message.reply_text(reply)
        except Exception as exc:
            logger.error("Telegram /ask failed: %s", exc)
            await update.message.reply_text("Sorry, I encountered an error. Please try again.")


def build_application() -> Application:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not configured")
    app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", _start))
    app.add_handler(CommandHandler("link", _link))
    app.add_handler(CommandHandler("ask", _ask))
    return app
