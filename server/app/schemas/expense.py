
"""
Expense Pydantic Schemas.
"""

from datetime import date as Date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


ExpenseCategoryType = Literal[
    "Food",
    "Transportation",
    "Education",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Bills",
    "Others"
]

PaymentMethodType = Literal[
    "Cash",
    "Debit Card",
    "Credit Card",
    "UPI / Online",
    "Bank Transfer"
]


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    amount: float = Field(..., gt=0.0)
    category: ExpenseCategoryType
    date: Date = Field(default_factory=Date.today)
    payment_method: PaymentMethodType = "Cash"
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    amount: Optional[float] = Field(None, gt=0.0)
    category: Optional[ExpenseCategoryType] = None
    date: Optional[Date] = None
    payment_method: Optional[PaymentMethodType] = None
    description: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    total_amount: float
    monthly_amount: float
    category_totals: dict
    count: int
