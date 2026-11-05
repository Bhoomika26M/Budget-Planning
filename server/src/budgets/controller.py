from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.auth.dependencies import require_premium
from src.budgets.models import BudgetCreate, BudgetResponse, BudgetUpdate, MonthlyBudgetUpdate
from src.budgets.service import (
    budgets_with_spent,
    create_budget,
    delete_budget,
    find_duplicate,
    get_budget,
    parse_month,
    update_budget,
    with_spent,
)
from src.database.core import get_db
from src.entities.user import User
from src.expenses.service import spent_by_category
from src.notifications.service import generate_alerts

# Budget planning is a Premium feature (Students see an upgrade screen).
router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

MONTH_PATTERN = r"^\d{4}-\d{2}$"


def _attach_spent(db: Session, user: User, budget, month: str | None = None):
    year, mon = parse_month(month)
    return with_spent([budget], spent_by_category(db, user.id, year, mon))[0]


@router.get("/", response_model=list[BudgetResponse])
def list_budgets(
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    return budgets_with_spent(db, user.id, month)


@router.get("/monthly")
def get_monthly_budget(user: User = Depends(require_premium)):
    return {"monthly_budget": user.monthly_budget}


@router.put("/monthly")
def set_monthly_budget(
    data: MonthlyBudgetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    user.monthly_budget = data.monthly_budget
    db.commit()
    generate_alerts(db, user)
    return {"monthly_budget": user.monthly_budget}


@router.post("/", response_model=BudgetResponse, status_code=201)
def create_new_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    if find_duplicate(db, user.id, data.category, data.period):
        raise HTTPException(
            status_code=409,
            detail=f"A {data.period} budget for {data.category.strip()} already exists. Edit it instead.",
        )
    budget = create_budget(db, user.id, data)
    generate_alerts(db, user)
    return _attach_spent(db, user, budget)


@router.get("/{budget_id}", response_model=BudgetResponse)
def read_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _attach_spent(db, user, budget)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def edit_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")

    new_category = data.category or budget.category
    new_period = data.period or budget.period
    if find_duplicate(db, user.id, new_category, new_period, exclude_id=budget.id):
        raise HTTPException(status_code=409, detail=f"A budget for {new_category} already exists.")

    updated = update_budget(db, budget, data)
    generate_alerts(db, user)
    return _attach_spent(db, user, updated)


@router.delete("/{budget_id}", status_code=204)
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    budget = get_budget(db, user.id, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    delete_budget(db, budget)
