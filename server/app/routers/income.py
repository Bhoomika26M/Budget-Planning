"""
Income Management Router.
Full CRUD for income records. Data isolated per user.
"""
from typing import List, Optional, Any
from datetime import date, datetime
from calendar import monthrange
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, extract, desc

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database import get_db
from app.models.income import Income
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse, IncomeSummary
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/income", tags=["Income"])


@router.get("/summary", response_model=dict)
def get_income_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns this month's total, salary total, other sources total, and growth vs last month."""
    today = date.today()
    this_year, this_month = today.year, today.month

    # Last month
    if this_month == 1:
        last_year, last_month = this_year - 1, 12
    else:
        last_year, last_month = this_year, this_month - 1

    this_month_total = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        extract('year', Income.date) == this_year,
        extract('month', Income.date) == this_month
    ).scalar() or 0.0

    total_amount = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id
    ).scalar() or 0.0

    record_count = db.query(func.count(Income.id)).filter(
        Income.user_id == current_user.id
    ).scalar() or 0

    last_month_total = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        extract('year', Income.date) == last_year,
        extract('month', Income.date) == last_month
    ).scalar() or 0.0

    salary_total = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        extract('year', Income.date) == this_year,
        extract('month', Income.date) == this_month,
        Income.source == "Salary"
    ).scalar() or 0.0

    other_total = this_month_total - salary_total

    growth_pct = 0.0
    if last_month_total > 0:
        growth_pct = round(((this_month_total - last_month_total) / last_month_total) * 100, 1)

    # Source breakdown
    rows = db.query(Income.source, func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        extract('year', Income.date) == this_year,
        extract('month', Income.date) == this_month
    ).group_by(Income.source).all()
    source_totals = {r[0]: r[1] for r in rows}

    return {
        "total_amount": total_amount,
        "count": record_count,
        "this_month_total": this_month_total,
        "last_month_total": last_month_total,
        "salary_total": salary_total,
        "other_sources_total": other_total,
        "growth_percentage": growth_pct,
        "source_totals": source_totals,
    }


@router.get("/trend", response_model=List[dict])
def get_income_trend(
    months: int = Query(6, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns monthly income totals for the last N months."""
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        total = db.query(func.sum(Income.amount)).filter(
            Income.user_id == current_user.id,
            extract('year', Income.date) == y,
            extract('month', Income.date) == m
        ).scalar() or 0.0
        result.append({
            "month": f"{y}-{m:02d}",
            "label": date(y, m, 1).strftime("%b"),
            "total": total
        })
    return result


@router.get("", response_model=List[IncomeResponse])
def list_income(
    source: Optional[str] = Query(None),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Income).filter(Income.user_id == current_user.id)
    if source:
        q = q.filter(Income.source == source)
    if month:
        try:
            y, m = map(int, month.split("-"))
            q = q.filter(extract('year', Income.date) == y, extract('month', Income.date) == m)
        except Exception:
            pass
    if search:
        search_pattern = f"%{search.strip()}%"
        q = q.filter(
            (Income.source.ilike(search_pattern)) |
            (Income.description.ilike(search_pattern))
        )
    if start_date:
        q = q.filter(Income.date >= start_date)
    if end_date:
        q = q.filter(Income.date <= end_date)
    return q.order_by(desc(Income.date)).offset(skip).limit(limit).all()


@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    payload: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = Income(
        user_id=current_user.id,
        source=payload.source,
        amount=payload.amount,
        date=payload.date,
        description=payload.description
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Income record not found")
    return record


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    payload: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Income record not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Income record not found")
    db.delete(record)
    db.commit()
