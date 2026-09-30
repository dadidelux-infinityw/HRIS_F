import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _email_disabled() -> bool:
    return settings.DEBUG_EMAIL or not settings.SMTP_HOST or not settings.SMTP_FROM


def _send(to: str, subject: str, body: str, debug_log: Optional[str] = None) -> None:
    """Send a plain-text email via SMTP + STARTTLS.

    When DEBUG_EMAIL is on or SMTP is not configured, nothing is sent and a
    log line is written instead (debug_log if given, otherwise a generic one).
    """
    if _email_disabled():
        if debug_log is not None:
            logger.info(debug_log)
        else:
            logger.info("Email not sent (debug mode) to %s: %s", to, subject)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)


def send_password_reset_email(email: str, reset_link: str) -> None:
    subject = "HRIS Password Reset"
    body = (
        "We received a request to reset your HRIS password.\n\n"
        f"Reset your password using this link: {reset_link}\n\n"
        "If you did not request this, you can ignore this message."
    )
    _send(email, subject, body, debug_log=f"Password reset link for {email}: {reset_link}")


def send_notification_email(to: str, subject: str, body: str) -> None:
    """Send a notification email. Never raises: failures are logged only,
    so it is safe to run as a background task after the request commits."""
    try:
        _send(to, subject, body)
    except Exception:
        logger.exception("Failed to send notification email to %s", to)
