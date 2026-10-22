
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.service import SECRET_KEY, ALGORITHM
from src.database.core import get_db
from src.entities.user import User
from src.budgets.models import BudgetCreate, BudgetUpdate, BudgetResponse
from src.budgets.service import (
    create_budget,
    get_budgets,
    get_budget,
    update_budget,
    delete_budget,
)

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.post("/", response_model=BudgetResponse, status_code=201)
def create_new_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_budget(db, user.id, data)


@router.get("/", response_model=list[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_budgets(db, user.id)


@router.get("/{budget_id}", response_model=BudgetResponse)
def read_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.patch("/{budget_id}", response_model=BudgetResponse)
def edit_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return update_budget(db, budget, data)


@router.delete("/{budget_id}", status_code=204)
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    delete_budget(db, budget)
