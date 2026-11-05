from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.admin.entity import Announcement
from src.admin.models import (
    AdminUserResponse,
    AdminUserUpdate,
    AnnouncementCreate,
    AnnouncementResponse,
    CategoryName,
    LogResponse,
)
from src.admin.service import list_users, platform_analytics, send_announcement, update_user
from src.auth.dependencies import require_admin
from src.auth.service import find_user_by_email
from src.categories.entity import Category
from src.categories.models import CategoryResponse
from src.categories.service import create_category, delete_category, find_by_name, list_categories, rename_category
from src.database.core import get_db
from src.entities.user import User
from src.logs.service import list_logs, log_event
from src.support.entity import Feedback, Issue
from src.support.models import FeedbackResponse, FeedbackUpdate, IssueResponse, IssueUpdate
from src.support.service import list_feedback, list_issues
from src.users.service import delete_user_data

# Every endpoint here requires the Admin role.
router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


def _get_or_404(db: Session, model, item_id: int, label: str):
    item = db.query(model).filter(model.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail=f"{label} not found.")
    return item


# ── Users & subscriptions ──────────────────────────────────────────

@router.get("/users", response_model=list[AdminUserResponse])
def admin_list_users(db: Session = Depends(get_db)):
    return list_users(db)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = _get_or_404(db, User, user_id, "User")
    changes = data.model_dump(exclude_unset=True)

    if user.id == admin.id:
        if changes.get("status") == "suspended":
            raise HTTPException(status_code=400, detail="You cannot suspend your own account.")
        if changes.get("role") and changes["role"] != "admin":
            raise HTTPException(status_code=400, detail="You cannot remove your own admin role.")

    if changes.get("email"):
        other = find_user_by_email(db, changes["email"])
        if other and other.id != user.id:
            raise HTTPException(status_code=409, detail="Another account already uses this email.")

    updated = update_user(db, user, changes)
    log_event(db, f"Admin {admin.email} updated {updated.email}: {', '.join(f'{k}={v}' for k, v in changes.items())}")
    return updated


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = _get_or_404(db, User, user_id, "User")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account here.")
    email = user.email
    delete_user_data(db, user)
    log_event(db, f"Admin {admin.email} removed user {email}", "warn")


@router.get("/analytics")
def admin_analytics(db: Session = Depends(get_db)):
    return platform_analytics(db)


# ── Categories ─────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryResponse])
def admin_categories(db: Session = Depends(get_db)):
    return list_categories(db)


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def admin_add_category(data: CategoryName, db: Session = Depends(get_db)):
    if find_by_name(db, data.name):
        raise HTTPException(status_code=409, detail="Category already exists.")
    category = create_category(db, data.name)
    log_event(db, f"Expense category '{category.name}' added")
    return category


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def admin_rename_category(category_id: int, data: CategoryName, db: Session = Depends(get_db)):
    category = _get_or_404(db, Category, category_id, "Category")
    other = find_by_name(db, data.name)
    if other and other.id != category.id:
        raise HTTPException(status_code=409, detail="Category already exists.")
    return rename_category(db, category, data.name)


@router.delete("/categories/{category_id}", status_code=204)
def admin_delete_category(category_id: int, db: Session = Depends(get_db)):
    category = _get_or_404(db, Category, category_id, "Category")
    log_event(db, f"Expense category '{category.name}' deleted")
    delete_category(db, category)


# ── System logs ────────────────────────────────────────────────────

@router.get("/logs", response_model=list[LogResponse])
def admin_logs(level: str = "all", db: Session = Depends(get_db)):
    return list_logs(db, level)


# ── Announcements ──────────────────────────────────────────────────

@router.get("/announcements", response_model=list[AnnouncementResponse])
def admin_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc(), Announcement.id.desc()).all()


@router.post("/announcements", response_model=AnnouncementResponse, status_code=201)
def admin_send_announcement(data: AnnouncementCreate, db: Session = Depends(get_db)):
    announcement = send_announcement(db, data)
    log_event(db, f"Announcement '{announcement.title}' sent to {announcement.recipients} users")
    return announcement


@router.delete("/announcements/{announcement_id}", status_code=204)
def admin_delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    item = _get_or_404(db, Announcement, announcement_id, "Announcement")
    db.delete(item)
    db.commit()


# ── Feedback & reported issues ─────────────────────────────────────

@router.get("/feedback", response_model=list[FeedbackResponse])
def admin_feedback(db: Session = Depends(get_db)):
    return list_feedback(db)


@router.patch("/feedback/{item_id}", response_model=FeedbackResponse)
def admin_update_feedback(item_id: int, data: FeedbackUpdate, db: Session = Depends(get_db)):
    item = _get_or_404(db, Feedback, item_id, "Feedback")
    item.status = data.status
    db.commit()
    db.refresh(item)
    return item


@router.delete("/feedback/{item_id}", status_code=204)
def admin_delete_feedback(item_id: int, db: Session = Depends(get_db)):
    item = _get_or_404(db, Feedback, item_id, "Feedback")
    db.delete(item)
    db.commit()


@router.get("/issues", response_model=list[IssueResponse])
def admin_issues(db: Session = Depends(get_db)):
    return list_issues(db)


@router.patch("/issues/{item_id}", response_model=IssueResponse)
def admin_update_issue(item_id: int, data: IssueUpdate, db: Session = Depends(get_db)):
    item = _get_or_404(db, Issue, item_id, "Issue")
    item.status = data.status
    db.commit()
    db.refresh(item)
    return item


@router.delete("/issues/{item_id}", status_code=204)
def admin_delete_issue(item_id: int, db: Session = Depends(get_db)):
    item = _get_or_404(db, Issue, item_id, "Issue")
    db.delete(item)
    db.commit()
