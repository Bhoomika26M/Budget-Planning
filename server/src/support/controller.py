from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.database.core import get_db
from src.entities.user import User
from src.logs.service import log_event
from src.support.models import FeedbackCreate, FeedbackResponse, IssueCreate, IssueResponse
from src.support.service import create_feedback, create_issue

router = APIRouter(prefix="/api/support", tags=["Support"])


@router.post("/feedback", response_model=FeedbackResponse, status_code=201)
def send_feedback(data: FeedbackCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = create_feedback(db, user, data)
    log_event(db, f"Feedback ({data.type}) received from {user.email}")
    return item


@router.post("/issues", response_model=IssueResponse, status_code=201)
def report_issue(data: IssueCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = create_issue(db, user, data)
    log_event(db, f"Issue reported by {user.email} ({data.severity})", "warn" if data.severity == "high" else "info")
    return item
