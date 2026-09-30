from fastapi import APIRouter
from app.api.v1.endpoints import job_postings, auth, users, dashboard, profile, applications, interviews, matching, notifications

api_router = APIRouter()

# Authentication routes
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# User management routes
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Profile routes
api_router.include_router(
    profile.router,
    prefix="/profile",
    tags=["profile"]
)

# Dashboard routes
api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["dashboard"]
)

# Applications routes
api_router.include_router(
    applications.router,
    prefix="/applications",
    tags=["applications"]
)

# Interviews routes
api_router.include_router(
    interviews.router,
    prefix="/interviews",
    tags=["interviews"]
)

# Job postings routes
api_router.include_router(
    job_postings.router,
    prefix="/job-postings",
    tags=["job-postings"]
)

# Candidate matching routes
api_router.include_router(
    matching.router,
    prefix="/matching",
    tags=["matching"]
)

# Notification routes
api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["notifications"]
)
