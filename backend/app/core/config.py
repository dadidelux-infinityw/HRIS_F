from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "HRIS API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@localhost:5432/hris_db"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # JWT Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-this-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # Frontend and email delivery
    FRONTEND_URL: str = "http://localhost:5173"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    DEBUG_EMAIL: bool = True

    # OAuth (Google / LinkedIn)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_BASE: str = "http://localhost:8000/api/v1"

    # Gemini API (Resume Parsing)
    GEMINI_API_KEY: str = ""
    MAX_RESUME_SIZE_MB: int = 10
    ALLOWED_RESUME_TYPES: List[str] = ["application/pdf"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
