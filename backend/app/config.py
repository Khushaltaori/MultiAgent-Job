"""
Application configuration via pydantic-settings.
All values are read from environment variables (or .env file).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "ai_job_coach"

    # JWT
    SECRET_KEY: str  # no default – must be set
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # Rate limiting
    RATE_LIMIT_AUTH: str = "10/minute"       # applied to /register & /login
    RATE_LIMIT_INTERVIEW: str = "30/minute"  # applied to /interview/start & /respond

    # Redis (AsyncRedisSaver checkpointer)
    REDIS_URL: str = "redis://localhost:6379"

    # Google Gemini
    GEMINI_API_KEY: str   # read from GEMINI_API_KEY in .env
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"

    # Groq API Fallback
    GROQ_API_KEY: str | None = None

    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()  # type: ignore[call-arg]
