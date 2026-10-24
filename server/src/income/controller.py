from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.service import SECRET_KEY, ALGORITHM
from src.database.core import get_db
from src.entities.user import User
from src.income.models import IncomeCreate, IncomeUpdate, IncomeResponse
from src.income.service import (
    create_income,
    list_income,
    find_income,
    update_income,
    delete_income,
)

router = APIRouter(prefix="/api/income", tags=["Income"])
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


@router.post("/", response_model=IncomeResponse, status_code=201)
def add_income(
    data: IncomeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_income(db, user.id, data)


@router.get("/", response_model=list[IncomeResponse])
def get_income(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_income(db, user.id)


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
    user: User = Depends(get_current_user),
):
    income = find_income(db, user.id, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income entry not found")
    delete_income(db, income)