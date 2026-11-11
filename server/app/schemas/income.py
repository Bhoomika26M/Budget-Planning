
"""
Income Pydantic Schemas.
"""

from datetime import date as Date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


IncomeSourceType = Literal[
    "Salary",
    "Pocket Money",
    "Scholarship",
    "Freelancing",
    "Business",
    "Other Income"
]


class IncomeBase(BaseModel):
    source: IncomeSourceType
    amount: float = Field(..., gt=0.0)
    date: Date = Field(default_factory=Date.today)
    description: Optional[str] = None


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    source: Optional[IncomeSourceType] = None
    amount: Optional[float] = Field(None, gt=0.0)
    date: Optional[Date] = None
    description: Optional[str] = None


class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IncomeSummary(BaseModel):
    total_amount: float
    monthly_amount: float
    source_totals: dict
    count: int
