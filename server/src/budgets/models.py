from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    budget: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    icon: str = Field(..., min_length=1, max_length=8)
    color: str = Field(..., min_length=4, max_length=7)
    month: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
    )


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    budget: Optional[Decimal] = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    spent: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    icon: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=8,
    )
    color: Optional[str] = Field(
        default=None,
        min_length=4,
        max_length=7,
    )
    month: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
    )


class BudgetResponse(BaseModel):
    id: int
    name: str
    budget: Decimal
    spent: Decimal
    icon: str
    color: str
    month: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetAlert(BaseModel):
    id: int
    name: str
    level: str
    message: str
    percent_used: float