from sqlalchemy.orm import Session
from src.income.entity import Income


def create_income(db: Session, user_id: int, data):
    values = data.model_dump()
    values["title"] = values["title"].strip()
    values["category"] = values["category"].strip()
    values["description"] = (
        values["description"].strip() or None
        if values["description"] is not None
        else None
    )

    income = Income(user_id=user_id, **values)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def list_income(db: Session, user_id: int):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .order_by(Income.date.desc(), Income.id.desc())
        .all()
    )


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
        if field == "description" and value is not None:
            value = value.strip() or None
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income):
    db.delete(income)
    db.commit()