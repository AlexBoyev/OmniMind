"""Admin environment variable manager."""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.services.audit_service import audit_service

router = APIRouter(prefix="/admin/env", tags=["env-manager"])

# ── Metadata for known env vars ─────────────────────────────────────────────

VAR_META: dict[str, dict] = {
    "ANTHROPIC_API_KEY":      {"category": "AI",         "description": "Anthropic Claude API key for Jarvis", "is_secret": True},
    "CLAUDE_MODEL":            {"category": "AI",         "description": "Claude model ID (e.g. claude-opus-4-7)", "is_secret": False},
    "CLAUDE_MAX_TOKENS":       {"category": "AI",         "description": "Max tokens per Jarvis response", "is_secret": False},
    "JARVIS_HISTORY_LIMIT":    {"category": "AI",         "description": "Conversation messages loaded as context", "is_secret": False},
    "TELEGRAM_BOT_TOKEN":      {"category": "Bots",       "description": "Telegram bot token from @BotFather", "is_secret": True},
    "TWILIO_ACCOUNT_SID":      {"category": "Bots",       "description": "Twilio Account SID for WhatsApp", "is_secret": False},
    "TWILIO_AUTH_TOKEN":       {"category": "Bots",       "description": "Twilio Auth Token", "is_secret": True},
    "TWILIO_WHATSAPP_FROM":    {"category": "Bots",       "description": "Twilio WhatsApp sender number", "is_secret": False},
    "SECRET_KEY":              {"category": "Auth",       "description": "JWT signing secret (keep private!)", "is_secret": True},
    "ACCESS_TOKEN_EXPIRE_MINUTES": {"category": "Auth",  "description": "Access token lifetime in minutes", "is_secret": False},
    "REFRESH_TOKEN_EXPIRE_DAYS": {"category": "Auth",    "description": "Refresh token lifetime in days", "is_secret": False},
    "BCRYPT_ROUNDS":           {"category": "Security",   "description": "Password hashing cost (higher = slower)", "is_secret": False},
    "RATE_LIMIT_DEFAULT":      {"category": "Security",   "description": "Default API rate limit", "is_secret": False},
    "RATE_LIMIT_AUTH":         {"category": "Security",   "description": "Auth endpoint rate limit", "is_secret": False},
    "CORS_ORIGINS":            {"category": "Security",   "description": "Allowed CORS origins (JSON list)", "is_secret": False},
    "POSTGRES_HOST":           {"category": "Database",   "description": "PostgreSQL host", "is_secret": False},
    "POSTGRES_DB":             {"category": "Database",   "description": "PostgreSQL database name", "is_secret": False},
    "POSTGRES_USER":           {"category": "Database",   "description": "PostgreSQL username", "is_secret": False},
    "POSTGRES_PASSWORD":       {"category": "Database",   "description": "PostgreSQL password", "is_secret": True},
    "DATABASE_URL":            {"category": "Database",   "description": "Full async database connection URL", "is_secret": True},
    "REDIS_HOST":              {"category": "Database",   "description": "Redis host", "is_secret": False},
    "REDIS_PASSWORD":          {"category": "Database",   "description": "Redis password", "is_secret": True},
    "REDIS_URL":               {"category": "Database",   "description": "Full Redis connection URL", "is_secret": True},
    "PGADMIN_EMAIL":           {"category": "Infrastructure", "description": "pgAdmin admin email", "is_secret": False},
    "PGADMIN_PASSWORD":        {"category": "Infrastructure", "description": "pgAdmin admin password", "is_secret": True},
    "GRAFANA_ADMIN_PASSWORD":  {"category": "Infrastructure", "description": "Grafana admin password", "is_secret": True},
    "ENVIRONMENT":             {"category": "General",    "description": "App environment (development/staging/production)", "is_secret": False},
    "LOG_LEVEL":               {"category": "General",    "description": "Logging level (DEBUG/INFO/WARNING/ERROR)", "is_secret": False},
    "APP_NAME":                {"category": "General",    "description": "Application display name", "is_secret": False},
}


def _find_env_file() -> Path | None:
    candidates = [
        Path(os.environ.get("ENV_FILE_PATH", "")),
        Path("/workspace/omnimind.env"),
        Path(__file__).parent.parent.parent.parent.parent / ".env",  # project root
        Path(__file__).parent.parent.parent.parent / ".env",
    ]
    for p in candidates:
        if p and p.exists():
            return p
    return None


def _read_env_file(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Z0-9_]+)\s*=\s*(.*)", line)
        if m:
            result[m.group(1)] = m.group(2).strip('"').strip("'")
    return result


def _write_env_var(path: Path, key: str, value: str) -> None:
    content = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"^({re.escape(key)}\s*=).*$", re.MULTILINE)
    escaped = value.replace("\\", "\\\\")
    if pattern.search(content):
        content = pattern.sub(rf"\1{escaped}", content)
    else:
        content = content.rstrip("\n") + f"\n{key}={escaped}\n"
    path.write_text(content, encoding="utf-8")


def _mask(key: str, value: str, meta: dict) -> str:
    if not meta.get("is_secret"):
        return value
    if not value:
        return ""
    visible = value[:4] if len(value) > 8 else ""
    return f"{visible}{'*' * min(12, len(value))}...MASKED"


@router.get("")
async def get_env_vars(_admin=Depends(require_admin)):
    env_path = _find_env_file()
    file_vars: dict[str, str] = {}
    if env_path:
        try:
            file_vars = _read_env_file(env_path)
        except Exception:
            pass

    vars_out = []
    for key, meta in VAR_META.items():
        raw = file_vars.get(key) or os.environ.get(key, "")
        vars_out.append({
            "key": key,
            "value": _mask(key, raw, meta),
            "category": meta["category"],
            "description": meta["description"],
            "is_secret": meta["is_secret"],
            "is_set": bool(raw),
            "env_file_writable": env_path is not None,
        })

    return {"vars": vars_out, "env_file": str(env_path) if env_path else None}


class EnvUpdateRequest(BaseModel):
    vars: dict[str, str]


@router.patch("")
async def update_env_vars(
    body: EnvUpdateRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    env_path = _find_env_file()
    if not env_path:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No writable .env file found. Mount the .env file into the container.",
        )
    changed_keys = list(body.vars.keys())
    for key, value in body.vars.items():
        _write_env_var(env_path, key, value)

    await audit_service.log(
        db, "env_vars_updated", request,
        changed_keys=changed_keys,
    )
    return {"updated": changed_keys, "message": "Saved. Restart the backend service to apply changes."}


@router.post("/restart-service")
async def restart_service(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    await audit_service.log(db, "service_restart_requested", request)
    return {"message": "Restart signal sent. In Docker, run: docker compose restart backend"}
