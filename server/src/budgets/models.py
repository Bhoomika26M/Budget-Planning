from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Period = Literal["weekly", "monthly", "yearly"]


class BudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    period: Period = "monthly"
    color: Optional[str] = Field(default=None, max_length=20)


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    period: Period | None = None
    color: Optional[str] = Field(default=None, max_length=20)


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    period: str
    color: Optional[str] = None
    # Calculated from the user's (non-cancelled) expenses for the month.
    spent: float = 0

    model_config = ConfigDict(from_attributes=True)


class MonthlyBudgetUpdate(BaseModel):
    monthly_budget: float = Field(ge=0)
