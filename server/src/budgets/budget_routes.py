import re
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.dashboard.transaction_model import Transaction
from src.entities.user import User
from .budget_model import Budget

router = APIRouter(prefix="/budgets", tags=["Budgets"])
COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


class BudgetPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    budget: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    icon: str = Field(default="📦", min_length=1, max_length=8)
    color: str = Field(default="#4F93A0", pattern=r"^#[0-9a-fA-F]{6}$")

    @field_validator("name", "icon")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank")
        return value

    @field_validator("color")
    @classmethod
    def normalize_color(cls, value: str) -> str:
        if not COLOR_PATTERN.fullmatch(value):
            raise ValueError("Color must be a six-digit hex value")
        return value.upper()


def month_bounds(today: date) -> tuple[date, date]:
    start = today.replace(day=1)
    next_month = (
        start.replace(year=start.year + 1, month=1)
        if start.month == 12
        else start.replace(month=start.month + 1)
    )
    return start, next_month


def monthly_spend(db: Session, user_id: int) -> dict[str, float]:
    start, next_month = month_bounds(date.today())
    rows = (
        db.query(Transaction.category, func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= start,
            Transaction.date < next_month,
        )
        .group_by(Transaction.category)
        .all()
    )
    return {category: float(total or 0) for category, total in rows}


def serialize_budget(budget: Budget, spent: float) -> dict:
    return {
        "id": budget.id,
        "name": budget.name,
        "budget": float(budget.budget),
        "spent": spent,
        "icon": budget.icon,
        "color": budget.color,
    }


def list_budgets(db: Session, user: User) -> list[dict]:
    spent_by_category = monthly_spend(db, user.id)
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user.id)
        .order_by(Budget.name, Budget.id)
        .all()
    )
    return [
        serialize_budget(budget, spent_by_category.get(budget.name, 0.0))
        for budget in budgets
    ]


def get_owned_budget(db: Session, user: User, budget_id: int) -> Budget:
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == user.id)
        .first()
    )
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


def ensure_unique_name(
    db: Session,
    user_id: int,
    name: str,
    budget_id: int | None = None,
) -> None:
    query = db.query(Budget).filter(Budget.user_id == user_id, Budget.name == name)
    if budget_id is not None:
        query = query.filter(Budget.id != budget_id)
    if query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this category already exists",
        )


@router.get("")
@router.get("/", include_in_schema=False)
def get_budgets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_budgets(db, user)


@router.get("/alerts")
def get_budget_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budgets = list_budgets(db, user)
    alerts = []
    for budget in budgets:
        ratio = budget["spent"] / budget["budget"]
        if ratio >= 0.8:
            percentage = round(ratio * 100)
            message = (
                f"You have exceeded your monthly limit by {percentage - 100}%."
                if ratio > 1
                else f"You have used {percentage}% of your monthly limit."
            )
            alerts.append(
                {
                    "id": budget["id"],
                    "name": budget["name"],
                    "message": message,
                }
            )
    return alerts


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_budget(
    payload: BudgetPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ensure_unique_name(db, user.id, payload.name)
    budget = Budget(
        user_id=user.id,
        name=payload.name,
        budget=payload.budget,
        icon=payload.icon,
        color=payload.color,
    )
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this category already exists",
        ) from None
    db.refresh(budget)
    return serialize_budget(budget, monthly_spend(db, user.id).get(budget.name, 0.0))


@router.put("/{budget_id}")
def update_budget(
    budget_id: int,
    payload: BudgetPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = get_owned_budget(db, user, budget_id)
    ensure_unique_name(db, user.id, payload.name, budget.id)
    budget.name = payload.name
    budget.budget = payload.budget
    budget.icon = payload.icon
    budget.color = payload.color
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this category already exists",
        ) from None
    db.refresh(budget)
    return serialize_budget(budget, monthly_spend(db, user.id).get(budget.name, 0.0))


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = get_owned_budget(db, user, budget_id)
    db.delete(budget)
    db.commit()
    return None
