"""Integration tests for the full auth flow against a live test DB."""

from __future__ import annotations

import uuid

from httpx import AsyncClient

# ─── Helpers ──────────────────────────────────────────────────────────────────


def unique_user() -> dict:
    u = uuid.uuid4().hex[:8]
    return {
        "email": f"integ_{u}@test.com",
        "username": f"integ_{u}",
        "password": "Integ1234!",
    }


# ─── Register ─────────────────────────────────────────────────────────────────


async def test_register_success(client: AsyncClient):
    data = unique_user()
    resp = await client.post("/api/v1/auth/register", json=data)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] == data["email"]
    assert body["username"] == data["username"]
    assert body["role"] == "user"
    assert "hashed_password" not in body


async def test_register_duplicate_email(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    # Second attempt with same email
    resp = await client.post("/api/v1/auth/register", json=data)
    assert resp.status_code == 409


async def test_register_weak_password(client: AsyncClient):
    data = unique_user()
    data["password"] = "weakpass"  # no digit
    resp = await client.post("/api/v1/auth/register", json=data)
    assert resp.status_code == 422


# ─── Login ────────────────────────────────────────────────────────────────────


async def test_login_wrong_password(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["email"], "password": "WrongPass9!"},
    )
    assert resp.status_code == 401


async def test_login_success_returns_token(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["email"], "password": data["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "refresh_token" in resp.cookies


async def test_login_by_username(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["username"], "password": data["password"]},
    )
    assert resp.status_code == 200


# ─── /me ──────────────────────────────────────────────────────────────────────


async def test_me_with_token(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    login = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["email"], "password": data["password"]},
    )
    token = login.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == data["email"]


async def test_me_without_token(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ─── Refresh ──────────────────────────────────────────────────────────────────


async def test_refresh_flow(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["email"], "password": data["password"]},
    )
    assert "refresh_token" in login_resp.cookies

    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


# ─── Logout ───────────────────────────────────────────────────────────────────


async def test_logout_invalidates_refresh_token(client: AsyncClient):
    data = unique_user()
    await client.post("/api/v1/auth/register", json=data)
    await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": data["email"], "password": data["password"]},
    )
    # Logout
    logout_resp = await client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 204

    # Refresh should now fail (cookie cleared / token revoked)
    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 401
