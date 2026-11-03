from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    type: Literal["suggestion", "bug", "praise"] = "suggestion"
    message: str = Field(min_length=3, max_length=1000)


class FeedbackUpdate(BaseModel):
    status: Literal["open", "resolved"]


class FeedbackResponse(BaseModel):
    id: int
    user_name: str
    user_email: str
    type: str
    message: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IssueCreate(BaseModel):
    issue: str = Field(min_length=3, max_length=1000)
    severity: Literal["low", "medium", "high"] = "medium"


class IssueUpdate(BaseModel):
    status: Literal["open", "in-progress", "resolved"]


class IssueResponse(BaseModel):
    id: int
    user_name: str
    user_email: str
    issue: str
    severity: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
