"""
Async test fixtures for the OmniMind FastAPI test suite.

Architecture:
- asyncio_default_fixture_loop_scope = "session" (pyproject.toml)
  All fixtures and test functions share ONE event loop for the whole session.
  This is essential because async_engine is a module-level singleton whose
  asyncpg connections are bound to an event loop — reusing one loop avoids
  "event loop is closed" errors between tests.

- setup_test_schema: session-scoped async fixture, drops/recreates tables once.

- client: function-scoped, creates a fresh AsyncClient per test.
  Uses the REAL production get_db so each HTTP request commits its own
  transaction — writes are visible to subsequent calls within the same test.
"""

from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.main import app

# ─── One-time schema reset ────────────────────────────────────────────────────


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_schema():
    """Drop and recreate all tables once for the whole test session."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


# ─── HTTP client ──────────────────────────────────────────────────────────────


@pytest_asyncio.fixture()
async def client():
    """
    Fresh AsyncClient per test, backed by the real FastAPI app.
    Uses production get_db so writes are committed and visible
    across multiple HTTP calls within the same test function.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ─── Auth helpers ─────────────────────────────────────────────────────────────


@pytest_asyncio.fixture()
async def auth_headers_admin(client: AsyncClient) -> dict[str, str]:
    import uuid as _uuid

    u = _uuid.uuid4().hex[:6]
    email = f"admin_{u}@test.com"
    username = f"admin_{u}"
    pwd = "Admin1234!"

    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": pwd},
    )

    from sqlalchemy import select

    from app.db.session import async_session_maker
    from app.models.user import Role, User

    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.role = Role.ADMIN
            await db.commit()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": email, "password": pwd},
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture()
async def auth_headers_user(client: AsyncClient) -> dict[str, str]:
    import uuid as _uuid

    u = _uuid.uuid4().hex[:6]
    email = f"user_{u}@test.com"
    username = f"user_{u}"
    pwd = "User1234!"

    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": pwd},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": email, "password": pwd},
    )
    assert resp.status_code == 200, f"User login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}
