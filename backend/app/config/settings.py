from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "AI News Summarizer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_news.db"

    JWT_SECRET_KEY: str = "e8f2a7c1d4b6093f5a2e8d7c6b4f1a0e3d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8000,https://ai-news-summarizer-gamma.vercel.app"

    NEWS_API_KEY_GNEWS: str = ""
    NEWS_API_KEY_NEWSAPI: str = ""
    NEWS_API_KEY_GUARDIAN: str = ""
    NEWS_API_KEY_MEDIASTACK: str = ""
    NEWS_API_KEY_CURRENTS: str = ""

    SUMMARY_PROVIDER: str = "ollama"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_MAX_TOKENS: int = 512

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma2:2b"
    OLLAMA_TIMEOUT: int = 120

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_PERIOD: int = 60

    LOG_LEVEL: str = "INFO"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
