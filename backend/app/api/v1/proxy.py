"""Admin-only health check proxy — avoids CORS when frontend pings external services."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, Query

from app.api.deps import require_admin

router = APIRouter(prefix="/admin/proxy", tags=["proxy"])


@router.get("/health-check")
async def proxy_health_check(
    url: str = Query(..., description="Full URL to probe"),
    _admin=Depends(require_admin),
):
    """Proxy a GET request and return online/offline status.

    The frontend cannot ping Jenkins/ArgoCD/Grafana directly (CORS + mixed content).
    This endpoint runs the check server-side and returns a simple status.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            resp = await client.get(url)
            return {
                "url": url,
                "status": "online" if resp.status_code < 500 else "degraded",
                "status_code": resp.status_code,
            }
    except Exception as exc:
        return {
            "url": url,
            "status": "offline",
            "error": str(exc)[:120],
        }
