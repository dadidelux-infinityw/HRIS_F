"""
Notification service - creates in-app notifications and queues emails.

notify() only adds the notification to the session. The caller's existing
db.commit() persists it, so the notification is atomic with the event.

Emails are never sent inline. When email=True and a BackgroundTasks object
is passed, the email is queued and FastAPI runs it after the response is
sent, i.e. after the endpoint has committed. If the endpoint raises before
returning, background tasks do not run, so no email goes out for a
rolled-back change. To protect the SMTP quota, only candidates are emailed
and callers should pass email=True for high-value events only.
"""
import logging
from typing import Optional
from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.services.email import send_notification_email

logger = logging.getLogger(__name__)


def _build_email(title: str, link: Optional[str]) -> tuple[str, str]:
    """Short, non-sensitive email: a summary line plus a link to the app."""
    url = f"{settings.FRONTEND_URL.rstrip('/')}{link or '/dashboard'}"
    subject = f"HRIS: {title}"
    body = (
        f"There is an update on your HRIS account: {title}.\n\n"
        f"Sign in to view the details: {url}\n\n"
        "You can turn off email notifications in Settings."
    )
    return subject, body


def notify(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    email: bool = False,
    background_tasks: Optional[BackgroundTasks] = None,
) -> Optional[Notification]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    notification = None
    if user.notify_in_app:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            link=link,
            is_read=False,
        )
        db.add(notification)

    if (
        email
        and background_tasks is not None
        and user.notify_email
        and user.role == UserRole.CANDIDATE
        and user.email
    ):
        try:
            subject, body = _build_email(title, link)
            background_tasks.add_task(send_notification_email, user.email, subject, body)
        except Exception:
            logger.exception("Failed to queue notification email for user %s", user_id)

    return notification
