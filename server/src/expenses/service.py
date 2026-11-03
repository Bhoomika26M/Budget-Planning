from datetime import date

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from src.expenses.entity import Expense


def create_expense(db: Session, user_id: int, data):
    values = data.model_dump()
    values["category"] = values["category"].strip()
    if values.get("description") is not None:
        values["description"] = values["description"].strip() or None
    expense = Expense(user_id=user_id, **values)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def list_expenses(db: Session, user_id: int, month: str | None = None, category: str | None = None):
    query = db.query(Expense).filter(Expense.user_id == user_id)

    if month:  # "YYYY-MM"
        year, mon = (int(part) for part in month.split("-"))
        query = query.filter(
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == mon,
        )

    if category:
        query = query.filter(func.lower(Expense.category) == category.strip().lower())

    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()


def find_expense(db: Session, user_id: int, expense_id: int):
    return db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id,
    ).first()


def update_expense(db: Session, expense, data):
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "category" and value is not None:
            value = value.strip()
        if key == "description" and value is not None:
            value = value.strip() or None
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense):
    db.delete(expense)
    db.commit()


def active_expenses_query(db: Session, user_id: int):
    """Expenses that count towards totals (cancelled ones are ignored)."""
    return db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.status != "Cancelled",
    )


def spent_by_category(db: Session, user_id: int, year: int, month: int) -> dict[str, float]:
    rows = (
        db.query(func.lower(Expense.category), func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            Expense.status != "Cancelled",
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == month,
        )
        .group_by(func.lower(Expense.category))
        .all()
    )
    return {category: float(total or 0) for category, total in rows}


def expense_summary(db: Session, user_id: int):
    today = date.today()
    base = active_expenses_query(db, user_id)

    total = base.with_entities(func.sum(Expense.amount)).scalar() or 0
    month_total = (
        base.filter(
            extract("year", Expense.expense_date) == today.year,
            extract("month", Expense.expense_date) == today.month,
        )
        .with_entities(func.sum(Expense.amount))
        .scalar()
        or 0
    )

    rows = (
        base.with_entities(Expense.category, func.sum(Expense.amount))
        .group_by(Expense.category)
        .all()
    )

    return {
        "total_spending": round(total, 2),
        "this_month": round(month_total, 2),
        "by_category": [
            {"category": category, "amount": round(amount, 2)}
            for category, amount in rows
        ],
    }
