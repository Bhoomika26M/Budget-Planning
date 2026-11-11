"""
Authentication Router.

Handles user registration, login, password reset, and identity verification.
Provides JWT tokens and creates initial profile records upon account creation.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserLogin, PasswordReset, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def build_user_response(user: User) -> UserResponse:
    """Helper to assemble a UserResponse with profile full_name."""
    full_name = user.profile.full_name if user.profile else None
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_setup_completed=user.is_setup_completed,
        full_name=full_name,
        created_at=user.created_at,
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user account with selected role (student, premium, admin).
    Creates an associated UserProfile and welcome notification.
    """
    clean_email = user_in.email.lower().strip()

    # Prevent duplicate email registrations
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Securely hash the password (never stored as plain text)
    hashed_pw = get_password_hash(user_in.password)

    new_user = User(
        email=clean_email,
        hashed_password=hashed_pw,
        role=user_in.role,
        is_active=True,
        is_setup_completed=False,
    )
    db.add(new_user)
    db.flush()  # Obtain new_user.id

    # Create associated default UserProfile
    new_profile = UserProfile(
        user_id=new_user.id,
        full_name=user_in.full_name.strip(),
        currency="INR",
        monthly_income=0.0,
        financial_preference="Save and Invest",
        goal_focus="Emergency Fund",
    )
    db.add(new_profile)

    # Add welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to BudgetBuddy!",
        message="Your account has been created. Please complete your first-time setup to personalize your financial experience.",
        type="info",
    )
    db.add(welcome_notif)

    db.commit()
    db.refresh(new_user)

    # Issue JWT token
    token = create_access_token(subject=new_user.id, role=new_user.role)

    return Token(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        is_setup_completed=new_user.is_setup_completed,
        user=build_user_response(new_user),
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and issues a signed JWT access token.
    Validates email existence and password hash match.
    """
    clean_email = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support or an administrator.",
        )

    token = create_access_token(subject=user.id, role=user.role)

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        is_setup_completed=user.is_setup_completed,
        user=build_user_response(user),
    )


@router.post("/forgot-password")
def forgot_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """
    Allows a user to reset their password securely.
    """
    clean_email = reset_data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found associated with this email address.",
        )

    user.hashed_password = get_password_hash(reset_data.new_password)

    # Add notification for password update
    notif = Notification(
        user_id=user.id,
        title="Password Updated",
        message="Your account password was successfully updated.",
        type="info",
    )
    db.add(notif)
    db.commit()

    return {"message": "Password updated successfully. You can now log in with your new password."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns identity and status details for the currently authenticated session.
    """
    return build_user_response(current_user)
