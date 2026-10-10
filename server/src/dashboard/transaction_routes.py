from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.core import SessionLocal
from .transaction_model import Transaction


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


class TransactionCreate(BaseModel):
    type: str
    description: str
    amount: float
    date: date
    category: str
    account: str = "Checking"


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/transactions")
def add_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    new_transaction = Transaction(
        type=transaction.type,
        description=transaction.description,
        amount=transaction.amount,
        date=transaction.date,
        category=transaction.category,
        account=transaction.account,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "message": "Transaction added successfully",
        "transaction": {
            "id": new_transaction.id,
            "type": new_transaction.type,
            "description": new_transaction.description,
            "amount": new_transaction.amount,
            "date": str(new_transaction.date),
            "category": new_transaction.category,
            "account": new_transaction.account,
        },
    }
@router.get("/transactions")
def get_transactions(
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .all()
    )

    return [
        {
            "id": transaction.id,
            "type": transaction.type,
            "description": transaction.description,
            "amount": transaction.amount,
            "date": str(transaction.date),
            "category": transaction.category,
            "account": transaction.account,
        }
        for transaction in transactions
    ]