from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.entities.user import User
from src.income.service import (
    create_income,
    create_income_source,
    delete_income,
    delete_income_source,
    get_user_income,
    get_user_income_sources,
)

router = APIRouter(prefix='/income', tags=['Income'])


class IncomeCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    description: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    date: date
    category: str = Field(min_length=1, max_length=100)


class IncomeSourceCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=50)


@router.post('/', status_code=status.HTTP_201_CREATED)
def add_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_income(
        db=db,
        user_id=user.id,
        description=income.description.strip(),
        amount=income.amount,
        date=income.date,
        category=income.category.strip(),
    )


@router.get('/')
def fetch_income(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_user_income(db, user.id)


@router.post('/sources', status_code=status.HTTP_201_CREATED)
def add_income_source(
    source: IncomeSourceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_income_source(
        db=db,
        user_id=user.id,
        name=source.name.strip(),
        amount=source.amount,
        category=source.category.strip(),
        frequency=source.frequency.strip(),
    )


@router.get('/sources')
def fetch_income_sources(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_user_income_sources(db, user.id)


@router.delete('/sources/{source_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_income_source(
    source_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    source = delete_income_source(db, user.id, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail='Income source not found')
    return None


@router.delete('/{income_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_income(
    income_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    income = delete_income(db, user.id, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail='Income not found')
    return None
