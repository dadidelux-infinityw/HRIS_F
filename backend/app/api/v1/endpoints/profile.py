"""
Profile management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
from io import BytesIO
import logging

from app.db.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.resume import Resume, ResumeParsingStatus
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ChangePasswordRequest,
    ChangePasswordResponse
)
from app.schemas.resume import (
    ResumeUploadResponse,
    ResumeDeleteResponse,
    ResumeResponse,
    ResumeParsingStatusEnum
)
from app.core.dependencies import get_current_user
from app.core.security import verify_password, get_password_hash
from app.core.config import settings
from app.services.resume_parser import resume_parser_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Maximum file size in bytes
MAX_FILE_SIZE = settings.MAX_RESUME_SIZE_MB * 1024 * 1024


def _get_or_create_profile(db: Session, user_id) -> Profile:
    """Get existing profile or create a blank one."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(
            user_id=user_id,
            bio=None,
            skills=[],
            resume_skills=[],
            phone=None,
            address=None,
            documents=[]
        )
        db.add(profile)
        db.flush()
    return profile


def _remove_skills_by_provenance(profile: Profile) -> list[str]:
    """
    Remove resume-sourced skills from profile.skills, preserving manual skills.
    Returns the list of skills that were actually removed.
    """
    old_resume_skills = profile.resume_skills or []
    if not old_resume_skills:
        return []

    old_resume_lower = {s.lower() for s in old_resume_skills}
    current_skills = profile.skills or []

    # Keep only skills that were NOT sourced from the resume
    new_skills = [s for s in current_skills if s.lower() not in old_resume_lower]
    removed = [s for s in current_skills if s.lower() in old_resume_lower]

    profile.skills = new_skills
    profile.resume_skills = []
    return removed


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile
    Creates profile if it doesn't exist
    """
    profile = _get_or_create_profile(db, current_user.id)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    When skills are manually updated, resume_skills is synced so that only
    resume-sourced skills still present in the skills list remain tracked.
    """
    profile = _get_or_create_profile(db, current_user.id)

    update_data = profile_data.model_dump(exclude_unset=True)

    # If skills are being updated, sync resume_skills provenance
    if "skills" in update_data:
        new_skills = update_data["skills"] or []
        new_skills_lower = {s.lower() for s in new_skills}

        # Keep only resume_skills that are still present in the new skills list
        old_resume_skills = profile.resume_skills or []
        profile.resume_skills = [
            rs for rs in old_resume_skills if rs.lower() in new_skills_lower
        ]

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.put("/password", response_model=ChangePasswordResponse)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return ChangePasswordResponse(message="Password changed successfully")


# =============================================================================
# Resume Endpoints
# =============================================================================

@router.post("/resume", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a resume PDF.

    - Validates file type (PDF only) and size
    - Extracts text using pypdf
    - Parses resume using Gemini API
    - Stores PDF binary and parsed data in database
    - Auto-syncs extracted skills to user profile (replaces previous resume skills)
    - Replaces existing resume if one exists
    """
    # Validate content type
    if file.content_type not in settings.ALLOWED_RESUME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Only PDF files are allowed. Got: {file.content_type}"
        )

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_RESUME_SIZE_MB}MB"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded"
        )

    # Check for existing resume and delete it
    existing_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if existing_resume:
        db.delete(existing_resume)

    # Create new resume record
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume.pdf",
        file_data=file_content,
        file_size=file_size,
        content_type=file.content_type or "application/pdf",
        parsing_status=ResumeParsingStatus.PENDING
    )

    skills_added: list[str] = []
    skills_removed: list[str] = []

    try:
        # Parse resume (synchronous)
        extracted_text, parsed_data = resume_parser_service.parse_resume(file_content)

        resume.extracted_text = extracted_text
        resume.parsed_data = parsed_data
        resume.parsing_status = ResumeParsingStatus.COMPLETED
        resume.parsed_at = datetime.utcnow()

        # Extract skills and sync to profile
        extracted_skills = resume_parser_service.extract_skills(parsed_data)

        # Get or create profile
        profile = _get_or_create_profile(db, current_user.id)

        # Step 1: Remove OLD resume-sourced skills (provenance-aware replacement)
        skills_removed = _remove_skills_by_provenance(profile)

        # Step 2: Add NEW resume skills, preserving manual skills
        if extracted_skills:
            current_skills_lower = {s.lower() for s in (profile.skills or [])}
            for skill in extracted_skills:
                if skill.lower() not in current_skills_lower:
                    skills_added.append(skill)
                    current_skills_lower.add(skill.lower())

            profile.skills = (profile.skills or []) + skills_added

        # Step 3: Track the new resume skills as provenance
        profile.resume_skills = extracted_skills

        message = (
            f"Resume uploaded and parsed successfully. "
            f"{len(skills_added)} new skills added, "
            f"{len(skills_removed)} old resume skills removed."
        )

    except ValueError as e:
        # PDF extraction or JSON parsing error
        logger.warning(f"Resume parsing failed for user {current_user.id}: {str(e)}")
        resume.parsing_status = ResumeParsingStatus.FAILED
        resume.parsing_error = str(e)
        message = f"Resume uploaded but parsing failed: {str(e)}"

    except RuntimeError as e:
        # Gemini API error
        logger.error(f"Gemini API error for user {current_user.id}: {str(e)}")
        resume.parsing_status = ResumeParsingStatus.FAILED
        resume.parsing_error = str(e)
        message = f"Resume uploaded but AI parsing unavailable: {str(e)}"

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse(
        id=resume.id,
        filename=resume.filename,
        file_size=resume.file_size,
        parsing_status=ResumeParsingStatusEnum(resume.parsing_status.value),
        uploaded_at=resume.uploaded_at,
        skills_added=skills_added,
        skills_removed=skills_removed,
        message=message
    )


@router.get("/resume", response_model=ResumeResponse)
def get_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's resume data (metadata and parsed content).
    """
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload a resume first."
        )

    return resume


@router.get("/resume/download")
def download_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download the original PDF resume file.
    """
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload a resume first."
        )

    return StreamingResponse(
        BytesIO(resume.file_data),
        media_type=resume.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{resume.filename}"'
        }
    )


@router.delete("/resume", response_model=ResumeDeleteResponse)
def delete_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete current user's resume.
    Removes only resume-sourced skills from the profile while preserving
    any skills the user added manually.
    """
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found"
        )

    # Remove resume-sourced skills from profile (preserves manual skills)
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    skills_removed: list[str] = []
    if profile:
        skills_removed = _remove_skills_by_provenance(profile)

    db.delete(resume)
    db.commit()

    return ResumeDeleteResponse(
        message=f"Resume deleted successfully. {len(skills_removed)} resume-sourced skills removed from profile.",
        skills_removed=skills_removed
    )


# =============================================================================
# Legacy Document Endpoints (for backward compatibility)
# =============================================================================

@router.post("/documents")
def upload_document(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    [DEPRECATED] Use POST /profile/resume instead.
    """
    raise HTTPException(
        status_code=status.HTTP_301_MOVED_PERMANENTLY,
        detail="This endpoint is deprecated. Use POST /profile/resume instead."
    )


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document from user's profile
    """
    # Get profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Find and remove document
    documents = profile.documents or []
    updated_documents = [doc for doc in documents if doc.get('id') != document_id]

    if len(updated_documents) == len(documents):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    profile.documents = updated_documents
    db.commit()

    return {"message": "Document deleted successfully"}
