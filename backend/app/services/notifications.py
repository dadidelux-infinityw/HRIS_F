"""
Notification service - creates in-app notifications.

notify() only adds the notification to the session. The caller's existing
db.commit() persists it, so the notification is atomic with the event.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        is_read=False,
    )
    db.add(notification)
    return notification
