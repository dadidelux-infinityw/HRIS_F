"""
Pydantic schemas for Notification operations
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    count: int


class NotificationPreferences(BaseModel):
    notify_email: bool
    notify_in_app: bool

    class Config:
        from_attributes = True


class NotificationPreferencesUpdate(BaseModel):
    notify_email: Optional[bool] = None
    notify_in_app: Optional[bool] = None
