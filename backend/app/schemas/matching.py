"""
Pydantic schemas for candidate-job matching endpoints
"""
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime


class CandidateMatchScore(BaseModel):
    total_score: float      # 0-100 percentage
    semantic_score: float   # 0-1
    keyword_score: float    # 0-1


class RankedCandidate(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    skills: List[str]
    has_resume: bool
    scores: CandidateMatchScore
    # Populated when the candidate has a non-withdrawn application for this job
    application_id: Optional[UUID] = None
    application_status: Optional[str] = None
    recruitment_stage: Optional[str] = None
    applied_date: Optional[date] = None


class MatchingScopeCounts(BaseModel):
    all: int
    applied: int
    shortlisted: int


class JobMatchingResponse(BaseModel):
    job_id: UUID
    job_title: str
    requirements: List[str]
    total_candidates: int
    ranked_candidates: List[RankedCandidate]
    counts: MatchingScopeCounts
    computed_at: datetime


class PrecomputeResponse(BaseModel):
    job_id: UUID
    candidates_processed: int
    embeddings_cached: int
    message: str


class CacheDeleteResponse(BaseModel):
    job_id: UUID
    entries_deleted: int
    message: str
