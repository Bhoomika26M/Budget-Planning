from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.core import SessionLocal
from src.dashboard.transaction_model import Transaction
from .expense_model import Expense

router = APIRouter(prefix="/expenses", tags=["Expenses"])


class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: float
    date: date
    note: str = ""
    payment_method: str = "Card"


class ExpenseUpdate(ExpenseCreate):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_expenses(db: Session = Depends(get_db)):
    expenses = db.query(Expense).order_by(Expense.date.desc(), Expense.id.desc()).all()
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


@router.post("/")
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        date=expense.date,
        note=expense.note,
        payment_method=expense.payment_method,
    )

    db.add(new_expense)
    db.flush()

    dashboard_transaction = Transaction(
        type="expense",
        description=expense.title,
        amount=expense.amount,
        date=expense.date,
        category=expense.category,
        account=expense.payment_method,
    )
    db.add(dashboard_transaction)
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
def update_expense(expense_id: int, expense: ExpenseUpdate, db: Session = Depends(get_db)):
    existing_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if existing_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    dashboard_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.description == existing_expense.title,
            Transaction.category == existing_expense.category,
            Transaction.amount == existing_expense.amount,
            Transaction.date == existing_expense.date,
        )
        .order_by(Transaction.id.desc())
        .first()
    )

    existing_expense.title = expense.title
    existing_expense.category = expense.category
    existing_expense.amount = expense.amount
    existing_expense.date = expense.date
    existing_expense.note = expense.note
    existing_expense.payment_method = expense.payment_method

    if dashboard_transaction is not None:
        dashboard_transaction.description = expense.title
        dashboard_transaction.category = expense.category
        dashboard_transaction.amount = expense.amount
        dashboard_transaction.date = expense.date
        dashboard_transaction.account = expense.payment_method

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


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    matching_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.type == "expense",
            Transaction.description == expense.title,
            Transaction.amount == expense.amount,
            Transaction.category == expense.category,
            Transaction.date == expense.date,
        )
        .order_by(Transaction.id.desc())
        .first()
    )

    if matching_transaction is not None:
        db.delete(matching_transaction)

    db.delete(expense)
    db.commit()

    return {"message": "Expense deleted successfully"}
