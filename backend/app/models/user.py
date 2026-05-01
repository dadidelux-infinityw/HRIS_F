from sqlalchemy import Column, String, DateTime, Enum, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HR = "hr"
    CANDIDATE = "candidate"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE, nullable=False)
    profile_picture = Column(String(500), nullable=True)
    avatar_data = Column(LargeBinary, nullable=True)
    avatar_content_type = Column(String(50), nullable=True)
    is_active = Column(String(10), default="true", nullable=False)
    oauth_provider = Column(String(50), nullable=True)
    oauth_subject = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    resume = relationship("Resume", back_populates="user", uselist=False)
    applications = relationship("Application", back_populates="user")
    job_postings_created = relationship("JobPosting", foreign_keys="[JobPosting.created_by]", overlaps="creator")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
