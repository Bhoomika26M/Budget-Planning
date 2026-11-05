from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    university: Optional[str] = Field(default=None, max_length=150)
    major: Optional[str] = Field(default=None, max_length=150)
    monthly_income: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, max_length=10)
    pref_email: Optional[bool] = None
    pref_reports: Optional[bool] = None
    pref_alerts: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


class UpgradeRequest(BaseModel):
    plan: Literal["premium"] = "premium"
    # upi | card | netbanking | wallet  (payments are simulated in this project)
    payment_method: str = Field(default="upi", max_length=20)
