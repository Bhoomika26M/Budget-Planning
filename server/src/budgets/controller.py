import re

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.budgets.models import (
    MONTH_PATTERN,
    BudgetAlert,
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
)
from src.budgets.service import (
    create_budget,
    delete_budget,
    get_alerts,
    list_budgets,
    update_budget,
)
from src.entities.user import User

router = APIRouter(prefix='/budgets', tags=['Budgets'])


def _validated_month(month: str | None) -> str | None:
    if month is not None and not re.match(MONTH_PATTERN, month):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, 'month must look like YYYY-MM.'
        )
    return month


@router.get('/', response_model=list[BudgetResponse])
def get_all_budgets(
    month: str | None = Query(default=None, description='YYYY-MM, defaults to this month'),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_budgets(db, user.id, _validated_month(month))


@router.get('/alerts', response_model=list[BudgetAlert])
def get_all_budget_alerts(
    month: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_alerts(db, user.id, _validated_month(month))


@router.post('/', response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def add_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_budget(db, user.id, data)


@router.put('/{budget_id}', response_model=BudgetResponse)
def edit_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return update_budget(db, user.id, budget_id, data)


@router.delete('/{budget_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    delete_budget(db, user.id, budget_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
