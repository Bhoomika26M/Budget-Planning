"""
User Profile & Onboarding Router.

Handles retrieving user profile information, updating preferences,
and completing first-time onboarding setup.
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
from app.schemas.profile import (
    UserProfileResponse,
    UserProfileSetup,
    UserProfileUpdate,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


def format_profile_response(profile: UserProfile, user: User) -> UserProfileResponse:
    """Helper to assemble a UserProfileResponse including email and role."""
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email,
        role=user.role,
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
        monthly_income=profile.monthly_income,
        currency=profile.currency,
        financial_preference=profile.financial_preference,
        goal_focus=profile.goal_focus,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=UserProfileResponse)
@router.get("/", response_model=UserProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the logged-in user's profile details.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Fallback creation if profile record did not exist
        profile = UserProfile(
            user_id=current_user.id,
            full_name=current_user.email.split("@")[0].capitalize(),
            currency="INR",
            monthly_income=0.0,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return format_profile_response(profile, current_user)


@router.put("/setup", response_model=UserProfileResponse)
def complete_first_time_setup(
    setup_data: UserProfileSetup,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Completes the first-time onboarding wizard:
    Saves income, preferred currency, financial preferences, and profile details.
    Marks user's is_setup_completed flag as True.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id, full_name=setup_data.full_name)
        db.add(profile)

    profile.full_name = setup_data.full_name.strip()
    profile.avatar_url = setup_data.avatar_url
    profile.monthly_income = setup_data.monthly_income
    profile.currency = setup_data.currency
    profile.financial_preference = setup_data.financial_preference
    profile.goal_focus = setup_data.goal_focus

    # Mark first-time setup as completed on the User model
    current_user.is_setup_completed = True

    # Add confirmation notification
    setup_notif = Notification(
        user_id=current_user.id,
        title="Setup Completed!",
        message=f"Welcome to BudgetBuddy! Your financial preference is set to '{setup_data.financial_preference}' with currency {setup_data.currency}.",
        type="info",
    )
    db.add(setup_notif)

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return format_profile_response(profile, current_user)


@router.put("", response_model=UserProfileResponse)
@router.put("/", response_model=UserProfileResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the user profile details anytime from settings or profile page.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    if profile_data.full_name is not None:
        profile.full_name = profile_data.full_name.strip()
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.monthly_income is not None:
        profile.monthly_income = profile_data.monthly_income
    if profile_data.currency is not None:
        profile.currency = profile_data.currency
    if profile_data.financial_preference is not None:
        profile.financial_preference = profile_data.financial_preference
    if profile_data.goal_focus is not None:
        profile.goal_focus = profile_data.goal_focus

    db.commit()
    db.refresh(profile)

    return format_profile_response(profile, current_user)
