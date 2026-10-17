
from sqlalchemy.orm import Session
from src.budgets.entity import Budget


def create_budget(db: Session, user_id: int, data):
    budget = Budget(
        user_id=user_id,
        category=data.category.strip(),
        amount=data.amount,
        period=data.period,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budgets(db: Session, user_id: int):
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(Budget.id.desc())
        .all()
    )


def get_budget(db: Session, user_id: int, budget_id: int):
    return (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == user_id)
        .first()
    )


def update_budget(db: Session, budget, data):
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        if field == "category" and value is not None:
            value = value.strip()
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget):
    db.delete(budget)
    db.commit()
