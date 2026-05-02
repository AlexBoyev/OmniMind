"""Admin system info and health endpoints."""
from __future__ import annotations

import platform
import sys
import time
from datetime import UTC, datetime
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.conversation import Conversation, Message
from app.models.user import User

router = APIRouter(prefix="/admin/system", tags=["system"])

_start_time = time.time()

import os as _os

def _get_services() -> list[dict]:
    """Build service list using VITE_* env vars for display URLs and Docker-internal URLs for health checks."""
    # For Docker-internal reachable services, use service names
    # For external services (Jenkins/ArgoCD on Minikube), try to reach the configured URL
    jenkins_url    = _os.environ.get("VITE_JENKINS_URL", "http://localhost:32000")
    argocd_url     = _os.environ.get("VITE_ARGOCD_URL", "http://localhost:32001")
    grafana_url    = _os.environ.get("VITE_GRAFANA_URL", "http://localhost:32002")
    prometheus_url = _os.environ.get("VITE_PROMETHEUS_URL", "http://localhost:32003")
    pgadmin_url    = _os.environ.get("VITE_PGADMIN_URL", "http://localhost:5050")
    mailpit_url    = _os.environ.get("VITE_MAILPIT_URL", "http://localhost:8025")

    return [
        {"name": "Backend API",  "url": "http://localhost:8001/api/v1/health", "internal_url": "http://localhost:8000/api/v1/health"},
        {"name": "Frontend",     "url": "http://localhost:3000",               "internal_url": "http://frontend:3000"},
        {"name": "pgAdmin",      "url": pgadmin_url,                           "internal_url": "http://pgadmin:80"},
        {"name": "Mailpit",      "url": mailpit_url,                           "internal_url": "http://mailpit:8025"},
        # For Jenkins/ArgoCD/Grafana/Prometheus — these are on Minikube, reachable only via host port-forwards
        # The backend container uses the same localhost:PORT tunnel that the host machine set up
        {"name": "Jenkins",      "url": jenkins_url,    "internal_url": jenkins_url},
        {"name": "ArgoCD",       "url": argocd_url,     "internal_url": argocd_url},
        {"name": "Grafana",      "url": grafana_url,    "internal_url": grafana_url},
        {"name": "Prometheus",   "url": prometheus_url, "internal_url": prometheus_url},
    ]

SERVICES = _get_services()  # evaluated once at startup; read env at import time


async def _ping(url: str, timeout: float = 2.5) -> str:
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url)
            return "online" if r.status_code < 500 else "degraded"
    except Exception:
        return "offline"


@router.get("/health")
async def get_system_health(_admin=Depends(require_admin)):
    results = []
    for svc in SERVICES:
        status = await _ping(svc["internal_url"])
        results.append({"name": svc["name"], "url": svc["url"], "status": status})
    return {"services": results, "checked_at": datetime.now(tz=UTC).isoformat()}


@router.get("/stats")
async def get_system_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    users_total = (await db.execute(select(func.count(User.id)))).scalar_one()
    users_active = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar_one()  # noqa: E712
    conversations = (await db.execute(select(func.count(Conversation.id)))).scalar_one()
    messages = (await db.execute(select(func.count(Message.id)))).scalar_one()
    audit_logs = (await db.execute(select(func.count(AuditLog.id)))).scalar_one()
    return {
        "users_total": users_total,
        "users_active": users_active,
        "conversations_total": conversations,
        "messages_total": messages,
        "audit_logs_total": audit_logs,
    }


@router.get("/info")
async def get_system_info(_admin=Depends(require_admin)):
    uptime_sec = int(time.time() - _start_time)
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime_sec,
        "python_version": sys.version.split()[0],
        "platform": platform.system(),
    }
