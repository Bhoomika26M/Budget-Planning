from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database.core import SessionLocal
from .service import get_monthly_summary


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/monthly-summary")
def monthly_summary(
    db: Session = Depends(get_db)
):
    return get_monthly_summary(db)