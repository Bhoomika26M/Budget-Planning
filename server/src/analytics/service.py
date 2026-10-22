from datetime import date

from sqlalchemy.orm import Session

from src.expenses.entity import Expense
from src.budgets.entity import Budget


def get_analytics_overview(db: Session, user_id: int):
    today = date.today()
    current_month = today.month
    current_year = today.year

    # Fetch all expenses belonging to this user.
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .all()
    )

    # Fetch this user's monthly budgets only.
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.period == "monthly",
        )
        .all()
    )

    # Keep historical expenses for the monthly trend chart,
    # but use only current-month expenses for the headline figures.
    current_month_expenses = [
        expense
        for expense in expenses
        if expense.expense_date
        and expense.expense_date.month == current_month
        and expense.expense_date.year == current_year
    ]

    total_spending = sum(
        float(expense.amount or 0)
        for expense in current_month_expenses
    )

    budget_total = sum(
        float(budget.amount or 0)
        for budget in budgets
    )

    # Current-month category breakdown.
    category_totals = {}

    for expense in current_month_expenses:
        category = expense.category or "Miscellaneous"
        amount = float(expense.amount or 0)

        category_totals[category] = (
            category_totals.get(category, 0) + amount
        )

    # Historical spending grouped by month.
    monthly_totals = {}

    for expense in expenses:
        month = (
            expense.expense_date.strftime("%Y-%m")
            if expense.expense_date
            else "Unknown"
        )

        amount = float(expense.amount or 0)
        monthly_totals[month] = (
            monthly_totals.get(month, 0) + amount
        )

    return {
        "total_spending": round(total_spending, 2),
        "budget_total": round(budget_total, 2),
        "remaining_budget": round(budget_total - total_spending, 2),
        "by_category": [
            {
                "category": category,
                "total": round(total, 2),
            }
            for category, total in category_totals.items()
        ],
        "monthly_trends": [
            {
                "month": month,
                "total": round(total, 2),
            }
            for month, total in sorted(monthly_totals.items())
        ],
    }