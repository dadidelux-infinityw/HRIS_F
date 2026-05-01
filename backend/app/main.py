import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.database import engine
from app.models import JobPosting, User, Profile, Application, Interview
from app.models.user import PasswordResetToken

logger = logging.getLogger(__name__)

# Create database tables
JobPosting.metadata.create_all(bind=engine)
User.metadata.create_all(bind=engine)
Profile.metadata.create_all(bind=engine)
Application.metadata.create_all(bind=engine)
Interview.metadata.create_all(bind=engine)
PasswordResetToken.metadata.create_all(bind=engine)

# Ensure columns added after initial schema exist (create_all only creates
# new tables, it does not add columns to existing ones).
def _ensure_missing_columns():
    insp = inspect(engine)
    # profiles.resume_skills
    if 'profiles' in insp.get_table_names():
        existing = {c['name'] for c in insp.get_columns('profiles')}
        if 'resume_skills' not in existing:
            logger.info("Adding missing column profiles.resume_skills")
            with engine.begin() as conn:
                conn.execute(text(
                    "ALTER TABLE profiles ADD COLUMN resume_skills "
                    "JSON NOT NULL DEFAULT '[]'"
                ))

    if 'password_reset_tokens' not in insp.get_table_names():
        PasswordResetToken.metadata.create_all(bind=engine)

    # users.oauth_provider, users.oauth_subject, hashed_password nullable
    if 'users' in insp.get_table_names():
        existing = {c['name'] for c in insp.get_columns('users')}
        if 'oauth_provider' not in existing:
            logger.info("Adding missing column users.oauth_provider")
            with engine.begin() as conn:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50)"
                ))
        if 'oauth_subject' not in existing:
            logger.info("Adding missing column users.oauth_subject")
            with engine.begin() as conn:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN oauth_subject VARCHAR(255)"
                ))
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_users_oauth_subject ON users (oauth_subject)"
                ))
        # Make hashed_password nullable for OAuth-only users
        try:
            with engine.begin() as conn:
                conn.execute(text(
                    "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"
                ))
        except Exception:
            # Already nullable or unsupported dialect
            pass

_ensure_missing_columns()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Session middleware (required for Authlib OAuth state)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.JWT_SECRET_KEY,
    same_site="lax",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "message": "Welcome to HRIS API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
