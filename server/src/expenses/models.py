
from datetime import date
from pydantic import BaseModel, Field, ConfigDict


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)
    expense_date: date


class ExpenseUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=255)
    expense_date: date | None = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    description: str | None
    expense_date: date

    model_config = ConfigDict(from_attributes=True)
