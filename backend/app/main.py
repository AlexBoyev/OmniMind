from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.middleware import register_middlewares
from app.db.session import async_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    yield
    # Shutdown
    await async_engine.dispose()


limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="OmniMind REST API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

Instrumentator().instrument(app).expose(app, endpoint="/api/v1/metrics")

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middlewares (order matters — CORS must come last so it wraps everything)
register_middlewares(app)

# Routers
from app.api.v1 import admin, auth, health, jarvis  # noqa: E402
from app.api.v1.telegram import router as telegram_webhook_router, link_router as telegram_link_router  # noqa: E402
from app.api.v1.whatsapp import router as whatsapp_webhook_router, link_router as whatsapp_link_router  # noqa: E402
from app.api.v1.system import router as system_router  # noqa: E402
from app.api.v1.env_manager import router as env_manager_router  # noqa: E402
from app.api.v1.proxy import router as proxy_router  # noqa: E402

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(jarvis.router, prefix="/api/v1")
app.include_router(telegram_webhook_router, prefix="/api/v1")
app.include_router(telegram_link_router, prefix="/api/v1")
app.include_router(whatsapp_webhook_router, prefix="/api/v1")
app.include_router(whatsapp_link_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(env_manager_router, prefix="/api/v1")
app.include_router(proxy_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/docs"}
