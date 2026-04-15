"""
Pydantic schemas for Profile operations
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class ProfileBase(BaseModel):
    bio: Optional[str] = None
    skills: List[str] = []
    resume_skills: List[str] = []
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    """User-editable profile fields. resume_skills is managed internally."""
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class DocumentInfo(BaseModel):
    """Document metadata"""
    id: str
    name: str
    type: str
    size: int
    uploaded_at: str


class ProfileResponse(ProfileBase):
    id: UUID
    user_id: UUID
    documents: List[DocumentInfo] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str
