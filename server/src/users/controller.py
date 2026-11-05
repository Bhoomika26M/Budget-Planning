from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.auth.models import UserResponse
from src.database.core import get_db
from src.entities.user import User
from src.logs.service import log_event
from src.notifications.service import create_notification
from src.users.models import ChangePasswordRequest, ProfileUpdate, UpgradeRequest
from src.users.service import (
    EmailTakenError,
    activity_summary,
    change_password,
    delete_user_data,
    update_profile,
    upgrade_to_premium,
)

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def edit_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        updated = update_profile(db, user, data)
    except EmailTakenError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    log_event(db, f"User {updated.email} updated profile")
    return updated


@router.get("/me/activity")
def read_activity(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return activity_summary(db, user)


@router.post("/me/change-password")
def update_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not change_password(db, user, data.current_password, data.new_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    log_event(db, f"User {user.email} changed password")
    return {"message": "Password updated successfully!"}


@router.post("/me/upgrade", response_model=UserResponse)
def upgrade(
    data: UpgradeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # NOTE: payment is simulated in the UI (no real gateway is called).
    updated = upgrade_to_premium(db, user)
    create_notification(
        db, user.id, "success", "Welcome to Premium! 👑",
        "Budgets, analytics, reports, exports and AI insights are now unlocked.",
        color="#7c3aed",
    )
    log_event(db, f"User {user.email} upgraded to Premium via {data.payment_method}")
    return updated


@router.delete("/me/oauth", response_model=UserResponse)
def unlink_oauth(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Disconnect Google / GitHub sign-in (email + password keeps working)."""
    user.oauth_provider = None
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=204)
def delete_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    email = user.email
    delete_user_data(db, user)
    log_event(db, f"Account deleted: {email}", "warn")
