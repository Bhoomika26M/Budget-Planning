from sqlalchemy.orm import Session

from src.entities.income import Income
from src.entities.income_source import IncomeSource


def create_income(
    db: Session,
    user_id: int,
    description: str,
    amount: float,
    date,
    category: str,
):
    income = Income(
        user_id=user_id,
        description=description,
        amount=amount,
        date=date,
        category=category,
    )

    db.add(income)
    db.commit()
    db.refresh(income)

    return income


def get_user_income(db: Session, user_id: int):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .order_by(Income.date.desc())
        .all()
    )


def delete_income(db: Session, user_id: int, income_id: int):
    income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id,
        )
        .first()
    )

    if income is None:
        return None

    db.delete(income)
    db.commit()

    return income

def create_income_source(
    db: Session,
    user_id: int,
    name: str,
    amount: float,
    category: str,
    frequency: str,
):
    source = IncomeSource(
        user_id=user_id,
        name=name,
        amount=amount,
        category=category,
        frequency=frequency,
    )

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


def get_user_income_sources(db: Session, user_id: int):
    return (
        db.query(IncomeSource)
        .filter(IncomeSource.user_id == user_id)
        .order_by(IncomeSource.id.desc())
        .all()
    )


def delete_income_source(db: Session, user_id: int, source_id: int):
    source = (
        db.query(IncomeSource)
        .filter(
            IncomeSource.id == source_id,
            IncomeSource.user_id == user_id,
        )
        .first()
    )

    if source is None:
        return None

    db.delete(source)
    db.commit()

    return source