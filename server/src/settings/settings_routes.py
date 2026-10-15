
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.core import SessionLocal
from .settings_model import UserSettings

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SettingsUpdate(BaseModel):
    email_notifications: bool
    push_notifications: bool
    budget_alerts: bool
    bill_reminders: bool
    weekly_report: bool
    monthly_report: bool
    dark_mode: bool
    currency: str
    language: str


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()

    if settings is None:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/")
def update_settings(
    updates: SettingsUpdate,
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).first()

    if settings is None:
        settings = UserSettings()
        db.add(settings)

    for field, value in updates.model_dump().items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    return {
        "message": "Settings saved successfully",
        "settings": settings
    }
