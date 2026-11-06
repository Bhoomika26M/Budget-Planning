"""
Budget Planning Router.
Create, list and track monthly budgets per category.
"""
from typing import List, Optional, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, extract

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.notification import Notification
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetStatus
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def compute_budget_status(b: Budget, db: Session) -> dict:
    """Compute spending stats for a single budget entry."""
    try:
        y, m = map(int, b.month.split("-"))
    except Exception:
        y, m = date.today().year, date.today().month

    q = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == b.user_id,
        extract('year', Expense.date) == y,
        extract('month', Expense.date) == m
    )
    if b.category != "Overall":
        q = q.filter(Expense.category == b.category)
    total_spent = q.scalar() or 0.0

    remaining = max(b.amount_limit - total_spent, 0.0)
    usage_pct = (total_spent / b.amount_limit * 100) if b.amount_limit > 0 else 0.0

    return {
        "id": b.id,
        "month": b.month,
        "category": b.category,
        "amount_limit": b.amount_limit,
        "total_spent": round(total_spent, 2),
        "remaining_amount": round(remaining, 2),
        "usage_percentage": round(usage_pct, 1),
        "is_exceeded": usage_pct >= 100.0,
        "is_warning": usage_pct >= 80.0,
    }


@router.get("", response_model=List[BudgetStatus])
def list_budgets(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not month:
        month = date.today().strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month
    ).all()
    return [compute_budget_status(b, db) for b in budgets]


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Upsert: if same user+month+category exists, update it
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == payload.month,
        Budget.category == payload.category
    ).first()
    if existing:
        existing.amount_limit = payload.amount_limit
        db.commit()
        db.refresh(existing)
        return existing

    record = Budget(
        user_id=current_user.id,
        month=payload.month,
        category=payload.category,
        amount_limit=payload.amount_limit
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Budget not found")
    record.amount_limit = payload.amount_limit
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(record)
    db.commit()
