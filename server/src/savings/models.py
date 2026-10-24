
from datetime import date as DateType
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target: float = Field(gt=0)
    saved: float = Field(default=0, ge=0)
    deadline: Optional[DateType] = None
    color: Optional[str] = Field(default="#4169e1", max_length=30)
    note: Optional[str] = Field(default=None, max_length=500)


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    target: Optional[float] = Field(default=None, gt=0)
    saved: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[DateType] = None
    color: Optional[str] = Field(default=None, max_length=30)
    note: Optional[str] = Field(default=None, max_length=500)


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target: float
    saved: float
    deadline: Optional[DateType]
    color: Optional[str]
    note: Optional[str]

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

    model_config = ConfigDict(from_attributes=True)
