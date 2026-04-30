"""Unit tests for core security functions."""

from __future__ import annotations

import pytest
from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)


def test_hash_password_produces_bcrypt():
    hashed = hash_password("MySecret1!")
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert hashed != "MySecret1!"


def test_verify_password_correct():
    hashed = hash_password("MySecret1!")
    assert verify_password("MySecret1!", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("MySecret1!")
    assert verify_password("WrongPass9!", hashed) is False


def test_create_access_token_structure():
    token = create_access_token(subject="user-123", role="user")
    assert isinstance(token, str)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "user-123"
    assert payload["role"] == "user"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token_structure():
    token = create_refresh_token(subject="user-456")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"


def test_decode_token_valid():
    token = create_access_token(subject="abc", role="admin")
    payload = decode_token(token)
    assert payload["sub"] == "abc"
    assert payload["role"] == "admin"


def test_decode_token_invalid_raises():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        decode_token("this.is.not.a.valid.jwt")
    assert exc.value.status_code == 401


def test_hash_token_deterministic():
    t = "some-jwt-string"
    assert hash_token(t) == hash_token(t)
    assert len(hash_token(t)) == 64  # SHA-256 hex
