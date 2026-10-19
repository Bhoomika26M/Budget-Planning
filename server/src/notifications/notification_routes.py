from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.entities.user import User
from src.notifications.notification_service import (
    dismiss,
    list_notifications,
    mark_read,
    mark_unread,
    unread_count,
)

router = APIRouter(prefix='/notifications', tags=['Notifications'])


@router.get('/')
def fetch_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_notifications(db, user.id)


@router.get('/unread-count')
def fetch_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return {'unread_count': unread_count(db, user.id)}


@router.patch('/{notification_id}/read')
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = mark_read(db, user.id, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail='Notification not found')
    return notification


@router.patch('/{notification_id}/unread')
def unread_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notification = mark_unread(db, user.id, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail='Notification not found')
    return notification


@router.delete('/{notification_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not dismiss(db, user.id, notification_id):
        raise HTTPException(status_code=404, detail='Notification not found')
    return None
