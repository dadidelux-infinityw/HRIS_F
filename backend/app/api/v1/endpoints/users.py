from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.resume import Resume
from app.models.application import Application
from app.models.interview import Interview
from app.models.job_posting import JobPosting
from app.schemas.user import UserResponse, UserUpdate
from app.core.dependencies import get_current_user, get_current_active_admin, get_current_hr_or_admin

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB


class UserMeUpdate(BaseModel):
    full_name: Optional[str] = None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user's account info"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserMeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's full name"""
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a profile picture (JPEG / PNG / WebP, max 5 MB)"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: JPEG, PNG, WebP.",
        )
    data = await file.read()
    if len(data) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5 MB.",
        )
    if len(data) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")

    current_user.avatar_data = data
    current_user.avatar_content_type = file.content_type
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}/avatar")
def get_user_avatar(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    """Serve a user's avatar image — no auth required so <img> tags work"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.avatar_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No avatar found.")
    return Response(
        content=user.avatar_data,
        media_type=user.avatar_content_type or "image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_or_admin)
):
    """Get all users (HR or Admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Users can only view their own profile unless they're admin
    if user.id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Users can only update their own profile unless they're admin
    if user.id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Update user fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hr_or_admin)
):
    """Delete user (HR or Admin only). Cascades: profile, resume, applications → interviews."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 1. Delete profile
    db.query(Profile).filter(Profile.user_id == user_id).delete()

    # 2. Delete resume
    db.query(Resume).filter(Resume.user_id == user_id).delete()

    # 3. Delete interviews linked to this user's applications, then the applications
    user_app_ids = [
        a.id for a in db.query(Application).filter(Application.user_id == user_id).all()
    ]
    if user_app_ids:
        db.query(Interview).filter(Interview.application_id.in_(user_app_ids)).delete(synchronize_session=False)
    db.query(Application).filter(Application.user_id == user_id).delete()

    # 4. Nullify created_by on job postings instead of deleting them
    db.query(JobPosting).filter(JobPosting.created_by == user_id).update(
        {"created_by": None}, synchronize_session=False
    )

    # 5. Finally delete the user
    db.delete(user)
    db.commit()

    return None
