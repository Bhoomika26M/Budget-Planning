from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.database.core import get_db
from src.entities.user import User
from src.notifications.models import NotificationResponse
from src.notifications.service import (
    find_notification,
    generate_alerts,
    list_notifications,
    mark_all_read,
    unread_count,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    generate_alerts(db, user)
    return list_notifications(db, user.id)


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return {"unread": unread_count(db, user.id)}


@router.post("/read-all", status_code=204)
def read_all(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    mark_all_read(db, user.id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_one(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = find_notification(db, user.id, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=204)
def delete_one(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = find_notification(db, user.id, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
