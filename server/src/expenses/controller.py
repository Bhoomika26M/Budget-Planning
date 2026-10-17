
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.service import SECRET_KEY, ALGORITHM
from src.database.core import get_db
from src.entities.user import User
from src.expenses.models import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from src.expenses.service import (
    create_expense, list_expenses, find_expense,
    update_expense, delete_expense, expense_summary,
)

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])
security = HTTPBearer()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/", response_model=ExpenseResponse, status_code=201)
def add_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return create_expense(db, user.id, data)


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return list_expenses(db, user.id)


@router.get("/summary")
def get_expense_summary(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return expense_summary(db, user.id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_one_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def edit_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return update_expense(db, expense, data)


@router.delete("/{expense_id}", status_code=204)
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    expense = find_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    delete_expense(db, expense)
