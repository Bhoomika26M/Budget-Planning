"""
Expense Management Router.

Provides CRUD endpoints, search, filtering, sorting, category totals,
and duplicate-safe budget threshold alert checks.
Strictly isolates data by current_user.id.
"""

from typing import List, Optional, Any, Dict
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, desc, asc, extract

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.notification import Notification
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseSummary,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def check_budget_thresholds(user_id: int, expense_date: date, category: str, db: Session):
    """
    Checks if spending for the expense's month crosses 80% or 100% of defined budgets.
    Prevents duplicate notifications if an alert for that threshold was already created.
    """
    month_str = expense_date.strftime("%Y-%m")

    # Fetch budgets relevant to this expense (Overall budget and Category budget)
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month_str,
        Budget.category.in_(["Overall", category])
    ).all()

    if not budgets:
        return

    # Calculate month total for overall and for this category
    year, month = expense_date.year, expense_date.month

    for b in budgets:
        query = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        )
        if b.category != "Overall":
            query = query.filter(Expense.category == b.category)

        total_spent = query.scalar() or 0.0

        if b.amount_limit <= 0:
            continue

        usage_pct = (total_spent / b.amount_limit) * 100.0

        if usage_pct >= 100.0:
            threshold_tag = f"[100% EXCEEDED - {b.month} - {b.category}]"
            # Check for existing notification to prevent duplicates
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.type == "budget_alert",
                Notification.message.contains(threshold_tag)
            ).first()

            if not existing:
                notif = Notification(
                    user_id=user_id,
                    title=f"⚠️ Budget Exceeded: {b.category}",
                    message=f"{threshold_tag} You have spent {total_spent:,.2f} exceeding your limit of {b.amount_limit:,.2f} for {b.month}.",
                    type="budget_alert",
                )
                db.add(notif)
                db.commit()

        elif usage_pct >= 80.0:
            threshold_tag = f"[80% WARNING - {b.month} - {b.category}]"
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.type == "budget_alert",
                Notification.message.contains(threshold_tag)
            ).first()

            if not existing:
                notif = Notification(
                    user_id=user_id,
                    title=f"⚠️ Budget Warning: {b.category}",
                    message=f"{threshold_tag} You have reached {usage_pct:.0f}% of your {b.category} budget for {b.month} (Spent: {total_spent:,.2f} / Limit: {b.amount_limit:,.2f}).",
                    type="budget_alert",
                )
                db.add(notif)
                db.commit()


@router.get("", response_model=List[ExpenseResponse])
@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    month: Optional[str] = Query(None, description="Format YYYY-MM"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None, description="Search in title or description"),
    sort_by: str = Query("date", regex="^(date|amount)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all expenses owned by the current user.
    Supports filtering by category, payment method, date/month, and searching.
    Strictly isolated to current_user.id.
    """
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if category:
        query = query.filter(Expense.category == category)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)
    if month:
        parts = month.split("-")
        if len(parts) == 2:
            query = query.filter(
                extract('year', Expense.date) == int(parts[0]),
                extract('month', Expense.date) == int(parts[1])
            )
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Expense.title.ilike(search_pattern)) | (Expense.description.ilike(search_pattern))
        )

    # Sorting
    sort_column = Expense.amount if sort_by == "amount" else Expense.date
    if order == "asc":
        query = query.order_by(asc(sort_column), asc(Expense.id))
    else:
        query = query.order_by(desc(sort_column), desc(Expense.id))

    return query.all()


@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    month: Optional[str] = Query(None, description="Format YYYY-MM (defaults to current month)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated metrics: total all-time expenses, monthly expenses,
    category breakdown dictionary, and total expense transaction count.
    """
    target_month = month or date.today().strftime("%Y-%m")
    parts = target_month.split("-")
    year_int, month_int = int(parts[0]), int(parts[1])

    # All-time total
    total_amount = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id
    ).scalar() or 0.0

    # Monthly total
    monthly_amount = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year_int,
        extract('month', Expense.date) == month_int
    ).scalar() or 0.0

    # Category totals for the month
    category_rows = db.query(
        Expense.category, func.sum(Expense.amount)
    ).filter(
        Expense.user_id == current_user.id,
        extract('year', Expense.date) == year_int,
        extract('month', Expense.date) == month_int
    ).group_by(Expense.category).all()

    category_totals = {cat: float(amt) for cat, amt in category_rows}

    # Count
    count = db.query(func.count(Expense.id)).filter(
        Expense.user_id == current_user.id
    ).scalar() or 0

    return ExpenseSummary(
        total_amount=float(total_amount),
        monthly_amount=float(monthly_amount),
        category_totals=category_totals,
        count=count,
    )


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Records a new expense for the authenticated user and checks for budget limit warnings.
    """
    expense = Expense(
        user_id=current_user.id,
        title=expense_in.title.strip(),
        amount=expense_in.amount,
        category=expense_in.category,
        date=expense_in.date,
        payment_method=expense_in.payment_method,
        description=expense_in.description.strip() if expense_in.description else None,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Perform duplicate-safe budget threshold alert check
    try:
        check_budget_thresholds(current_user.id, expense.date, expense.category, db)
    except Exception as e:
        print(f"Budget threshold check warning: {e}")

    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves a single expense by ID ensuring it belongs to current_user.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found",
        )
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates an existing expense owned by the current user.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found",
        )

    if expense_in.title is not None:
        expense.title = expense_in.title.strip()
    if expense_in.amount is not None:
        expense.amount = expense_in.amount
    if expense_in.category is not None:
        expense.category = expense_in.category
    if expense_in.date is not None:
        expense.date = expense_in.date
    if expense_in.payment_method is not None:
        expense.payment_method = expense_in.payment_method
    if expense_in.description is not None:
        expense.description = expense_in.description.strip() if expense_in.description else None

    db.commit()
    db.refresh(expense)

    # Check budget thresholds upon update
    try:
        check_budget_thresholds(current_user.id, expense.date, expense.category, db)
    except Exception:
        pass

    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes an expense record owned by the current user.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found",
        )

    db.delete(expense)
    db.commit()

    return {"message": "Expense record deleted successfully", "id": expense_id}
