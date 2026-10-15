from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.core import SessionLocal
from src.income.service import (
    create_income,
    get_user_income,
    delete_income,
    create_income_source,
    get_user_income_sources,
    delete_income_source,
)


router = APIRouter(prefix="/income", tags=["Income"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IncomeCreate(BaseModel):
    user_id: int
    description: str
    amount: float
    date: date
    category: str
    
class IncomeSourceCreate(BaseModel):
    user_id: int
    name: str
    amount: float
    category: str
    frequency: str

@router.post("/")
def add_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
):
    return create_income(
        db=db,
        user_id=income.user_id,
        description=income.description,
        amount=income.amount,
        date=income.date,
        category=income.category,
    )


@router.get("/{user_id}")
def fetch_income(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_user_income(db, user_id)


@router.delete("/{income_id}")
def remove_income(
    income_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    income = delete_income(db, user_id, income_id)

    if income is None:
        raise HTTPException(
            status_code=404,
            detail="Income not found",
        )
@router.post("/sources")
def add_income_source(
    source: IncomeSourceCreate,
    db: Session = Depends(get_db),
):
    return create_income_source(
        db=db,
        user_id=source.user_id,
        name=source.name,
        amount=source.amount,
        category=source.category,
        frequency=source.frequency,
    )


@router.get("/sources/{user_id}")
def fetch_income_sources(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_user_income_sources(db, user_id)


@router.delete("/sources/{source_id}")
def remove_income_source(
    source_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    source = delete_income_source(
        db,
        user_id,
        source_id,
    )

    if source is None:
        raise HTTPException(
            status_code=404,
            detail="Income source not found",
        )

    return {"message": "Income source deleted successfully"}

    return {"message": "Income deleted successfully"}