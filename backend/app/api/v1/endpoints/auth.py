import logging
from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import PasswordResetToken, User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    Token,
)
from app.schemas.user import UserResponse
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    get_password_hash,
    hash_token,
    verify_password,
    verify_password_reset_token,
)
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.services.email import send_password_reset_email

logger = logging.getLogger(__name__)
router = APIRouter()


# --- OAuth (Google / LinkedIn) -------------------------------------------------
# Lazily initialise the Authlib OAuth registry so the import does not fail when
# credentials are absent in dev environments.
_oauth_registry = None


def _get_oauth():
    global _oauth_registry
    if _oauth_registry is None:
        try:
            from authlib.integrations.starlette_client import OAuth
        except Exception as exc:  # pragma: no cover - import-time failure
            logger.warning("Authlib not available: %s", exc)
            return None

        oauth = OAuth()
        if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
            oauth.register(
                name="google",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                client_kwargs={"scope": "openid email profile"},
            )
        if settings.LINKEDIN_CLIENT_ID and settings.LINKEDIN_CLIENT_SECRET:
            oauth.register(
                name="linkedin",
                client_id=settings.LINKEDIN_CLIENT_ID,
                client_secret=settings.LINKEDIN_CLIENT_SECRET,
                authorize_url="https://www.linkedin.com/oauth/v2/authorization",
                access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
                userinfo_endpoint="https://api.linkedin.com/v2/userinfo",
                client_kwargs={"scope": "openid profile email"},
            )
        _oauth_registry = oauth
    return _oauth_registry


def _issue_jwt_for_user(user: User) -> str:
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(data={"sub": user.email}, expires_delta=expires)


def _frontend_redirect(token: str | None, error: str | None = None) -> RedirectResponse:
    if error:
        params = urlencode({"error": error})
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?{params}")
    params = urlencode({"token": token})
    return RedirectResponse(f"{settings.FRONTEND_URL}/oauth/callback?{params}")


def _find_or_create_oauth_user(
    db: Session,
    *,
    provider: str,
    subject: str,
    email: str | None,
    full_name: str | None,
) -> User:
    if not subject and not email:
        raise HTTPException(status_code=400, detail="OAuth provider returned no identity")

    user: User | None = None
    if subject:
        user = (
            db.query(User)
            .filter(User.oauth_provider == provider, User.oauth_subject == subject)
            .first()
        )
    if user is None and email:
        user = db.query(User).filter(User.email == email).first()

    if user is None:
        if not email:
            raise HTTPException(status_code=400, detail="OAuth provider did not return an email")
        user = User(
            email=email,
            hashed_password=None,
            full_name=full_name or email.split("@")[0],
            role=UserRole.CANDIDATE,
            oauth_provider=provider,
            oauth_subject=subject,
        )
        db.add(user)
    else:
        # Link existing account to provider on first login
        if not user.oauth_provider:
            user.oauth_provider = provider
        if not user.oauth_subject and subject:
            user.oauth_subject = subject

    db.commit()
    db.refresh(user)
    return user


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    oauth = _get_oauth()
    if oauth is None or not hasattr(oauth, "google"):
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    oauth = _get_oauth()
    if oauth is None or not hasattr(oauth, "google"):
        return _frontend_redirect(None, error="oauth_not_configured")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        logger.warning("Google OAuth exchange failed: %s", exc)
        return _frontend_redirect(None, error="oauth_failed")

    userinfo = token.get("userinfo")
    if not userinfo:
        try:
            resp = await oauth.google.get(
                "https://openidconnect.googleapis.com/v1/userinfo", token=token
            )
            userinfo = resp.json()
        except Exception as exc:
            logger.warning("Google userinfo fetch failed: %s", exc)
            return _frontend_redirect(None, error="oauth_failed")

    subject = str(userinfo.get("sub") or "")
    email = userinfo.get("email")
    full_name = userinfo.get("name") or userinfo.get("given_name")

    try:
        user = _find_or_create_oauth_user(
            db, provider="google", subject=subject, email=email, full_name=full_name
        )
    except HTTPException:
        return _frontend_redirect(None, error="oauth_failed")

    return _frontend_redirect(_issue_jwt_for_user(user))


@router.get("/linkedin/login")
async def linkedin_login(request: Request):
    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="LinkedIn OAuth not configured")
    oauth = _get_oauth()
    if oauth is None or not hasattr(oauth, "linkedin"):
        raise HTTPException(status_code=503, detail="LinkedIn OAuth not configured")
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/auth/linkedin/callback"
    return await oauth.linkedin.authorize_redirect(request, redirect_uri)


@router.get("/linkedin/callback")
async def linkedin_callback(request: Request, db: Session = Depends(get_db)):
    oauth = _get_oauth()
    if oauth is None or not hasattr(oauth, "linkedin"):
        return _frontend_redirect(None, error="oauth_not_configured")
    try:
        token = await oauth.linkedin.authorize_access_token(request)
    except Exception as exc:
        logger.warning("LinkedIn OAuth exchange failed: %s", exc)
        return _frontend_redirect(None, error="oauth_failed")

    userinfo = token.get("userinfo")
    if not userinfo:
        try:
            resp = await oauth.linkedin.get(
                "https://api.linkedin.com/v2/userinfo", token=token
            )
            userinfo = resp.json()
        except Exception as exc:
            logger.warning("LinkedIn userinfo fetch failed: %s", exc)
            return _frontend_redirect(None, error="oauth_failed")

    subject = str(userinfo.get("sub") or "")
    email = userinfo.get("email")
    full_name = (
        userinfo.get("name")
        or " ".join(filter(None, [userinfo.get("given_name"), userinfo.get("family_name")]))
        or None
    )

    try:
        user = _find_or_create_oauth_user(
            db, provider="linkedin", subject=subject, email=email, full_name=full_name
        )
    except HTTPException:
        return _frontend_redirect(None, error="oauth_failed")

    return _frontend_redirect(_issue_jwt_for_user(user))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role="candidate"  # Default role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_active != "true":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token login (for Swagger UI)"""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
def logout():
    """Logout (client should discard token)"""
    return {"message": "Successfully logged out"}


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset link."""
    generic_message = {"message": "If the email exists, a reset link has been sent."}
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return generic_message

    reset_token, token_hash = create_password_reset_token(
        str(user.id),
        timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    )
    expires_at = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    )
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    send_password_reset_email(user.email, reset_link)
    return generic_message


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset a password using a valid one-time token."""
    token_payload = verify_password_reset_token(payload.token)
    if not token_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == hash_token(payload.token)
    ).first()

    if not token_record or token_record.used_at is not None or token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(payload.new_password)
    token_record.used_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successful."}
