from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.analytics.service import get_analytics
from src.auth.security import get_current_user, get_db
from src.entities.user import User

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class MonthlyTrend(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float


class ExpenseBreakdown(BaseModel):
    name: str
    value: float


class AnalyticsResponse(BaseModel):
    has_data: bool
    total_income: float
    total_expenses: float
    savings_rate: float
    avg_tx_amount: float
    monthly_trend: list[MonthlyTrend]
    expense_breakdown: list[ExpenseBreakdown]


@router.get("", response_model=AnalyticsResponse)
def fetch_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in {"premium", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium access required",
        )

    return AnalyticsResponse(**get_analytics(db, user.id))
