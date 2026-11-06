"""
Dashboard Summary Router.
Aggregates all financial metrics for the current user.
"""
from typing import Any
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func, extract, desc

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings import SavingsGoal
from app.models.notification import Notification
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    y, m = today.year, today.month

    # Total budget (all budgets for this month, Overall + category sum)
    overall_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == today.strftime("%Y-%m"),
        Budget.category == "Overall"
    ).first()
    total_budget = overall_budget.amount_limit if overall_budget else 0.0

    # Total spend this month
    total_spend = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == y,
        extract('month', Expense.date) == m
    ).scalar() or 0.0

    remaining = max(total_budget - total_spend, 0.0)

    # Budget alerts (unread)
    alert_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "budget_alert",
        Notification.is_read == False
    ).count()

    # Spending by category (this month)
    cat_rows = db.query(Expense.category, func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == y,
        extract('month', Expense.date) == m
    ).group_by(Expense.category).all()
    spending_by_category = [{"category": r[0], "amount": round(r[1], 2)} for r in cat_rows]

    # Last 6 months income vs expenses
    months_data = []
    for i in range(5, -1, -1):
        mm = m - i
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        inc = db.query(func.sum(Income.amount)).filter(
            Income.user_id == current_user.id,
            extract('year', Income.date) == yy,
            extract('month', Income.date) == mm
        ).scalar() or 0.0
        exp = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            extract('year', Expense.date) == yy,
            extract('month', Expense.date) == mm
        ).scalar() or 0.0
        months_data.append({
            "month": date(yy, mm, 1).strftime("%b"),
            "income": round(inc, 2),
            "expenses": round(exp, 2),
        })

    # Recent transactions (last 5 expenses + income, sorted by date)
    recent_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(desc(Expense.date), desc(Expense.id)).limit(5).all()

    recent_incomes = db.query(Income).filter(
        Income.user_id == current_user.id
    ).order_by(desc(Income.date), desc(Income.id)).limit(5).all()

    # Merge and sort
    transactions = []
    for e in recent_expenses:
        transactions.append({
            "id": e.id,
            "type": "expense",
            "title": e.title,
            "category": e.category,
            "amount": -round(e.amount, 2),
            "date": str(e.date),
        })
    for i in recent_incomes:
        transactions.append({
            "id": i.id,
            "type": "income",
            "title": i.source,
            "category": "Income",
            "amount": round(i.amount, 2),
            "date": str(i.date),
        })
    transactions.sort(key=lambda x: x["date"], reverse=True)
    transactions = transactions[:5]

    return {
        "total_budget": round(total_budget, 2),
        "total_spend": round(total_spend, 2),
        "remaining_budget": round(remaining, 2),
        "budget_alert_count": alert_count,
        "spending_by_category": spending_by_category,
        "monthly_comparison": months_data,
        "recent_transactions": transactions,
    }
