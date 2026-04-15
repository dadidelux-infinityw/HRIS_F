"""
Pydantic schemas for Resume operations
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class ResumeParsingStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


# Parsed resume data structures
class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None


class WorkExperience(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    responsibilities: List[str] = []


class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Certification(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None


class ParsedResumeData(BaseModel):
    contact: Optional[ContactInfo] = None
    summary: Optional[str] = None
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    skills: List[str] = []
    certifications: List[Certification] = []
    languages: List[str] = []


class ResumeUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    parsing_status: ResumeParsingStatusEnum
    uploaded_at: datetime
    skills_added: List[str] = []
    skills_removed: List[str] = []
    message: str

    class Config:
        from_attributes = True


class ResumeDeleteResponse(BaseModel):
    message: str
    skills_removed: List[str] = []


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    file_size: int
    content_type: str
    parsing_status: ResumeParsingStatusEnum
    parsed_data: Optional[ParsedResumeData] = None
    parsing_error: Optional[str] = None
    uploaded_at: datetime
    parsed_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    parsing_status: ResumeParsingStatusEnum
    uploaded_at: datetime

    class Config:
        from_attributes = True
