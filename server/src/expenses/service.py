
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.expenses.entity import Expense


def create_expense(db: Session, user_id: int, data):
    values = data.model_dump()
    values["category"] = values["category"].strip()
    expense = Expense(user_id=user_id, **values)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(db: Session, user_id: int):
    return (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .all()
    )


def find_expense(db: Session, user_id: int, expense_id: int):
    return db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id,
    ).first()


def update_expense(db: Session, expense, data):
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "category" and value is not None:
            value = value.strip()
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense):
    db.delete(expense)
    db.commit()


def expense_summary(db: Session, user_id: int):
    total = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id
    ).scalar() or 0

    rows = db.query(
        Expense.category,
        func.sum(Expense.amount)
    ).filter(
        Expense.user_id == user_id
    ).group_by(Expense.category).all()

    return {
        "total_spending": round(total, 2),
        "by_category": [
            {"category": category, "amount": round(amount, 2)}
            for category, amount in rows
        ],
    }
