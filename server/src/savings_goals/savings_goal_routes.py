from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.entities.user import User
from .savings_goal_model import SavingsGoal

router = APIRouter(prefix="/savings-goals", tags=["Savings goals"])


class SavingsGoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    target_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    saved_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    target_date: date

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Goal name must not be blank")
        return value


class SavingsGoalProgress(BaseModel):
    model_config = ConfigDict(extra="forbid")

    saved_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


def serialize_goal(goal: SavingsGoal) -> dict:
    return {
        "id": goal.id,
        "name": goal.name,
        "target_amount": float(goal.target_amount),
        "saved_amount": float(goal.saved_amount),
        "target_date": goal.target_date.isoformat(),
        "created_at": goal.created_at.isoformat() if goal.created_at else None,
    }


def list_goals(db: Session, user: User) -> list[dict]:
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user.id)
        .order_by(SavingsGoal.target_date, SavingsGoal.id)
        .all()
    )
    return [serialize_goal(goal) for goal in goals]


@router.get("")
@router.get("/", include_in_schema=False)
def get_savings_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_goals(db, user)


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_savings_goal(
    goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if goal.saved_amount > goal.target_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="saved_amount cannot exceed target_amount",
        )

    new_goal = SavingsGoal(
        user_id=user.id,
        name=goal.name,
        target_amount=goal.target_amount,
        saved_amount=goal.saved_amount,
        target_date=goal.target_date,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return serialize_goal(new_goal)


@router.patch("/{goal_id}")
def update_savings_goal_progress(
    goal_id: int,
    progress: SavingsGoalProgress,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id)
        .first()
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    if progress.saved_amount > goal.target_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="saved_amount cannot exceed target_amount",
        )

    goal.saved_amount = progress.saved_amount
    db.commit()
    db.refresh(goal)
    return serialize_goal(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id)
        .first()
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db.delete(goal)
    db.commit()
    return None
