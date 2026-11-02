
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.service import SECRET_KEY, ALGORITHM
from src.database.core import get_db
from src.entities.user import User
from src.savings.models import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    ContributionCreate,
    ContributionResponse,
)
from src.savings.service import (
    create_goal,
    list_goals,
    find_goal,
    update_goal,
    delete_goal,
    add_contribution,
    list_contributions,
)

router = APIRouter(prefix="/api/savings", tags=["Savings"])
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
    except (JWTError, ValueError, TypeError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


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

    changes = data.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is not None:
        if not changes["name"].strip():
            raise HTTPException(status_code=400, detail="Goal name cannot be empty.")

    try:
        return update_goal(db, goal, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{goal_id}", status_code=204)
def remove_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
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
