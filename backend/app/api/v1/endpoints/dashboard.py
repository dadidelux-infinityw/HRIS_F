"""
Dashboard endpoints for statistics and overview
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import Dict, Any, List, Optional
from datetime import datetime, date

from app.db.database import get_db
from app.models.user import User
from app.models.job_posting import JobPosting, JobStatus
from app.models.application import Application, ApplicationStatus, RecruitmentStage
from app.models.interview import Interview, InterviewStatus
from app.models.profile import Profile
from app.core.dependencies import get_current_user, get_current_hr_or_admin

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get dashboard statistics
    Returns total counts for users, job postings, and interviews
    """
    # Count total users
    total_users = db.query(User).count()

    # Count total job postings
    total_jobs = db.query(JobPosting).count()

    # Count active job postings
    active_jobs = db.query(JobPosting).filter(JobPosting.status == JobStatus.ACTIVE).count()

    # TODO: Add interviews count when Interview model is created in Phase 5
    total_interviews = 0

    return {
        "total_users": total_users,
        "total_job_postings": total_jobs,
        "active_job_postings": active_jobs,
        "total_interviews": total_interviews,
        "user": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role
        }
    }


@router.get("/categories")
def get_job_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get job posting categories with counts
    Groups job postings by category/department
    """
    # Get all job postings
    job_postings = db.query(JobPosting).all()

    # Group by department (using department as category)
    categories: Dict[str, int] = {}
    for job in job_postings:
        dept = job.department or "Other"
        categories[dept] = categories.get(dept, 0) + 1

    # Convert to list of dictionaries
    result = [
        {
            "name": category,
            "count": count,
            "icon": get_category_icon(category)
        }
        for category, count in categories.items()
    ]

    # Sort by count (descending)
    result.sort(key=lambda x: x["count"], reverse=True)

    return result


@router.get("/recruitment-phases")
def get_recruitment_phases(
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get applicant counts and candidate names per recruitment stage.
    HR/Admin only.
    """
    from sqlalchemy.orm import joinedload

    all_stages = [s.value for s in RecruitmentStage]
    default_stage = RecruitmentStage.INITIAL_SCREENING.value

    # Fetch all active applications (exclude Rejected and Withdrawn)
    applications = db.query(Application).options(
        joinedload(Application.user),
        joinedload(Application.job_posting)
    ).filter(
        Application.status.notin_([ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN])
    ).all()

    # Group by stage; applications with no stage default to Initial Screening
    stage_map: Dict[str, list] = {s: [] for s in all_stages}
    for app in applications:
        stage = app.recruitment_stage if app.recruitment_stage in stage_map else default_stage
        stage_map[stage].append({
            "id": str(app.id),
            "name": app.user.full_name if app.user else "Unknown",
            "job_title": app.job_posting.job_title if app.job_posting else "Unknown",
        })

    return [
        {
            "phase_name": stage,
            "count": len(candidates),
            "candidates": candidates,
        }
        for stage, candidates in stage_map.items()
    ]


