
import os
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.auth.security import (
    create_access_token,
    get_current_user,
    get_db,
    hash_password,
    require_admin,
    verify_password,
)
from src.entities.user import User
from src.entities.premium_request import PremiumRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

UserRole = Literal["student", "premium", "admin"]


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    phone: str | None = None
    location: str | None = None
    university: str | None = None
    major: str | None = None
    role: UserRole
    is_premium: bool
    created_at: datetime


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=40)
    location: str | None = Field(default=None, max_length=160)
    university: str | None = Field(default=None, max_length=160)
    major: str | None = Field(default=None, max_length=160)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value

    @field_validator("phone", "location", "university", "major")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class RoleUpdate(BaseModel):
    role: UserRole


class PremiumReview(BaseModel):
    status: Literal["approved", "rejected"]


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "location": user.location,
        "university": user.university,
        "major": user.major,
        "role": user.role,
        "created_at": user.created_at,
        "is_premium": user.is_premium,
    }


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = str(payload.email).strip().lower()

    if db.query(User).filter(
        func.lower(User.email) == normalized_email
    ).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        email=normalized_email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role="student",
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        ) from None

    db.refresh(user)
    return _user_response(user)


@router.post("/token", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form.username.strip().lower()
    user = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if (
        user is None
        or user.password_hash is None
        or not verify_password(form.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return _user_response(user)


# --------------------------------------------------
# PREMIUM REQUESTS - USER
# --------------------------------------------------

@router.post("/premium-request")
def request_premium(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.is_premium:
        raise HTTPException(
            status_code=400,
            detail="Your account is already Premium.",
        )

    existing = (
        db.query(PremiumRequest)
        .filter(
            PremiumRequest.user_id == user.id,
            PremiumRequest.status == "pending",
        )
        .first()
    )

    if existing:
        return {
            "message": "Your Premium request is already pending.",
            "status": "pending",
        }

    premium_request = PremiumRequest(user_id=user.id)

    db.add(premium_request)
    db.commit()
    db.refresh(premium_request)

    return {
        "message": "Premium request submitted successfully.",
        "status": premium_request.status,
    }


@router.get("/premium-request/status")
def get_premium_request_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    latest_request = (
        db.query(PremiumRequest)
        .filter(PremiumRequest.user_id == user.id)
        .order_by(
            PremiumRequest.requested_at.desc(),
            PremiumRequest.id.desc(),
        )
        .first()
    )

    return {
        "is_premium": user.is_premium,
        "status": latest_request.status if latest_request else None,
    }


# --------------------------------------------------
# PREMIUM REQUESTS - ADMIN
# --------------------------------------------------

@router.get("/premium-requests")
def list_premium_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    requests = (
        db.query(PremiumRequest, User)
        .join(User, PremiumRequest.user_id == User.id)
        .order_by(
            PremiumRequest.requested_at.desc(),
            PremiumRequest.id.desc(),
        )
        .all()
    )

    return [
        {
            "id": request.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "status": request.status,
            "requested_at": request.requested_at,
            "reviewed_at": request.reviewed_at,
        }
        for request, user in requests
    ]


@router.patch("/premium-requests/{request_id}")
def review_premium_request(
    request_id: int,
    payload: PremiumReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    premium_request = db.get(PremiumRequest, request_id)

    if premium_request is None:
        raise HTTPException(
            status_code=404,
            detail="Premium request not found.",
        )

    if premium_request.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This request has already been reviewed.",
        )

    user = db.get(User, premium_request.user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    premium_request.status = payload.status
    premium_request.reviewed_at = datetime.now()
    premium_request.reviewed_by = admin.id

    if payload.status == "approved":
        user.is_premium = True

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(premium_request)
    db.refresh(user)

    return {
        "message": f"Premium request {payload.status}.",
        "status": premium_request.status,
        "is_premium": user.is_premium,
    }


# --------------------------------------------------
# PROFILE
# --------------------------------------------------

@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.name = payload.name
    user.phone = payload.phone
    user.location = payload.location
    user.university = payload.university
    user.major = payload.major

    db.commit()
    db.refresh(user)

    return _user_response(user)


# --------------------------------------------------
# CHANGE PASSWORD
# --------------------------------------------------

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(
        payload.current_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    if verify_password(
        payload.new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different",
        )

    user.password_hash = hash_password(payload.new_password)

    db.commit()

    return {
        "message": "Password changed successfully"
    }


# --------------------------------------------------
# ADMIN USER MANAGEMENT
# --------------------------------------------------

@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc(), User.id.desc())
        .all()
    )

    return [_user_response(user) for user in users]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own administrator role",
        )

    if user.role == "admin" and payload.role != "admin":
        admin_count = db.query(User).filter(
            User.role == "admin"
        ).count()

        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the last administrator",
            )

    user.role = payload.role

    db.commit()
    db.refresh(user)

    return _user_response(user)


# --------------------------------------------------
# INITIAL ADMIN CREATION
# --------------------------------------------------

def bootstrap_initial_admin(db: Session) -> None:
    email = os.getenv("INITIAL_ADMIN_EMAIL")
    password = os.getenv("INITIAL_ADMIN_PASSWORD")

    if not email and not password:
        return

    if not email or not password:
        raise RuntimeError(
            "Set both INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD"
        )

    if len(password) < 12:
        raise RuntimeError(
            "INITIAL_ADMIN_PASSWORD must be at least 12 characters"
        )

    normalized_email = email.strip().lower()

    user = db.query(User).filter(
        func.lower(User.email) == normalized_email
    ).first()

    if user is None:
        user = User(
            email=normalized_email,
            name="Administrator",
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(user)
    else:
        user.role = "admin"

        if user.password_hash is None:
            user.password_hash = hash_password(password)

    db.commit()
