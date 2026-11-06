
"""
Budget Pydantic Schemas.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    month: str = Field(
        ...,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Format YYYY-MM"
    )
    category: str = Field(default="Overall", max_length=50)
    amount_limit: float = Field(..., gt=0.0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: float = Field(..., gt=0.0)


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    id: int
    month: str
    category: str
    amount_limit: float
    total_spent: float
    remaining_amount: float
    usage_percentage: float
    is_exceeded: bool
    is_warning: bool  # >= 80%
