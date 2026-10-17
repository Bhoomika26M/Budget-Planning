from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.dashboard.transaction_model import Transaction
from src.entities.user import User

router = APIRouter(prefix='/dashboard', tags=['Dashboard'])


class TransactionCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    type: Literal['income', 'expense']
    description: str = Field(min_length=1, max_length=255)
    amount: float
    date: date
    category: str = Field(min_length=1, max_length=100)
    account: str = Field(default='Checking', min_length=1, max_length=100)


def _serialize_transaction(transaction: Transaction) -> dict:
    return {
        'id': transaction.id,
        'type': transaction.type,
        'description': transaction.description,
        'amount': transaction.amount,
        'date': str(transaction.date),
        'category': transaction.category,
        'account': transaction.account,
    }


@router.post('/transactions', status_code=201)
def add_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    new_transaction = Transaction(
        user_id=user.id,
        type=transaction.type,
        description=transaction.description.strip(),
        amount=transaction.amount,
        date=transaction.date,
        category=transaction.category.strip(),
        account=transaction.account.strip(),
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return {
        'message': 'Transaction added successfully',
        'transaction': _serialize_transaction(new_transaction),
    }


@router.get('/transactions')
def get_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .all()
    )
    return [_serialize_transaction(transaction) for transaction in transactions]
