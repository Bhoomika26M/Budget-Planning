from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user, require_premium
from src.database.core import get_db
from src.entities.user import User
from src.expenses.models import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from src.expenses.service import (
    create_expense,
    delete_expense,
    expense_summary,
    find_expense,
    list_expenses,
    update_expense,
)
from src.notifications.service import generate_alerts

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse, status_code=201)
def add_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = create_expense(db, user.id, data)
    generate_alerts(db, user)
    return expense


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    category: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_expenses(db, user.id, month=month, category=category)


@router.get("/summary")
def get_expense_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return expense_summary(db, user.id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_one_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def edit_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    updated = update_expense(db, expense, data)
    generate_alerts(db, user)
    return updated


# Deleting records is a Premium feature (see FEATURE_PERMISSIONS in the client).
@router.delete("/{expense_id}", status_code=204)
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    delete_expense(db, expense)
