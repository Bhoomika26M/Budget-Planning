from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.analytics.service import get_analytics_overview, get_insights
from src.auth.dependencies import get_current_user, require_premium
from src.database.core import get_db
from src.entities.user import User

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def analytics_overview(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    months: int = Query(default=7, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Charts + headline numbers. Available to every role (dashboard uses it);
    the full Analytics screen is limited to Premium in the UI."""
    return get_analytics_overview(db, current_user.id, month=month, months=months)


@router.get("/insights")
def analytics_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
):
    return get_insights(db, current_user.id)