@router.get("/analytics")
def get_analytics(
    year: int = Query(default=None),
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analytics data: applicants per month, skills demand, avg time to hire, offer rate.
    HR/Admin only.
    """
    if year is None:
        year = datetime.utcnow().year

    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # 1. Applicants per month for the selected year
    applications_in_year = db.query(Application).filter(
        extract('year', Application.applied_date) == year
    ).all()

    monthly_counts = {i: 0 for i in range(1, 13)}
    for app in applications_in_year:
        monthly_counts[app.applied_date.month] += 1

    applicants_per_month = [
        {"month": MONTH_NAMES[m - 1], "count": monthly_counts[m]}
        for m in range(1, 13)
    ]

    # 2. Skills demand from all candidate profiles
    profiles = db.query(Profile).all()
    skill_counts: Dict[str, int] = {}
    for profile in profiles:
        for skill in (profile.skills or []):
            clean = skill.strip()
            if clean:
                skill_counts[clean] = skill_counts.get(clean, 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    other_count = sum(c for _, c in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[5:])
    skills_demand = [{"skill": s, "count": c} for s, c in top_skills]
    if other_count > 0:
        skills_demand.append({"skill": "Others", "count": other_count})

    # 3. Average time to hire (days from applied_date to Accepted timeline event)
    all_apps = db.query(Application).all()
    hire_times = []
    for app in all_apps:
        for event in (app.timeline or []):
            if event.get("status") == ApplicationStatus.ACCEPTED.value:
                try:
                    accepted_dt = datetime.fromisoformat(event["timestamp"])
                    applied_dt = datetime.combine(app.applied_date, datetime.min.time())
                    days = (accepted_dt - applied_dt).days
                    if 0 <= days <= 365:
                        hire_times.append(days)
                except Exception:
                    pass
                break  # Only use first accepted event per app

    avg_time_to_hire = round(sum(hire_times) / len(hire_times)) if hire_times else 0

    # 4. Offer rate
    total_apps = db.query(Application).count()
    accepted_apps = db.query(Application).filter(
        Application.status == ApplicationStatus.ACCEPTED
    ).count()
    offer_rate = round((accepted_apps / total_apps) * 100) if total_apps > 0 else 0

    # 5. For Interview count (applications in Interview recruitment stage)
    for_interview = db.query(Application).filter(
        Application.recruitment_stage == RecruitmentStage.INTERVIEW.value
    ).count()

    # 6. Positions filled (accepted)
    positions_filled = accepted_apps

    return {
        "year": year,
        "applicants_per_month": applicants_per_month,
        "skills_demand": skills_demand,
        "avg_time_to_hire": avg_time_to_hire,
        "offer_rate": offer_rate,
        "total_applicants": total_apps,
        "for_interview": for_interview,
        "positions_filled": positions_filled,
        "accepted_applicants": accepted_apps,
    }


@router.get("/candidate-summary")
def get_candidate_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get candidate-specific dashboard data in a single response.
    Returns metrics, application progress, upcoming interview,
    recommended jobs, and activity feed.
    """
    if current_user.role not in ("candidate",):
        raise HTTPException(status_code=403, detail="Candidate access only")

    # ── Fetch user's applications with related data ──
    user_apps = db.query(Application).options(
        joinedload(Application.job_posting),
        joinedload(Application.interviews)
    ).filter(Application.user_id == current_user.id).all()

    # ── Metrics ──
    non_withdrawn = [a for a in user_apps if a.status != ApplicationStatus.WITHDRAWN]
    applied_jobs = len(non_withdrawn)
    for_interview = len([a for a in non_withdrawn if a.recruitment_stage == RecruitmentStage.INTERVIEW.value])
    under_review = len([a for a in non_withdrawn if a.status in (ApplicationStatus.PENDING, ApplicationStatus.IN_PROCESS)])
    rejected = len([a for a in user_apps if a.status == ApplicationStatus.REJECTED])

    # ── Application Progress ──
    steps = ["Submitted", "Screening", "Interview", "Final Decision"]
    stage_to_step = {
        None: 0,
        RecruitmentStage.INITIAL_SCREENING.value: 0,
        RecruitmentStage.TEACHING_DEMO.value: 1,
        RecruitmentStage.INTERVIEW.value: 2,
        RecruitmentStage.FINAL_SELECTION.value: 3,
        RecruitmentStage.JOB_OFFER.value: 3,
        RecruitmentStage.ONBOARDING.value: 3,
    }
    active_apps = [a for a in non_withdrawn if a.status != ApplicationStatus.REJECTED]
    current_step = 0
    if active_apps:
        current_step = max(stage_to_step.get(a.recruitment_stage, 0) for a in active_apps)

    # ── Upcoming Interview ──
    today = date.today()
    upcoming = db.query(Interview).join(Application).filter(
        Application.user_id == current_user.id,
        Interview.status == InterviewStatus.SCHEDULED,
        Interview.interview_date >= today
    ).order_by(Interview.interview_date, Interview.interview_time).first()

    upcoming_interview = None
    if upcoming:
        # Get the job title through the application
        app_for_interview = db.query(Application).options(
            joinedload(Application.job_posting)
        ).filter(Application.id == upcoming.application_id).first()
        upcoming_interview = {
            "id": str(upcoming.id),
            "job_title": app_for_interview.job_posting.job_title if app_for_interview and app_for_interview.job_posting else "Unknown",
            "interview_date": upcoming.interview_date.isoformat(),
            "interview_time": upcoming.interview_time.strftime("%H:%M"),
            "location": upcoming.location,
            "interview_type": upcoming.interview_type.value if upcoming.interview_type else "Video",
        }

    # ── Recommended Jobs ──
    applied_job_ids = [a.job_posting_id for a in user_apps]
    recommended_query = db.query(JobPosting).filter(
        JobPosting.status == JobStatus.ACTIVE,
        JobPosting.application_deadline >= today,
    )
    if applied_job_ids:
        recommended_query = recommended_query.filter(JobPosting.id.notin_(applied_job_ids))
    recommended = recommended_query.order_by(JobPosting.date_posted.desc()).limit(3).all()

    recommended_jobs = [
        {
            "id": str(j.id),
            "job_title": j.job_title,
            "department": j.department,
            "location": j.location,
            "date_posted": j.date_posted.isoformat(),
        }
        for j in recommended
    ]

    # ── Activity Feed ──
    feed_items = []
    for app in user_apps:
        job_title = app.job_posting.job_title if app.job_posting else "Unknown"
        # Timeline events
        for event in (app.timeline or []):
            status = event.get("status", "")
            timestamp = event.get("timestamp", "")
            if status and timestamp:
                message = f"Your application for {job_title} status changed to {status}"
                if status == ApplicationStatus.PENDING.value:
                    message = f"You applied for {job_title}"
                elif status == ApplicationStatus.IN_PROCESS.value:
                    message = f"Your application for {job_title} is under review"
                elif status == ApplicationStatus.ACCEPTED.value:
                    message = f"Your application for {job_title} has been accepted"
                elif status == ApplicationStatus.REJECTED.value:
                    message = f"Your application for {job_title} has been rejected"
                feed_items.append({
                    "type": "application_status",
                    "message": message,
                    "timestamp": timestamp,
                    "job_title": job_title,
                })
        # Interview events
        for interview in (app.interviews or []):
            feed_items.append({
                "type": "interview_scheduled",
                "message": f"Interview scheduled for {job_title} on {interview.interview_date.isoformat()}",
                "timestamp": interview.created_at.isoformat() if interview.created_at else "",
                "job_title": job_title,
            })

    # Sort by timestamp descending, take top 10
    feed_items.sort(key=lambda x: x["timestamp"], reverse=True)
    feed_items = feed_items[:10]

    return {
        "metrics": {
            "applied_jobs": applied_jobs,
            "for_interview": for_interview,
            "under_review": under_review,
            "rejected": rejected,
        },
        "application_progress": {
            "current_step": current_step,
            "steps": steps,
        },
        "upcoming_interview": upcoming_interview,
        "recommended_jobs": recommended_jobs,
        "activity_feed": feed_items,
        "user": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
    }


def get_category_icon(category: str) -> str:
    """
    Map category/department names to icon names
    Using Lucide React icon names
    """
    icon_map = {
        "Engineering": "code",
        "Technology": "code",
        "IT": "laptop",
        "Marketing": "megaphone",
        "Sales": "trending-up",
        "Human Resources": "users",
        "HR": "users",
        "Finance": "dollar-sign",
        "Operations": "settings",
        "Customer Support": "headphones",
        "Support": "headphones",
        "Design": "palette",
        "Product": "package",
        "Legal": "scale",
        "Other": "briefcase"
    }

    return icon_map.get(category, "briefcase")
