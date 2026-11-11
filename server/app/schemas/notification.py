"""
Notification Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    title: str = Field(..., max_length=150)
    message: str
    type: Literal["budget_alert", "expense_alert", "goal_update", "system", "info"] = "info"


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
