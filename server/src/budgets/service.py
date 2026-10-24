from calendar import monthrange
from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.budgets.models import BudgetCreate, BudgetUpdate
from src.dashboard.transaction_model import Transaction
from src.entities.budget import Budget

ALERT_WARNING_PERCENT = Decimal('70')
ALERT_CRITICAL_PERCENT = Decimal('90')
ALERT_OVERSPENT_PERCENT = Decimal('100')

DUPLICATE_MESSAGE = 'A budget category with this name already exists for this month.'


def _current_month() -> str:
    return datetime.now().strftime('%Y-%m')


def _spent_for(db: Session, user_id: int, budget: Budget) -> Decimal:
    """Sum of the user's expense transactions for this category and month."""
    year, month = (int(part) for part in budget.month.split('-'))
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])
    total = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.user_id == user_id,
            Transaction.type == 'expense',
            func.lower(Transaction.category) == budget.name.lower(),
            Transaction.date >= first_day,
            Transaction.date <= last_day,
        )
    )
    return Decimal(str(total or 0)).quantize(Decimal('0.01'))


def _to_response(db: Session, user_id: int, budget: Budget) -> dict:
    return {
        'id': budget.id,
        'name': budget.name,
        'budget': budget.budget,
        'spent': _spent_for(db, user_id, budget),
        'icon': budget.icon,
        'color': budget.color,
        'month': budget.month,
        'created_at': budget.created_at,
        'updated_at': budget.updated_at,
    }


def _get_owned_budget(db: Session, user_id: int, budget_id: int) -> Budget:
    budget = db.scalar(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    if budget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, 'Budget not found.')
    return budget


def _ensure_unique(
    db: Session, user_id: int, name: str, month: str, exclude_id: int | None = None
) -> None:
    query = select(Budget.id).where(
        Budget.user_id == user_id,
        func.lower(Budget.name) == name.lower(),
        Budget.month == month,
    )
    if exclude_id is not None:
        query = query.where(Budget.id != exclude_id)
    if db.scalar(query) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE_MESSAGE)


def list_budgets(db: Session, user_id: int, month: str | None = None) -> list[dict]:
    month = month or _current_month()
    budgets = db.scalars(
        select(Budget)
        .where(Budget.user_id == user_id, Budget.month == month)
        .order_by(Budget.created_at.asc(), Budget.id.asc())
    ).all()
    return [_to_response(db, user_id, budget) for budget in budgets]


def create_budget(db: Session, user_id: int, data: BudgetCreate) -> dict:
    month = data.month or _current_month()
    name = data.name.strip()
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, 'Name must not be blank.')
    _ensure_unique(db, user_id, name, month)

    budget = Budget(
        user_id=user_id,
        name=name,
        budget=data.budget,
        icon=data.icon,
        color=data.color.upper(),
        month=month,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _to_response(db, user_id, budget)


def update_budget(
    db: Session, user_id: int, budget_id: int, data: BudgetUpdate
) -> dict:
    budget = _get_owned_budget(db, user_id, budget_id)
    updates = data.model_dump(exclude_unset=True)

    if 'name' in updates:
        updates['name'] = (updates['name'] or '').strip()
        if not updates['name']:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, 'Name must not be blank.'
            )
        _ensure_unique(db, user_id, updates['name'], budget.month, exclude_id=budget.id)
    if updates.get('color'):
        updates['color'] = updates['color'].upper()

    for field, value in updates.items():
        if value is not None:
            setattr(budget, field, value)

    db.commit()
    db.refresh(budget)
    return _to_response(db, user_id, budget)


def delete_budget(db: Session, user_id: int, budget_id: int) -> None:
    budget = _get_owned_budget(db, user_id, budget_id)
    db.delete(budget)
    db.commit()


def get_alerts(db: Session, user_id: int, month: str | None = None) -> list[dict]:
    alerts = []
    for item in list_budgets(db, user_id, month):
        if item['budget'] <= 0:
            continue
        percent = item['spent'] / item['budget'] * Decimal('100')
        if percent >= ALERT_OVERSPENT_PERCENT:
            level, label = 'overspending', 'Overspending'
        elif percent >= ALERT_CRITICAL_PERCENT:
            level, label = 'critical', 'Critical alert'
        elif percent >= ALERT_WARNING_PERCENT:
            level, label = 'warning', 'Warning'
        else:
            continue
        alerts.append(
            {
                'id': item['id'],
                'name': item['name'],
                'level': level,
                'message': f'{label}: {percent:.0f}% of the budget has been used.',
                'percent_used': float(percent),
            }
        )
    return alerts
