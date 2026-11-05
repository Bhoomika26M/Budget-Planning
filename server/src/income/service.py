from sqlalchemy import extract
from sqlalchemy.orm import Session

from src.income.entity import Income


def _clean(value):
    return value.strip() or None if isinstance(value, str) else value


def create_income(db: Session, user_id: int, data):
    values = data.model_dump()
    values["category"] = values["category"].strip()
    values["title"] = (values.get("title") or values["category"]).strip()
    values["description"] = _clean(values.get("description"))

    income = Income(user_id=user_id, **values)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def list_income(db: Session, user_id: int, month: str | None = None):
    query = db.query(Income).filter(Income.user_id == user_id)
    if month:
        year, mon = (int(part) for part in month.split("-"))
        query = query.filter(
            extract("year", Income.date) == year,
            extract("month", Income.date) == mon,
        )
    return query.order_by(Income.date.desc(), Income.id.desc()).all()


def find_income(db: Session, user_id: int, income_id: int):
    return (
        db.query(Income)
        .filter(Income.id == income_id, Income.user_id == user_id)
        .first()
    )


def update_income(db: Session, income, data):
    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        if field in ("title", "category") and value is not None:
            value = value.strip()
        if field == "description":
            value = _clean(value)
        setattr(income, field, value)

    # Keep the title in sync when only the source changed.
    if "category" in changes and "title" not in changes:
        income.title = income.category

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income):
    db.delete(income)
    db.commit()
