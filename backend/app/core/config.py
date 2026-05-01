from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General
    ENVIRONMENT: str = "development"
    APP_NAME: str = "OmniMind"
    APP_VERSION: str = "0.1.0"
    LOG_LEVEL: str = "INFO"
    TIMEZONE: str = "UTC"

    # PostgreSQL
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "omnimind"
    POSTGRES_USER: str = "omnimind"
    POSTGRES_PASSWORD: str = "changeme"
    DATABASE_URL: str = "postgresql+asyncpg://omnimind:changeme@postgres:5432/omnimind"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    SECRET_KEY: str = "insecure-default-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1"]
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_JARVIS: str = "20/minute"
    BCRYPT_ROUNDS: int = 12
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_SAMESITE: str = "lax"
    SESSION_COOKIE_HTTPONLY: bool = True

    # Jarvis / Claude AI
    ANTHROPIC_API_KEY: str | None = None
    CLAUDE_MODEL: str = "claude-opus-4-7"
    CLAUDE_MAX_TOKENS: int = 2048
    CLAUDE_SYSTEM_PROMPT: str = (
        "You are Jarvis, the helpful AI assistant for OmniMind. "
        "Be concise, friendly, and accurate. If you don't know, say so."
    )
    JARVIS_ADMIN_TOOLS_ENABLED: bool = True
    JARVIS_HISTORY_LIMIT: int = 20

    # Telegram
    TELEGRAM_BOT_TOKEN: str | None = None

    # Twilio / WhatsApp
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # Seed users
    SEED_ADMIN_EMAIL: str = "admin@omnimind.local"
    SEED_ADMIN_PASSWORD: str = "Admin1234!"
    SEED_ADMIN_FULL_NAME: str = "Admin User"
    SEED_USER_EMAIL: str = "user@omnimind.local"
    SEED_USER_PASSWORD: str = "User1234!"
    SEED_USER_FULL_NAME: str = "Regular User"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [h.strip() for h in v.split(",") if h.strip()]
        return v

    @property
    def database_url_sync(self) -> str:
        """Synchronous URL for Alembic (replaces asyncpg driver with psycopg2)."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace(
            "postgresql://", "postgresql+psycopg2://"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
