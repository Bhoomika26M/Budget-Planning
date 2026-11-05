from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from src.auth.dependencies import require_premium
from src.database.core import get_db
from src.entities.user import User
from src.logs.service import log_event
from src.reports.service import build_report, export_csv, export_xlsx

# Reports & exports are Premium features.
router = APIRouter(prefix="/api/reports", tags=["Reports"])

MONTH_PATTERN = r"^\d{4}-\d{2}$"


@router.get("/summary")
def report_summary(
    period: Literal["monthly", "yearly"] = "monthly",
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    return build_report(db, user.id, period, month)


@router.get("/export")
def report_export(
    format: Literal["csv", "xlsx"] = "csv",
    period: Literal["monthly", "yearly"] = "monthly",
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    db: Session = Depends(get_db),
    user: User = Depends(require_premium),
):
    report = build_report(db, user.id, period, month)
    stem = f"BudgetBuddy_{report['label'].replace(' ', '')}_{'Monthly' if period == 'monthly' else 'Annual'}_Report"

    if format == "xlsx":
        content = export_xlsx(report)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        content = export_csv(report)
        media_type = "text/csv; charset=utf-8"

    log_event(db, f"User {user.email} exported {format.upper()} report ({report['label']})")
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{stem}.{format}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
