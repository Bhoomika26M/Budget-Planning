from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.dependencies import RoleChecker
from app.database import get_db
from app.models.expense import Expense
from app.models.income import Income
from app.models.savings import SavingsGoal
from app.models.user import User


router = APIRouter(prefix="/reports", tags=["Reports"])

reports_access = RoleChecker(["premium", "admin"])


@router.get("/summary")
def get_reports_summary(
    current_user: User = Depends(reports_access),
    db: Session = Depends(get_db),
):
    today = date.today()
    income = db.query(func.coalesce(func.sum(Income.amount), 0.0)).filter(
        Income.user_id == current_user.id,
        extract("year", Income.date) == today.year,
        extract("month", Income.date) == today.month,
    ).scalar()
    expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.user_id == current_user.id,
        extract("year", Expense.date) == today.year,
        extract("month", Expense.date) == today.month,
    ).scalar()
    category_rows = db.query(Expense.category, func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        extract("year", Expense.date) == today.year,
        extract("month", Expense.date) == today.month,
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()

    income = round(float(income or 0), 2)
    expenses = round(float(expenses or 0), 2)
    net = round(income - expenses, 2)
    total_saved = round(sum(float(goal.saved_amount or 0) for goal in goals), 2)
    total_target = round(sum(float(goal.target_amount or 0) for goal in goals), 2)

    return {
        "month": today.strftime("%Y-%m"),
        "financial_overview": {
            "total_income": income,
            "total_expenses": expenses,
            "net": net,
        },
        "spending_by_category": [
            {"category": category, "amount": round(float(amount or 0), 2)}
            for category, amount in category_rows
        ],
        "savings": {
            "total_saved": total_saved,
            "total_target": total_target,
        },
    }
