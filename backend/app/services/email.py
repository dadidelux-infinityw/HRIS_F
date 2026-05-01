import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, reset_link: str) -> None:
    subject = "HRIS Password Reset"
    body = (
        "We received a request to reset your HRIS password.\n\n"
        f"Reset your password using this link: {reset_link}\n\n"
        "If you did not request this, you can ignore this message."
    )

    if settings.DEBUG_EMAIL or not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.info("Password reset link for %s: %s", email, reset_link)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    message.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
