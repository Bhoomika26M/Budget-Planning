
"""
Savings Pydantic Schemas.
"""

from datetime import date as Date, datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class SavingsContributionBase(BaseModel):
    amount: float = Field(..., gt=0.0)
    date: Date = Field(default_factory=Date.today)
    notes: Optional[str] = None


class SavingsContributionCreate(SavingsContributionBase):
    pass


class SavingsContributionResponse(SavingsContributionBase):
    id: int
    goal_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsGoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0.0)
    target_date: Optional[Date] = None
    category: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    initial_deposit: Optional[float] = Field(default=0.0, ge=0.0)


class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    target_amount: Optional[float] = Field(None, gt=0.0)
    target_date: Optional[Date] = None
    category: Optional[str] = None
    status: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    saved_amount: float
    remaining_amount: float
    completion_percentage: float
    status: str
    created_at: datetime
    contributions: List[SavingsContributionResponse] = []

    class Config:
        from_attributes = True

