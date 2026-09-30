"""
Application management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.application import Application, ApplicationStatus, RecruitmentStage
from app.models.job_posting import JobPosting
from app.schemas.application import (
    ApplicationResponse,
    ApplicationCreate,
    ApplicationUpdate
)
from app.core.dependencies import get_current_user
from app.models.notification import NotificationType
from app.services.notifications import notify

router = APIRouter()


def _notify_candidate_of_change(db, application, current_user, type, title, change):
    """Notify the applicant about a change made by someone else (HR/Admin)."""
    if application.user_id == current_user.id:
        return
    job_title = application.job_posting.job_title if application.job_posting else "the role"
    notify(
        db,
        user_id=application.user_id,
        type=type,
        title=title,
        message=f"Your application for {job_title}: {change}.",
        link="/my-applications",
    )


@router.get("/", response_model=List[ApplicationResponse])
def list_applications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List applications
    - HR/Admin: See all applications
    - Candidates: See only their own applications
    """
    query = db.query(Application).options(
        joinedload(Application.job_posting),
        joinedload(Application.user)
    )

    # Role-based filtering
    if current_user.role.value == "candidate":
        query = query.filter(Application.user_id == current_user.id)

    if status_filter:
        try:
            status_enum = ApplicationStatus(status_filter)
            query = query.filter(Application.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter

    applications = query.order_by(Application.applied_date.desc()).all()
    return applications


@router.get("/my")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's applications with job posting details
    For candidate dashboard
    """
    applications = db.query(Application).options(
        joinedload(Application.job_posting)
    ).filter(
        Application.user_id == current_user.id
    ).order_by(Application.applied_date.desc()).all()

    # Format for frontend
    result = []
    for app in applications:
        result.append({
            "id": str(app.id),
            "job_posting_id": str(app.job_posting_id),
            "job_title": app.job_posting.job_title if app.job_posting else "Unknown",
            "department": app.job_posting.department if app.job_posting else "Unknown",
            "location": app.job_posting.location if app.job_posting else "Unknown",
            "status": app.status.value,
            "recruitment_stage": app.recruitment_stage,
            "applied_at": app.applied_date.isoformat(),
            "updated_at": app.updated_at.isoformat(),
        })

    return result


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific application by ID
    """
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    return application


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a new job application
    """
    # Check if job posting exists
    job_posting = db.query(JobPosting).filter(
        JobPosting.id == application_data.job_posting_id
    ).first()

    if not job_posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )

    # Check if user already applied to this job
    existing_application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_posting_id == application_data.job_posting_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this position"
        )

    # Create timeline event
    timeline = [{
        "status": ApplicationStatus.PENDING.value,
        "timestamp": datetime.utcnow().isoformat(),
        "note": "Application submitted"
    }]

    # Create application
    new_application = Application(
        user_id=current_user.id,
        job_posting_id=application_data.job_posting_id,
        cover_letter=application_data.cover_letter,
        status=ApplicationStatus.PENDING,
        timeline=timeline
    )

    db.add(new_application)
    notify(
        db,
        user_id=current_user.id,
        type=NotificationType.APPLICATION_SUBMITTED,
        title="Application received",
        message=f"Your application for {job_posting.job_title} has been received.",
        link="/my-applications",
    )
    db.commit()
    db.refresh(new_application)

    return new_application


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an application
    - HR/Admin: change status and recruitment stage
    - Candidates: own application only; edit cover letter or withdraw
    """
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    is_hr_or_admin = current_user.role.value in ("hr", "admin")

    # Non-HR users can only update their own applications
    if not is_hr_or_admin and application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own applications"
        )

    # Status and stage changes are HR/Admin only; candidates may only withdraw
    if not is_hr_or_admin:
        status_changing = (
            application_data.status
            and application_data.status != application.status.value
        )
        if status_changing and application_data.status != ApplicationStatus.WITHDRAWN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only HR or Admin can change the application status"
            )
        if application_data.recruitment_stage is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only HR or Admin can change the recruitment stage"
            )

    # Update status if changed
    if application_data.status and application_data.status != application.status.value:
        try:
            new_status = ApplicationStatus(application_data.status)
            old_status = application.status.value

            # Add timeline event — create a new list so SQLAlchemy detects the change
            new_entry = {
                "status": new_status.value,
                "timestamp": datetime.utcnow().isoformat(),
                "note": application_data.note or f"Status changed from {old_status} to {new_status.value}"
            }
            application.status = new_status
            application.timeline = (application.timeline or []) + [new_entry]
            _notify_candidate_of_change(
                db, application, current_user,
                NotificationType.STATUS_CHANGED,
                "Application status updated",
                f"status changed to {new_status.value}",
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status value"
            )

    # Update recruitment stage if provided
    if application_data.recruitment_stage is not None:
        valid_stages = {s.value for s in RecruitmentStage}
        if application_data.recruitment_stage not in valid_stages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid recruitment stage. Valid values: {sorted(valid_stages)}"
            )
        if application_data.recruitment_stage != application.recruitment_stage:
            _notify_candidate_of_change(
                db, application, current_user,
                NotificationType.STAGE_CHANGED,
                "Recruitment stage updated",
                f"moved to the {application_data.recruitment_stage} stage",
            )
        application.recruitment_stage = application_data.recruitment_stage

    # Update cover letter if provided
    if application_data.cover_letter is not None:
        application.cover_letter = application_data.cover_letter

    db.commit()
    db.refresh(application)

    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Withdraw/delete an application
    """
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Mark as withdrawn instead of deleting — create new list so SQLAlchemy detects the change
    application.status = ApplicationStatus.WITHDRAWN
    application.timeline = (application.timeline or []) + [{
        "status": ApplicationStatus.WITHDRAWN.value,
        "timestamp": datetime.utcnow().isoformat(),
        "note": "Application withdrawn by candidate"
    }]

    db.commit()

    return {"message": "Application withdrawn successfully"}
