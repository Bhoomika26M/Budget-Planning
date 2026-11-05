from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["student", "premium", "admin"]
Plan = Literal["free", "premium", "enterprise"]


class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    plan: str
    plan_since: Optional[date] = None
    plan_renewal: Optional[date] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    status: Optional[Literal["active", "suspended"]] = None
    plan: Optional[Plan] = None


class CategoryName(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=1000)
    audience: Literal["all", "student", "premium"] = "all"


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    audience: str
    recipients: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LogResponse(BaseModel):
    id: int
    level: str
    message: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
