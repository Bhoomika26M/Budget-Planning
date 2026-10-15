from fastapi import (
    APIRouter,
    Depends,
    Response,
    status,
)
from sqlalchemy.orm import Session

from src.budgets.models import (
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
from src.database.core import get_db


router = APIRouter(
    prefix='/budgets',
    tags=['Budgets'],
)


@router.get(
    '',
    response_model=list[BudgetResponse],
)
def get_all_budgets(
    db: Session = Depends(get_db),
):
    return list_budgets(db)


@router.get(
    '/alerts',
    response_model=list[BudgetAlert],
)
def get_all_budget_alerts(
    db: Session = Depends(get_db),
):
    return get_alerts(db)


@router.post(
    '',
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
):
    return create_budget(db, data)


@router.put(
    '/{budget_id}',
    response_model=BudgetResponse,
)
def edit_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
):
    return update_budget(
        db,
        budget_id,
        data,
    )


@router.delete(
    '/{budget_id}',
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
):
    delete_budget(
        db,
        budget_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )