
from datetime import date as DateType
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target: float = Field(gt=0)
    saved: float = Field(default=0, ge=0)
    deadline: Optional[DateType] = None
    color: Optional[str] = Field(default="#2E93C7", max_length=30)
    note: Optional[str] = Field(default=None, max_length=500)
    emoji: Optional[str] = Field(default="🎯", max_length=16)


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    target: Optional[float] = Field(default=None, gt=0)
    saved: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[DateType] = None
    color: Optional[str] = Field(default=None, max_length=30)
    note: Optional[str] = Field(default=None, max_length=500)
    emoji: Optional[str] = Field(default=None, max_length=16)
    completed: Optional[bool] = None


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target: float
    saved: float
    deadline: Optional[DateType]
    color: Optional[str]
    note: Optional[str]
    emoji: Optional[str] = "🎯"
    completed: bool = False

    model_config = ConfigDict(from_attributes=True)


class ContributionCreate(BaseModel):
    amount: float = Field(gt=0)
    date: DateType = Field(default_factory=DateType.today)
    note: Optional[str] = Field(default=None, max_length=255)


class ContributionResponse(BaseModel):
    id: int
    user_id: int
    goal_id: int
    amount: float
    date: DateType
    note: Optional[str]
    created_at: Optional[datetime] = None
    goal_name: Optional[str] = None
    goal_emoji: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
