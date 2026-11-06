"""
User Profile Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class UserProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    avatar_url: Optional[str] = None
    monthly_income: float = Field(default=0.0, ge=0.0)
    currency: Literal["INR", "USD", "EUR", "GBP"] = "INR"
    financial_preference: Literal[
        "Save and Invest", "Control Spending", "Manage Debt", "Build Emergency Fund"
    ] = "Save and Invest"
    goal_focus: str = Field(default="Emergency Fund", max_length=100)


class UserProfileSetup(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    avatar_url: Optional[str] = None
    monthly_income: Optional[float] = Field(None, ge=0.0)
    currency: Optional[Literal["INR", "USD", "EUR", "GBP"]] = None
    financial_preference: Optional[Literal[
        "Save and Invest", "Control Spending", "Manage Debt", "Build Emergency Fund"
    ]] = None
    goal_focus: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    email: Optional[str] = None
    role: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

