from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.entities.user import User
from src.settings.settings_model import UserSettings

router = APIRouter(prefix='/settings', tags=['Settings'])


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    email_notifications: bool
    push_notifications: bool
    budget_alerts: bool
    bill_reminders: bool
    weekly_report: bool
    monthly_report: bool
    dark_mode: bool
    currency: str = Field(min_length=3, max_length=3)
    language: str = Field(min_length=1, max_length=30)


def _get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get('/')
def get_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _get_or_create_settings(db, user.id)


@router.put('/')
def update_settings(
    updates: SettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, user.id)
    for field, value in updates.model_dump().items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return {'message': 'Settings saved successfully', 'settings': settings}
