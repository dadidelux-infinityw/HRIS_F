"""
User Profile Model - Extended user information
"""
from sqlalchemy import Column, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # Profile information
    bio = Column(Text, nullable=True)
    skills = Column(JSON, default=list, nullable=False)  # List of skills
    resume_skills = Column(JSON, default=list, nullable=False)  # Skills sourced from resume (provenance tracking)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    # Document storage (file metadata)
    documents = Column(JSON, default=list, nullable=False)  # List of document objects

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="profile")
