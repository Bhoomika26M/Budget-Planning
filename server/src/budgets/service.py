from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from src.budgets.entity import Budget
from src.expenses.service import spent_by_category

CATEGORY_COLORS = {
    "food": "#2E93C7",
    "travel": "#0D6D91",
    "shopping": "#5FA7D2",
    "education": "#8DBEE3",
    "entertainment": "#164A72",
    "miscellaneous": "#B9D2E7",
}


def parse_month(month: str | None) -> tuple[int, int]:
    if month:
        year, mon = (int(part) for part in month.split("-"))
        return year, mon
    today = date.today()
    return today.year, today.month


def with_spent(budgets, spent: dict[str, float]):
    """Attach the calculated `spent` value used by the BudgetResponse model."""
    for budget in budgets:
        budget.spent = round(spent.get(budget.category.lower(), 0.0), 2)
    return budgets


def find_duplicate(db: Session, user_id: int, category: str, period: str, exclude_id: int | None = None):
    query = db.query(Budget).filter(
        Budget.user_id == user_id,
        func.lower(Budget.category) == category.strip().lower(),
        Budget.period == period,
    )
    if exclude_id is not None:
        query = query.filter(Budget.id != exclude_id)
    return query.first()


def create_budget(db: Session, user_id: int, data):
    category = data.category.strip()
    budget = Budget(
        user_id=user_id,
        category=category,
        amount=data.amount,
        period=data.period,
        color=data.color or CATEGORY_COLORS.get(category.lower(), "#2E93C7"),
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budgets(db: Session, user_id: int):
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(Budget.id.asc())
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
        if value is None:
            continue
        if field == "category":
            value = value.strip()
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget):
    db.delete(budget)
    db.commit()


def budgets_with_spent(db: Session, user_id: int, month: str | None = None):
    year, mon = parse_month(month)
    return with_spent(get_budgets(db, user_id), spent_by_category(db, user_id, year, mon))
