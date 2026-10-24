from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.dashboard.transaction_model import Transaction
from src.entities.user import User
from .expense_model import Expense

router = APIRouter(prefix="/expenses", tags=["Expenses"])


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=60)
    amount: float = Field(gt=0, allow_inf_nan=False)
    date: date
    note: str = Field(default="", max_length=255)
    payment_method: str = Field(default="Card", min_length=1, max_length=50)

    @field_validator("title", "category", "payment_method")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank")
        return value

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str) -> str:
        return value.strip()


class ExpenseUpdate(ExpenseCreate):
    pass


@router.get("/")
def get_expenses(
    category: str | None = Query(default=None, min_length=1, max_length=60),
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must not be after end_date")
    query = db.query(Expense).filter(Expense.user_id == user.id)
    if category:
        query = query.filter(Expense.category == category.strip())
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return [
        {
            "id": expense.id,
            "title": expense.title,
            "category": expense.category,
            "amount": expense.amount,
            "date": expense.date.isoformat(),
            "note": expense.note,
            "payment_method": expense.payment_method,
        }
        for expense in expenses
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dashboard_transaction = Transaction(
        user_id=user.id,
        type="expense",
        description=expense.title,
        amount=expense.amount,
        date=expense.date,
        category=expense.category,
        account=expense.payment_method,
    )
    db.add(dashboard_transaction)
    db.flush()

    new_expense = Expense(
        user_id=user.id,
        transaction_id=dashboard_transaction.id,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        date=expense.date,
        note=expense.note,
        payment_method=expense.payment_method,
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return {
        "message": "Expense added successfully",
        "expense": {
            "id": new_expense.id,
            "title": new_expense.title,
            "category": new_expense.category,
            "amount": new_expense.amount,
            "date": new_expense.date.isoformat(),
            "note": new_expense.note,
            "payment_method": new_expense.payment_method,
        },
    }


@router.put("/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing_expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if existing_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    dashboard_transaction = None
    if existing_expense.transaction_id is not None:
        dashboard_transaction = (
            db.query(Transaction)
            .filter(
                Transaction.id == existing_expense.transaction_id,
                Transaction.user_id == user.id,
                Transaction.type == "expense",
            )
            .first()
        )

    existing_expense.title = expense.title
    existing_expense.category = expense.category
    existing_expense.amount = expense.amount
    existing_expense.date = expense.date
    existing_expense.note = expense.note
    existing_expense.payment_method = expense.payment_method

    if dashboard_transaction is None:
        dashboard_transaction = Transaction(
            user_id=user.id,
            type="expense",
        )
        db.add(dashboard_transaction)
    dashboard_transaction.description = expense.title
    dashboard_transaction.category = expense.category
    dashboard_transaction.amount = expense.amount
    dashboard_transaction.date = expense.date
    dashboard_transaction.account = expense.payment_method
    db.flush()
    existing_expense.transaction_id = dashboard_transaction.id

    db.commit()
    db.refresh(existing_expense)

    return {
        "message": "Expense updated successfully",
        "expense": {
            "id": existing_expense.id,
            "title": existing_expense.title,
            "category": existing_expense.category,
            "amount": existing_expense.amount,
            "date": existing_expense.date.isoformat(),
            "note": existing_expense.note,
            "payment_method": existing_expense.payment_method,
        },
    }


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense.transaction_id is not None:
        linked_transaction = (
            db.query(Transaction)
            .filter(
                Transaction.id == expense.transaction_id,
                Transaction.user_id == user.id,
                Transaction.type == "expense",
            )
            .first()
        )
        if linked_transaction is not None:
            db.delete(linked_transaction)

    db.delete(expense)
    db.commit()
    return None
