"""
Savings Goals Router.
Create goals, record contributions, track progress.
Student users: max 3 active goals.
"""
from typing import List, Optional, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.savings import SavingsGoal, SavingsContribution
from app.models.user import User
from app.schemas.savings import (
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse,
    SavingsContributionCreate, SavingsContributionResponse
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/savings", tags=["Savings"])

STUDENT_MAX_GOALS = 3


def enrich_goal(goal: SavingsGoal) -> dict:
    remaining = max(goal.target_amount - goal.saved_amount, 0.0)
    pct = (goal.saved_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "title": goal.title,
        "target_amount": goal.target_amount,
        "saved_amount": goal.saved_amount,
        "target_date": goal.target_date,
        "category": goal.category,
        "status": goal.status,
        "created_at": goal.created_at,
        "remaining_amount": round(remaining, 2),
        "completion_percentage": round(pct, 1),
        "contributions": goal.contributions,
    }


@router.get("", response_model=List[SavingsGoalResponse])
def list_goals(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id)
    if status_filter:
        q = q.filter(SavingsGoal.status == status_filter)
    goals = q.order_by(SavingsGoal.created_at.desc()).all()
    return [enrich_goal(g) for g in goals]


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Student role: max 3 active goals
    if current_user.role == "student":
        active_count = db.query(SavingsGoal).filter(
            SavingsGoal.user_id == current_user.id,
            SavingsGoal.status == "in_progress"
        ).count()
        if active_count >= STUDENT_MAX_GOALS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student accounts can have at most {STUDENT_MAX_GOALS} active savings goals. Upgrade to Premium for unlimited goals."
            )

    initial = payload.initial_deposit or 0.0
    goal = SavingsGoal(
        user_id=current_user.id,
        title=payload.title,
        target_amount=payload.target_amount,
        saved_amount=initial,
        target_date=payload.target_date,
        category=payload.category,
        status="in_progress"
    )
    db.add(goal)
    db.flush()

    if initial > 0:
        contrib = SavingsContribution(
            goal_id=goal.id,
            user_id=current_user.id,
            amount=initial,
            date=date.today(),
            notes="Initial deposit"
        )
        db.add(contrib)

    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)


@router.post("/{goal_id}/contribute", response_model=SavingsGoalResponse)
def add_contribution(
    goal_id: int,
    payload: SavingsContributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    if goal.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot contribute to a completed goal")

    contrib = SavingsContribution(
        goal_id=goal.id,
        user_id=current_user.id,
        amount=payload.amount,
        date=payload.date,
        notes=payload.notes
    )
    db.add(contrib)
    goal.saved_amount = round(goal.saved_amount + payload.amount, 2)

    if goal.saved_amount >= goal.target_amount:
        goal.status = "completed"

    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_goal(
    goal_id: int,
    payload: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db.delete(goal)
    db.commit()
