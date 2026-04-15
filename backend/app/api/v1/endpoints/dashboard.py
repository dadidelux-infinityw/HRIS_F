"""
Dashboard endpoints for statistics and overview
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import logging
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.job_posting import JobPosting, JobStatus
from app.models.application import Application, ApplicationStatus, RecruitmentStage
from app.models.interview import Interview, InterviewStatus
from app.models.profile import Profile
from app.models.resume import Resume
from app.core.dependencies import get_current_user, get_current_hr_or_admin

logger = logging.getLogger(__name__)

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


# ──────────────────────────────────────────────────────────────────────
# HR Insights endpoints (admin/HR only)
# ──────────────────────────────────────────────────────────────────────

@router.get("/insights/top-candidates")
def get_top_candidates(
    job_id: str = Query(..., description="Job posting ID"),
    limit: int = Query(default=3, ge=1, le=20),
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Return the top-N candidates for a given active job posting,
    scored by the hybrid matching service.
    """
    # Validate job exists
    job = db.query(JobPosting).filter(JobPosting.id == uuid.UUID(job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")

    requirements = job.requirements or []
    if not requirements:
        return {"job_id": job_id, "job_title": job.job_title, "top_candidates": []}

    # Get all candidate profiles with skills
    candidate_profiles = db.query(Profile).filter(Profile.skills != None).all()  # noqa: E711
    candidates = []
    for prof in candidate_profiles:
        skills = prof.skills or []
        if not skills:
            continue
        try:
            from app.services.matching.hybrid_matcher import compute_candidate_score
            scores = compute_candidate_score(db, skills, requirements)
            if scores["total_score"] > 0:
                user = db.query(User).filter(User.id == prof.user_id).first()
                if user and user.role == "candidate":
                    # Determine matched skills (keyword overlap)
                    req_lower = [r.lower() for r in requirements]
                    matched = [
                        s for s in skills
                        if any(s.lower() == r or s.lower() in r or r in s.lower() for r in req_lower)
                    ]
                    candidates.append({
                        "user_id": str(user.id),
                        "full_name": user.full_name,
                        "email": user.email,
                        "match_score": scores["total_score"],
                        "semantic_score": scores["semantic_score"],
                        "keyword_score": scores["keyword_score"],
                        "skills_matched": matched[:10],
                        "total_skills": len(skills),
                    })
        except Exception:
            logger.warning(f"Could not score candidate {prof.user_id}", exc_info=True)

    # Sort by total_score descending
    candidates.sort(key=lambda c: c["match_score"], reverse=True)
    top = candidates[:limit]

    return {
        "job_id": job_id,
        "job_title": job.job_title,
        "requirements": requirements,
        "total_candidates_scored": len(candidates),
        "top_candidates": top,
    }


@router.get("/insights/flags")
def get_insight_flags(
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Rule-based insight flags derived from match scores and application data.
    Returns a list of actionable insight cards for HR.
    """
    flags: List[Dict[str, Any]] = []

    # --- Flag 1: High-match candidates missing certifications ---
    active_jobs = db.query(JobPosting).filter(JobPosting.status == JobStatus.ACTIVE).all()
    for job in active_jobs:
        requirements = job.requirements or []
        # Look for certification-related requirements
        cert_requirements = [
            r for r in requirements
            if any(kw in r.lower() for kw in ["certification", "certified", "license", "cert", "credential"])
        ]
        if not cert_requirements:
            continue

        # Score candidates for this job
        candidate_profiles = db.query(Profile).filter(Profile.skills != None).all()  # noqa: E711
        for prof in candidate_profiles:
            skills = prof.skills or []
            if not skills:
                continue
            try:
                from app.services.matching.hybrid_matcher import compute_candidate_score
                scores = compute_candidate_score(db, skills, requirements)
            except Exception:
                continue

            if scores["total_score"] >= 75:
                # Check if any cert requirement is NOT matched
                skills_lower = [s.lower() for s in skills]
                missing_certs = []
                for cert_req in cert_requirements:
                    cert_lower = cert_req.lower()
                    matched = any(
                        sl == cert_lower or sl in cert_lower or cert_lower in sl
                        for sl in skills_lower
                    )
                    if not matched:
                        missing_certs.append(cert_req)

                if missing_certs:
                    user = db.query(User).filter(User.id == prof.user_id).first()
                    if user and user.role == "candidate":
                        flags.append({
                            "type": "high_match_missing_cert",
                            "severity": "warning",
                            "message": (
                                f"{user.full_name} has {scores['total_score']:.0f}% match "
                                f"for {job.job_title} but lacks: {', '.join(missing_certs[:3])}"
                            ),
                            "candidate_name": user.full_name,
                            "job_title": job.job_title,
                            "match_score": scores["total_score"],
                            "missing_items": missing_certs[:5],
                        })

        # Limit flags per job to avoid overload
        job_flags = [f for f in flags if f.get("job_title") == job.job_title]
        if len(job_flags) > 5:
            # Keep only top 5 by match score
            job_flags_sorted = sorted(job_flags, key=lambda f: f["match_score"], reverse=True)[:5]
            flags = [f for f in flags if f.get("job_title") != job.job_title] + job_flags_sorted

    # --- Flag 2: Applicants meeting criteria but under-ranked ---
    all_apps = db.query(Application).options(
        joinedload(Application.user),
        joinedload(Application.job_posting),
    ).filter(
        Application.status.notin_([ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN])
    ).all()

    under_ranked_count = 0
    for app in all_apps:
        job = app.job_posting
        if not job or not job.requirements:
            continue
        prof = db.query(Profile).filter(Profile.user_id == app.user_id).first()
        if not prof or not prof.skills:
            continue
        try:
            from app.services.matching.hybrid_matcher import compute_candidate_score
            scores = compute_candidate_score(db, prof.skills, job.requirements)
        except Exception:
            continue

        # "Meets criteria" = keyword_score >= 0.5
        if scores["keyword_score"] >= 0.5:
            # Check if they're still in early stages
            if app.recruitment_stage in [
                RecruitmentStage.INITIAL_SCREENING.value,
                None,
            ]:
                under_ranked_count += 1

    if under_ranked_count > 0:
        flags.append({
            "type": "under_ranked",
            "severity": "info",
            "message": (
                f"{under_ranked_count} applicant{'s' if under_ranked_count != 1 else ''} "
                f"meet minimum criteria but remain in early screening stages."
            ),
            "count": under_ranked_count,
        })

    # --- Flag 3: Stale applications (pending > 14 days) ---
    from datetime import timedelta
    stale_cutoff = date.today() - timedelta(days=14)
    stale_apps = db.query(Application).filter(
        Application.status == ApplicationStatus.PENDING,
        Application.applied_date <= stale_cutoff,
    ).count()

    if stale_apps > 0:
        flags.append({
            "type": "stale_applications",
            "severity": "warning",
            "message": (
                f"{stale_apps} application{'s' if stale_apps != 1 else ''} "
                f"have been pending for over 14 days without review."
            ),
            "count": stale_apps,
        })

    return {"flags": flags, "total_flags": len(flags)}


def _estimate_experience_years(work_experience: List[Dict]) -> float:
    """
    Estimate total years of experience from parsed resume work_experience.
    Attempts to parse start_date / end_date strings.
    """
    import re
    total_months = 0
    for exp in work_experience:
        start = exp.get("start_date", "")
        end = exp.get("end_date", "")
        if not start:
            continue

        def _parse_year(date_str: str) -> int:
            if not date_str:
                return 0
            match = re.search(r'\b(19|20)\d{2}\b', str(date_str))
            return int(match.group()) if match else 0

        start_yr = _parse_year(start)
        end_yr = _parse_year(end) if end and end.lower() != "present" else datetime.utcnow().year
        if start_yr and end_yr and end_yr >= start_yr:
            total_months += (end_yr - start_yr) * 12

    return round(total_months / 12, 1)


def _classify_education_level(education: List[Dict]) -> str:
    """
    Classify the highest education level from parsed resume education.
    Returns one of: 'High School', 'Bachelor', 'Master', 'PhD', 'Other'.
    """
    level_rank = {"High School": 0, "Bachelor": 1, "Master": 2, "PhD": 3}
    highest = "Other"
    highest_rank = -1

    for edu in education:
        degree = (edu.get("degree") or "").lower()
        if not degree:
            continue
        if any(kw in degree for kw in ["phd", "ph.d", "doctorate", "doctoral"]):
            level = "PhD"
        elif any(kw in degree for kw in ["master", "msc", "ms ", "m.s", "ma ", "m.a", "mba", "m.eng"]):
            level = "Master"
        elif any(kw in degree for kw in ["bachelor", "bsc", "bs ", "b.s", "ba ", "b.a", "b.eng", "undergrad"]):
            level = "Bachelor"
        elif any(kw in degree for kw in ["high school", "secondary", "ged"]):
            level = "High School"
        else:
            level = "Other"

        if level_rank.get(level, -1) > highest_rank:
            highest = level
            highest_rank = level_rank.get(level, -1)

    return highest


@router.get("/insights/experience-distribution")
def get_experience_distribution(
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Bucket all candidates by experience level: Entry (0-2), Mid (3-5),
    Senior (6-10), Lead+ (10+), based on parsed resume work_experience.
    """
    resumes = db.query(Resume).filter(
        Resume.parsed_data != None,  # noqa: E711
        Resume.parsing_status == "completed",
    ).all()

    buckets = {"Entry (0-2 yrs)": 0, "Mid (3-5 yrs)": 0, "Senior (6-10 yrs)": 0, "Lead+ (10+ yrs)": 0, "Unknown": 0}
    details = []

    for resume in resumes:
        parsed = resume.parsed_data or {}
        work_exp = parsed.get("work_experience", [])
        years = _estimate_experience_years(work_exp)

        if years <= 0:
            bucket = "Unknown"
        elif years <= 2:
            bucket = "Entry (0-2 yrs)"
        elif years <= 5:
            bucket = "Mid (3-5 yrs)"
        elif years <= 10:
            bucket = "Senior (6-10 yrs)"
        else:
            bucket = "Lead+ (10+ yrs)"

        buckets[bucket] += 1
        user = db.query(User).filter(User.id == resume.user_id).first()
        details.append({
            "user_id": str(resume.user_id),
            "full_name": user.full_name if user else "Unknown",
            "years_experience": years,
            "bucket": bucket,
        })

    distribution = [{"level": k, "count": v} for k, v in buckets.items()]
    return {"distribution": distribution, "total_candidates": len(details), "details": details}


@router.get("/insights/education-distribution")
def get_education_distribution(
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Distribution of highest education level across all candidates
    with parsed resumes: High School / Bachelor / Master / PhD / Other.
    """
    resumes = db.query(Resume).filter(
        Resume.parsed_data != None,  # noqa: E711
        Resume.parsing_status == "completed",
    ).all()

    buckets = {"High School": 0, "Bachelor": 0, "Master": 0, "PhD": 0, "Other": 0, "Unknown": 0}
    details = []

    for resume in resumes:
        parsed = resume.parsed_data or {}
        education = parsed.get("education", [])
        if not education:
            level = "Unknown"
        else:
            level = _classify_education_level(education)

        buckets[level] += 1
        user = db.query(User).filter(User.id == resume.user_id).first()
        details.append({
            "user_id": str(resume.user_id),
            "full_name": user.full_name if user else "Unknown",
            "education_level": level,
        })

    distribution = [{"level": k, "count": v} for k, v in buckets.items()]
    return {"distribution": distribution, "total_candidates": len(details), "details": details}


@router.get("/insights/hiring-funnel")
def get_hiring_funnel(
    current_user: User = Depends(get_current_hr_or_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Hiring funnel: Applied → Screened → Interviewed → Offered → Hired.
    Aggregated from applications.status and recruitment_stage.
    """
    total_applied = db.query(Application).count()

    # Screened = applications that moved past initial screening
    screened = db.query(Application).filter(
        Application.recruitment_stage.in_([
            RecruitmentStage.TEACHING_DEMO.value,
            RecruitmentStage.INTERVIEW.value,
            RecruitmentStage.FINAL_SELECTION.value,
            RecruitmentStage.JOB_OFFER.value,
            RecruitmentStage.ONBOARDING.value,
        ])
    ).count()

    # Interviewed = had/has interview stage
    interviewed = db.query(Application).filter(
        Application.recruitment_stage.in_([
            RecruitmentStage.INTERVIEW.value,
            RecruitmentStage.FINAL_SELECTION.value,
            RecruitmentStage.JOB_OFFER.value,
            RecruitmentStage.ONBOARDING.value,
        ])
    ).count()

    # Also count applications that have at least one completed interview
    interviewed_from_interviews = db.query(Interview).filter(
        Interview.status == InterviewStatus.COMPLETED
    ).count()
    interviewed = max(interviewed, interviewed_from_interviews)

    # Offered = Job Offer or Onboarding stage
    offered = db.query(Application).filter(
        Application.recruitment_stage.in_([
            RecruitmentStage.JOB_OFFER.value,
            RecruitmentStage.ONBOARDING.value,
        ])
    ).count()

    # Hired = Accepted status
    hired = db.query(Application).filter(
        Application.status == ApplicationStatus.ACCEPTED
    ).count()

    funnel = [
        {"stage": "Applied", "count": total_applied},
        {"stage": "Screened", "count": screened},
        {"stage": "Interviewed", "count": interviewed},
        {"stage": "Offered", "count": offered},
        {"stage": "Hired", "count": hired},
    ]

    # Compute conversion rates
    conversion = {}
    for i, step in enumerate(funnel):
        if i == 0:
            conversion["overall"] = round((hired / total_applied * 100) if total_applied > 0 else 0, 1)
        else:
            prev = funnel[i - 1]["count"]
            curr = step["count"]
            key = f"{funnel[i-1]['stage'].lower()}_to_{step['stage'].lower()}"
            conversion[key] = round((curr / prev * 100) if prev > 0 else 0, 1)

    return {"funnel": funnel, "conversion_rates": conversion}


@router.get("/candidate-summary")
def get_candidate_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get the new-style dashboard data (metrics, application progress,
    upcoming interview, recommended jobs, activity feed).
    Works for all roles — for admin/hr the user's own application
    data will typically be empty, but recommended jobs and categories
    still populate meaningfully.
    """
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
    accepted = len([a for a in user_apps if a.status == ApplicationStatus.ACCEPTED])

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

    # ── Top Recommendation (matching-based insight) ──
    top_recommendation = None
    try:
        from app.services.matching.hybrid_matcher import compute_candidate_score

        # Get candidate's skills from profile
        candidate_profile = db.query(Profile).filter(
            Profile.user_id == current_user.id
        ).first()
        candidate_skills = (candidate_profile.skills if candidate_profile else []) or []

        if candidate_skills:
            # Get IDs of jobs already applied to
            applied_job_ids = [a.job_posting_id for a in user_apps]

            # Find active jobs the candidate hasn't applied to
            available_jobs = db.query(JobPosting).filter(
                JobPosting.status == JobStatus.ACTIVE,
                JobPosting.application_deadline >= today,
            )
            if applied_job_ids:
                available_jobs = available_jobs.filter(JobPosting.id.notin_(applied_job_ids))
            available_jobs = available_jobs.all()

            # Score each job and pick the best match
            best_score = -1.0
            best_job = None
            for job in available_jobs:
                requirements = job.requirements or []
                if not requirements:
                    continue
                scores = compute_candidate_score(db, candidate_skills, requirements)
                if scores["total_score"] > best_score:
                    best_score = scores["total_score"]
                    best_job = job

            if best_job and best_score > 0:
                top_recommendation = {
                    "job_id": str(best_job.id),
                    "job_title": best_job.job_title,
                    "department": best_job.department,
                    "match_score": round(best_score, 1),
                }
    except Exception:
        logger.warning("Could not compute top recommendation for candidate dashboard", exc_info=True)

    return {
        "metrics": {
            "applied_jobs": applied_jobs,
            "for_interview": for_interview,
            "under_review": under_review,
            "rejected": rejected,
            "accepted": accepted,
        },
        "application_progress": {
            "current_step": current_step,
            "steps": steps,
        },
        "upcoming_interview": upcoming_interview,
        "recommended_jobs": recommended_jobs,
        "top_recommendation": top_recommendation,
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
