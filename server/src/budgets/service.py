from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.budgets.models import (
    BudgetCreate,
    BudgetUpdate,
)
from src.entities.budget import Budget


ALERT_WARNING_PERCENT = Decimal('70')
ALERT_CRITICAL_PERCENT = Decimal('90')


def list_budgets(
    db: Session,
) -> list[Budget]:
    return list(
        db.scalars(
            select(Budget).order_by(
                Budget.created_at.asc()
            )
        ).all()
    )


def create_budget(
    db: Session,
    data: BudgetCreate,
) -> Budget:

    month = (
        data.month
        or datetime.now().strftime('%Y-%m')
    )

    duplicate = db.scalar(
        select(Budget).where(
            Budget.name == data.name,
            Budget.month == month,
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                'A budget category with this name '
                'already exists for this month.'
            ),
        )

    budget = Budget(
        name=data.name,
        budget=data.budget,
        spent=Decimal('0.00'),
        icon=data.icon,
        color=data.color.upper(),
        month=month,
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


def update_budget(
    db: Session,
    budget_id: int,
    data: BudgetUpdate,
) -> Budget:

    budget = db.get(Budget, budget_id)

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Budget not found.',
        )

    updates = data.model_dump(
        exclude_unset=True
    )

    if 'name' in updates:
        target_month = updates.get(
            'month',
            budget.month,
        )

        duplicate = db.scalar(
            select(Budget).where(
                Budget.name == updates['name'],
                Budget.month == target_month,
                Budget.id != budget_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    'A budget category with this name '
                    'already exists for this month.'
                ),
            )

    for field, value in updates.items():

        if field == 'color' and value:
            value = value.upper()

        setattr(
            budget,
            field,
            value,
        )

    db.commit()
    db.refresh(budget)

    return budget


def delete_budget(
    db: Session,
    budget_id: int,
) -> None:

    budget = db.get(
        Budget,
        budget_id,
    )

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Budget not found.',
        )

    db.delete(budget)
    db.commit()


def get_alerts(
    db: Session,
) -> list[dict]:

    budgets = list_budgets(db)
    alerts = []

    for budget in budgets:

        if budget.budget <= 0:
            continue

        percent = (
            budget.spent
            / budget.budget
        ) * Decimal('100')

        if percent >= Decimal('100'):

            alerts.append({
                'id': budget.id,
                'name': budget.name,
                'level': 'overspending',
                'message': (
                    f'Overspending: '
                    f'{percent:.0f}% of the budget '
                    f'has been used.'
                ),
                'percent_used': float(percent),
            })

        elif percent >= ALERT_CRITICAL_PERCENT:

            alerts.append({
                'id': budget.id,
                'name': budget.name,
                'level': 'critical',
                'message': (
                    f'Critical alert: '
                    f'{percent:.0f}% of the budget '
                    f'has been used.'
                ),
                'percent_used': float(percent),
            })

        elif percent >= ALERT_WARNING_PERCENT:

            alerts.append({
                'id': budget.id,
                'name': budget.name,
                'level': 'warning',
                'message': (
                    f'Warning: '
                    f'{percent:.0f}% of the budget '
                    f'has been used.'
                ),
                'percent_used': float(percent),
            })

    return alerts