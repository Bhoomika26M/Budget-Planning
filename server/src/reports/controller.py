from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from src.auth.security import get_current_user, get_db
from src.entities.user import User

from . import exports
from .service import TRANSACTION_REPORTS, get_monthly_summary, get_report_table


router = APIRouter(prefix="/reports", tags=["Reports"])

NOT_CONNECTED = {
    "budget-analysis": "Budget Analysis is not connected to the budgets data yet.",
    "savings-progress": "Savings Progress is not connected to the savings goals data yet.",
}


def _table_for(kind: str, db: Session, user: User) -> dict:
    if kind in TRANSACTION_REPORTS:
        return get_report_table(db, user.id, kind)
    if kind in NOT_CONNECTED:
        raise HTTPException(status_code=501, detail=NOT_CONNECTED[kind])
    raise HTTPException(status_code=404, detail="Unknown report.")


@router.get("/monthly-summary")
def monthly_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_monthly_summary(db, user.id)


@router.get("/data/{kind}")
def report_data(
    kind: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _table_for(kind, db, user)


@router.get("/export/{fmt}")
def export_report(
    fmt: str,
    report: str = "monthly-summary",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    table = _table_for(report, db, user)

    try:
        if fmt == "csv":
            content, media, extension = exports.to_csv(table), "text/csv", "csv"
        elif fmt == "excel":
            content = exports.to_excel(table)
            media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            extension = "xlsx"
        elif fmt == "pdf":
            content, media, extension = exports.to_pdf(table), "application/pdf", "pdf"
        else:
            raise HTTPException(status_code=404, detail="Unknown export format.")
    except ImportError as error:
        raise HTTPException(
            status_code=501,
            detail="Export library missing on the server. Run: pip install -r requirements.txt",
        ) from error

    return Response(
        content=content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{report}.{extension}"'},
    )