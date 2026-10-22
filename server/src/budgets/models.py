from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

MONTH_PATTERN = r'^\d{4}-(0[1-9]|1[0-2])$'
COLOR_PATTERN = r'^#[0-9a-fA-F]{6}$'


class BudgetCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name: str = Field(min_length=1, max_length=100)
    budget: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    icon: str = Field(min_length=1, max_length=8)
    color: str = Field(pattern=COLOR_PATTERN)
    month: Optional[str] = Field(default=None, pattern=MONTH_PATTERN)


class BudgetUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    budget: Optional[Decimal] = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    icon: Optional[str] = Field(default=None, min_length=1, max_length=8)
    color: Optional[str] = Field(default=None, pattern=COLOR_PATTERN)


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


class BudgetAlert(BaseModel):
    id: int
    name: str
    level: str
    message: str
    percent_used: float
