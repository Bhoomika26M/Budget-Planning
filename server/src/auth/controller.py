import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.auth.models import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyOtpRequest,
)
from src.auth.service import (
    ALGORITHM,
    SECRET_KEY,
    authenticate_user,
    create_access_token,
    create_reset_otp,
    find_user_by_email,
    hash_password,
    mark_login,
    otp_is_valid,
    register_user,
    reset_password,
)
from src.database.core import get_db
from src.entities.user import User
from src.logs.service import log_event
from src.notifications.email import send_email
from src.rate_limiter import client_key, login_limiter, otp_limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user = register_user(
        db=db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    log_event(db, f"New account created: {user.email}")
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    login_limiter.hit(client_key(request, payload.email))

    user = authenticate_user(
        db=db,
        email=payload.email,
        password=payload.password,
    )

    if user is None:
        log_event(db, f"Failed login attempt for {payload.email.lower()}", "warn")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == "suspended":
        log_event(db, f"Suspended user {user.email} tried to log in", "warn")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    mark_login(db, user)
    log_event(db, f"User {user.email} logged in")

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


# ── Forgot password ────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    otp_limiter.hit(client_key(request, "otp:" + payload.email))
    user = find_user_by_email(db, payload.email)

    if user is None:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp = create_reset_otp(db, user)
    sent = send_email(
        to=user.email,
        subject="Your BudgetBuddy password reset code",
        body=f"Hi {user.name},\n\nYour BudgetBuddy verification code is {otp}. "
             f"It expires in 10 minutes.\n\nIf you did not request this, ignore this email.",
    )
    log_event(db, f"Password reset requested for {user.email}")

    response = {"message": "A 6-digit verification code has been sent to your email."}
    if not sent:
        # No email provider configured (local development) – return the code
        # so the "Demo OTP" hint in the UI can show it.
        response["dev_otp"] = otp
    return response


@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = find_user_by_email(db, payload.email)
    if not otp_is_valid(user, payload.otp):
        raise HTTPException(status_code=400, detail="Incorrect or expired OTP. Please try again.")
    return {"valid": True}


@router.post("/reset-password")
def reset_password_endpoint(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = find_user_by_email(db, payload.email)
    if not otp_is_valid(user, payload.otp):
        raise HTTPException(status_code=400, detail="Incorrect or expired OTP. Please try again.")

    reset_password(db, user, payload.new_password)
    log_event(db, f"Password reset completed for {user.email}")
    return {"message": "Password updated. You can now sign in."}


# ── OAuth2 (Google / GitHub) ───────────────────────────────────────

OAUTH_PROVIDERS = {
    "google": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "openid email profile",
    },
    "github": {
        "client_id": os.getenv("GITHUB_CLIENT_ID"),
        "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "scope": "read:user user:email",
    },
}


def _provider_config(provider: str):
    config = OAUTH_PROVIDERS.get(provider)
    if config is None:
        raise HTTPException(status_code=404, detail="Unknown OAuth provider.")
    if not config["client_id"] or not config["client_secret"]:
        raise HTTPException(
            status_code=501,
            detail=f"{provider.capitalize()} sign-in is not configured on the server. "
                   f"Set {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET.",
        )
    return config


def _redirect_uri(provider: str) -> str:
    return f"{BACKEND_URL}/api/auth/oauth/{provider}/callback"


@router.get("/oauth/providers")
def oauth_providers():
    return {
        name: bool(cfg["client_id"] and cfg["client_secret"])
        for name, cfg in OAUTH_PROVIDERS.items()
    }


@router.get("/oauth/{provider}/login")
def oauth_login(provider: str):
    config = _provider_config(provider)
    state = jwt.encode(
        {
            "provider": provider,
            "nonce": secrets.token_urlsafe(8),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    params = {
        "client_id": config["client_id"],
        "redirect_uri": _redirect_uri(provider),
        "scope": config["scope"],
        "state": state,
        "response_type": "code",
    }
    if provider == "google":
        params["prompt"] = "select_account"
    return RedirectResponse(f"{config['authorize_url']}?{urlencode(params)}")


def _fetch_oauth_identity(provider: str, config: dict, code: str):
    with httpx.Client(timeout=10) as client:
        token_res = client.post(
            config["token_url"],
            data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        token_res.raise_for_status()
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise ValueError("No access token returned by provider")

        auth = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

        if provider == "google":
            info = client.get("https://openidconnect.googleapis.com/v1/userinfo", headers=auth).json()
            return info.get("email"), info.get("name") or info.get("email", "").split("@")[0]

        info = client.get("https://api.github.com/user", headers=auth).json()
        email = info.get("email")
        if not email:
            emails = client.get("https://api.github.com/user/emails", headers=auth).json()
            primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
            email = primary.get("email") if primary else None
        return email, info.get("name") or info.get("login")


@router.get("/oauth/{provider}/callback")
def oauth_callback(provider: str, code: str = "", state: str = "", db: Session = Depends(get_db)):
    config = _provider_config(provider)

    try:
        decoded = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("provider") != provider:
            raise JWTError("provider mismatch")
        email, name = _fetch_oauth_identity(provider, config, code)
        if not email:
            raise ValueError("Provider did not share an email address")
    except Exception as exc:  # noqa: BLE001 - show a friendly error on the login page
        log_event(db, f"OAuth {provider} login failed: {exc}", "warn")
        return RedirectResponse(f"{FRONTEND_URL}/login?oauth_error={provider}")

    user = find_user_by_email(db, email)
    if user is None:
        user = User(
            name=(name or email.split("@")[0])[:100],
            email=email.lower(),
            hashed_password=hash_password(secrets.token_urlsafe(24)),
            role="student",
            plan="free",
            oauth_provider=provider,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        log_event(db, f"New account created via {provider}: {user.email}")
    elif not user.oauth_provider:
        user.oauth_provider = provider
        db.commit()

    if user.status == "suspended":
        return RedirectResponse(f"{FRONTEND_URL}/login?oauth_error=suspended")

    mark_login(db, user)
    log_event(db, f"User {user.email} logged in with {provider}")
    token = create_access_token(user.id)
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback#token={token}")
