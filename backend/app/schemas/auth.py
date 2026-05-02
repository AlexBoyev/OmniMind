from __future__ import annotations

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.user import Role

_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")
# Accepts standard emails plus .local / .internal / .dev TLDs used in dev environments
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email address format.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must be at least 8 characters and contain both letters and digits."
            )
        return v


class LoginRequest(BaseModel):
    email_or_username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    username: str
    role: Role
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserUpdateRequest(BaseModel):
    is_active: bool | None = None
    role: Role | None = None


class PaginatedUsers(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int
    pages: int
