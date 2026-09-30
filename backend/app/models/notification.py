"""
Notification Model - In-app notifications for users
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.database import Base


class NotificationType:
    APPLICATION_SUBMITTED = "application_submitted"
    STATUS_CHANGED = "status_changed"
    STAGE_CHANGED = "stage_changed"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_UPDATED = "interview_updated"
    INTERVIEW_CANCELLED = "interview_cancelled"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    link = Column(String(255), nullable=True)  # Frontend route, e.g. /my-applications
    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
