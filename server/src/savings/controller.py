from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user, require_premium
from src.database.core import get_db
from src.entities.user import User
from src.savings.models import (
    ContributionCreate,
    ContributionResponse,
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)
from src.savings.service import (
    add_contribution,
    create_goal,
    delete_goal,
    find_goal,
    list_all_contributions,
    list_contributions,
    list_goals,
    update_goal,
)

router = APIRouter(prefix="/api/savings", tags=["Savings"])


@router.post("/", response_model=SavingsGoalResponse, status_code=201)
def create_savings_goal(
    data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if data.saved > data.target:
        raise HTTPException(
            status_code=400,
            detail="Saved amount cannot exceed the target when creating a goal.",
        )
    return create_goal(db, user.id, data)


@router.get("/", response_model=list[SavingsGoalResponse])
def get_savings_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_goals(db, user.id)


# Declared before "/{goal_id}" so "contributions" is not parsed as an id.
@router.get("/contributions", response_model=list[ContributionResponse])
def get_all_contributions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_all_contributions(db, user.id)


@router.get("/{goal_id}", response_model=SavingsGoalResponse)
def get_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = find_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found.")
    return goal


@router.patch("/{goal_id}", response_model=SavingsGoalResponse)
def edit_savings_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = find_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    try:
        return update_goal(db, goal, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{goal_id}", status_code=204)
def remove_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    goal = find_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found.")
    delete_goal(db, goal)


@router.post(
    "/{goal_id}/contributions",
    response_model=ContributionResponse,
    status_code=201,
)
def create_savings_contribution(
    goal_id: int,
    data: ContributionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = find_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    try:
        return add_contribution(db, goal, user.id, data)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the contribution. Please try again.",
        )


@router.get(
    "/{goal_id}/contributions",
    response_model=list[ContributionResponse],
)
def get_savings_contributions(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = find_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    return list_contributions(db, goal.id, user.id)
