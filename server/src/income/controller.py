from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user, require_premium
from src.database.core import get_db
from src.entities.user import User
from src.income.models import IncomeCreate, IncomeResponse, IncomeUpdate
from src.income.service import (
    create_income,
    delete_income,
    find_income,
    list_income,
    update_income,
)

router = APIRouter(prefix="/api/income", tags=["Income"])


@router.post("/", response_model=IncomeResponse, status_code=201)
def add_income(
    data: IncomeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_income(db, user.id, data)


@router.get("/", response_model=list[IncomeResponse])
def get_income(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_income(db, user.id, month=month)


@router.patch("/{income_id}", response_model=IncomeResponse)
def edit_income(
    income_id: int,
    data: IncomeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    income = find_income(db, user.id, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income entry not found")
    return update_income(db, income, data)


@router.delete("/{income_id}", status_code=204)
def remove_income(
    income_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    income = find_income(db, user.id, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income entry not found")
    delete_income(db, income)
