from datetime import date
from calendar import monthrange

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.income import Income
from app.models.savings import SavingsGoal
from app.models.user import User


router = APIRouter(prefix="/analytics", tags=["Analytics"])


def shift_month(year: int, month: int, offset: int):
    index = year * 12 + month - 1 + offset
    return index // 12, index % 12 + 1


@router.get("")
def get_analytics(
    period: int = Query(6, ge=3, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    first_year, first_month = shift_month(today.year, today.month, -(period - 1))
    start_date = date(first_year, first_month, 1)
    end_date = date(today.year, today.month, monthrange(today.year, today.month)[1])

    income = db.query(func.coalesce(func.sum(Income.amount), 0.0)).filter(
        Income.user_id == current_user.id,
        Income.date >= start_date,
        Income.date <= end_date,
    ).scalar()
    expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.user_id == current_user.id,
        Expense.date >= start_date,
        Expense.date <= end_date,
    ).scalar()

    income = round(float(income or 0), 2)
    expenses = round(float(expenses or 0), 2)
    net = round(income - expenses, 2)
    savings_rate = round((net / income * 100), 2) if income > 0 else 0.0

    monthly_trends = []
    for offset in range(-(period - 1), 1):
        year, month = shift_month(today.year, today.month, offset)
        month_income = db.query(func.coalesce(func.sum(Income.amount), 0.0)).filter(
            Income.user_id == current_user.id,
            extract("year", Income.date) == year,
            extract("month", Income.date) == month,
        ).scalar()
        month_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.user_id == current_user.id,
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        ).scalar()
        month_income = round(float(month_income or 0), 2)
        month_expenses = round(float(month_expenses or 0), 2)
        monthly_trends.append({
            "month": f"{year}-{month:02d}",
            "label": date(year, month, 1).strftime("%b"),
            "income": month_income,
            "expenses": month_expenses,
            "net": round(month_income - month_expenses, 2),
        })

    category_rows = db.query(
        Expense.category,
        func.sum(Expense.amount),
    ).filter(
        Expense.user_id == current_user.id,
        Expense.date >= start_date,
        Expense.date <= end_date,
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

    spending_by_category = [
        {
            "category": category,
            "amount": round(float(amount or 0), 2),
            "percentage": round(float(amount or 0) / expenses * 100, 1) if expenses > 0 else 0.0,
        }
        for category, amount in category_rows
    ]
    highest_spending_category = spending_by_category[0] if spending_by_category else None

    current_month = today.strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == current_month,
    ).all()
    budget_items = []
    over_budget_categories = []
    total_budget_amount = 0.0
    for budget in budgets:
        actual = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.user_id == current_user.id,
            extract("year", Expense.date) == today.year,
            extract("month", Expense.date) == today.month,
        )
        if budget.category != "Overall":
            actual = actual.filter(Expense.category == budget.category)
        actual = float(actual.scalar() or 0)
        amount_limit = round(float(budget.amount_limit or 0), 2)
        actual = round(actual, 2)
        usage = round(actual / amount_limit * 100, 1) if amount_limit > 0 else 0.0
        remaining = round(amount_limit - actual, 2)
        item = {
            "category": budget.category,
            "budget": amount_limit,
            "spent": actual,
            "remaining": remaining,
            "usage_percentage": usage,
        }
        budget_items.append(item)
        total_budget_amount += amount_limit
        if actual > amount_limit:
            over_budget_categories.append({
                "category": budget.category,
                "over_amount": round(actual - amount_limit, 2),
            })

    budget_spending = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.user_id == current_user.id,
        extract("year", Expense.date) == today.year,
        extract("month", Expense.date) == today.month,
    ).scalar()
    budget_spending = round(float(budget_spending or 0), 2)

    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    total_saved = round(sum(float(goal.saved_amount or 0) for goal in goals), 2)
    total_target = round(sum(float(goal.target_amount or 0) for goal in goals), 2)
    savings_progress = round(total_saved / total_target * 100, 1) if total_target > 0 else 0.0
    active_goals = sum(goal.status != "completed" for goal in goals)
    completed_goals = sum(goal.status == "completed" for goal in goals)

    months_with_expenses = [item for item in monthly_trends if item["expenses"] > 0]
    highest_expense_month = max(months_with_expenses, key=lambda item: item["expenses"]) if months_with_expenses else None

    return {
        "period": period,
        "financial_overview": {
            "total_income": income,
            "total_expenses": expenses,
            "net_surplus": net,
            "savings_rate": savings_rate,
        },
        "monthly_trends": monthly_trends,
        "expense_analysis": {
            "spending_by_category": spending_by_category,
            "highest_spending_category": highest_spending_category,
            "total_spending": expenses,
        },
        "budget_analysis": {
            "month": current_month,
            "budget_amount": round(total_budget_amount, 2),
            "actual_spending": budget_spending,
            "remaining_amount": round(max(total_budget_amount - budget_spending, 0), 2),
            "usage_percentage": round(budget_spending / total_budget_amount * 100, 1) if total_budget_amount > 0 else 0.0,
            "categories": budget_items,
            "over_budget_categories": over_budget_categories,
        },
        "savings_analysis": {
            "total_saved": total_saved,
            "total_target": total_target,
            "overall_progress": min(savings_progress, 100.0),
            "active_goals": active_goals,
            "completed_goals": completed_goals,
        },
        "insights": {
            "highest_expense_month": highest_expense_month,
            "has_positive_net": net > 0,
            "has_negative_net": net < 0,
        },
    }
