from pydantic import BaseModel
from typing import List


class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float


class MonthlySummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float

    active_goals: int
    completed_goals: int

    savings_rate: float

    income_transactions: int
    expense_transactions: int

    monthly_data: List[MonthlyData]