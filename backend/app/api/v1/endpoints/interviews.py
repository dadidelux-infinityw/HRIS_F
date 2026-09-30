"""
Interview management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from app.db.database import get_db
from app.models.user import User
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.application import Application
from app.models.job_posting import JobPosting
from app.schemas.interview import (
    InterviewResponse,
    InterviewCreate,
    InterviewUpdate
)
from app.core.dependencies import get_current_user
from app.models.notification import NotificationType
from app.services.notifications import notify

router = APIRouter()


def _notify_candidate(db, application, current_user, type, title, message):
    """Notify the applicant about an interview change made by someone else."""
    if not application or application.user_id == current_user.id:
        return
    notify(
        db,
        user_id=application.user_id,
        type=type,
        title=title,
        message=message,
        link="/my-interviews",
    )


def _interview_label(interview, application):
    job_title = application.job_posting.job_title if application and application.job_posting else "the role"
    return (
        f"{job_title} on {interview.interview_date.strftime('%b %d, %Y')} "
        f"at {interview.interview_time.strftime('%I:%M %p')}"
    )


@router.get("/", response_model=List[InterviewResponse])
def list_interviews(
    filter_type: Optional[str] = None,  # "upcoming" or "completed"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List interviews
    - HR/Admin: See all interviews
    - Candidates: See only their own interviews
    """
    query = db.query(Interview).join(Application)

    # Role-based filtering
    if current_user.role.value == "candidate":
        query = query.filter(Application.user_id == current_user.id)

    # Apply filter
    if filter_type == "upcoming":
        query = query.filter(
            Interview.status == InterviewStatus.SCHEDULED,
            Interview.interview_date >= date.today()
        )
    elif filter_type == "completed":
        query = query.filter(
            (Interview.status == InterviewStatus.COMPLETED) |
            (Interview.interview_date < date.today())
        )

    interviews = query.order_by(Interview.interview_date.desc(), Interview.interview_time.desc()).all()
    return interviews


@router.get("/my")
def get_my_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's interviews with job details
    For candidate dashboard
    """
    interviews = db.query(Interview).join(
        Application, Interview.application_id == Application.id
    ).join(
        JobPosting, Application.job_posting_id == JobPosting.id
    ).filter(
        Application.user_id == current_user.id
    ).order_by(Interview.interview_date.desc()).all()

    # Format for frontend
    result = []
    for interview in interviews:
        app = interview.application
        job = app.job_posting if app else None

        result.append({
            "id": str(interview.id),
            "job_title": job.job_title if job else "Unknown",
            "department": job.department if job else "Unknown",
            "interview_date": interview.interview_date.isoformat(),
            "interview_time": interview.interview_time.strftime("%H:%M") if interview.interview_time else "",
            "interview_type": interview.interview_type.value,
            "location": interview.location or "",
            "interviewer_name": interview.interviewer_name or "TBD",
            "status": interview.status.value,
            "notes": interview.notes,
        })

    return result


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific interview by ID
    """
    interview = db.query(Interview).join(Application).filter(
        Interview.id == interview_id,
        Application.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    return interview


@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Schedule a new interview
    (Typically called by HR/Admin, but allowing candidates for testing)
    """
    # Check if application exists
    application = db.query(Application).filter(
        Application.id == interview_data.application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Validate interview type
    try:
        interview_type = InterviewType(interview_data.interview_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid interview type"
        )

    # Create interview
    new_interview = Interview(
        application_id=interview_data.application_id,
        interview_date=interview_data.interview_date,
        interview_time=interview_data.interview_time,
        location=interview_data.location,
        interview_type=interview_type,
        status=InterviewStatus.SCHEDULED,
        notes=interview_data.notes,
        interviewer_name=interview_data.interviewer_name
    )

    db.add(new_interview)
    _notify_candidate(
        db, application, current_user,
        NotificationType.INTERVIEW_SCHEDULED,
        "Interview scheduled",
        f"Your interview for {_interview_label(new_interview, application)} has been scheduled.",
    )
    db.commit()
    db.refresh(new_interview)

    return new_interview


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: str,
    interview_data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update/reschedule an interview
    """
    interview = db.query(Interview).join(Application).filter(
        Interview.id == interview_id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    old_date = interview.interview_date
    old_time = interview.interview_time
    old_status = interview.status

    # Update fields
    update_data = interview_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status":
            try:
                value = InterviewStatus(value)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid status value"
                )
        elif field == "interview_type" and value:
            try:
                value = InterviewType(value)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid interview type"
                )

        setattr(interview, field, value)

    application = interview.application
    label = _interview_label(interview, application)
    if interview.status != old_status and interview.status == InterviewStatus.CANCELLED:
        _notify_candidate(
            db, application, current_user,
            NotificationType.INTERVIEW_CANCELLED,
            "Interview cancelled",
            f"Your interview for {label} has been cancelled.",
        )
    elif interview.status != old_status and interview.status == InterviewStatus.COMPLETED:
        _notify_candidate(
            db, application, current_user,
            NotificationType.INTERVIEW_UPDATED,
            "Interview completed",
            f"Your interview for {label} has been marked as completed.",
        )
    elif (
        interview.interview_date != old_date
        or interview.interview_time != old_time
        or (interview.status != old_status and interview.status == InterviewStatus.RESCHEDULED)
    ):
        _notify_candidate(
            db, application, current_user,
            NotificationType.INTERVIEW_UPDATED,
            "Interview rescheduled",
            f"Your interview has been rescheduled to {label}.",
        )

    db.commit()
    db.refresh(interview)

    return interview


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an interview
    """
    interview = db.query(Interview).join(Application).filter(
        Interview.id == interview_id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Mark as cancelled instead of deleting
    already_cancelled = interview.status == InterviewStatus.CANCELLED
    interview.status = InterviewStatus.CANCELLED
    if not already_cancelled:
        _notify_candidate(
            db, interview.application, current_user,
            NotificationType.INTERVIEW_CANCELLED,
            "Interview cancelled",
            f"Your interview for {_interview_label(interview, interview.application)} has been cancelled.",
        )
    db.commit()

    return {"message": "Interview cancelled successfully"}
