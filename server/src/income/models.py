from datetime import date as DateType
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Frequency = Literal["Monthly", "Weekly", "One-time"]


class IncomeCreate(BaseModel):
    # `category` is the income source shown in the UI:
    # Pocket Money | Scholarship | Freelance | Part-time Job | Other
    category: str = Field(min_length=1, max_length=100)
    title: Optional[str] = Field(default=None, max_length=150)
    amount: float = Field(gt=0)
    date: DateType
    frequency: Frequency = "Monthly"
    description: Optional[str] = Field(default=None, max_length=255)


class IncomeUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    date: Optional[DateType] = None
    frequency: Optional[Frequency] = None
    description: Optional[str] = Field(default=None, max_length=255)


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    amount: float
    date: DateType
    frequency: str = "Monthly"
    description: Optional[str]

    model_config = ConfigDict(from_attributes=True)
