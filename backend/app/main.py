import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.database import engine
from app.models import JobPosting, User, Profile, Application, Interview

logger = logging.getLogger(__name__)

# Create database tables
JobPosting.metadata.create_all(bind=engine)
User.metadata.create_all(bind=engine)
Profile.metadata.create_all(bind=engine)
Application.metadata.create_all(bind=engine)
Interview.metadata.create_all(bind=engine)

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

_ensure_missing_columns()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
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
