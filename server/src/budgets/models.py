
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal


class BudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    period: Literal["weekly", "monthly", "yearly"] = "monthly"


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    period: Literal["weekly", "monthly", "yearly"] | None = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    period: str

    model_config = ConfigDict(from_attributes=True)
