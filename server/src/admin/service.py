from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.admin.entity import Announcement
from src.entities.user import User
from src.expenses.entity import Expense
from src.income.entity import Income
from src.notifications.service import create_notification
from src.savings.entity import SavingsContribution

PLAN_PRICES = {"free": 0, "premium": 299, "enterprise": 999}
ROLE_DEFAULT_PLAN = {"student": "free", "premium": "premium", "admin": "enterprise"}


def list_users(db: Session):
    return db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()


def update_user(db: Session, user: User, changes: dict) -> User:
    today = date.today()

    if "role" in changes and changes["role"] and "plan" not in changes:
        changes["plan"] = ROLE_DEFAULT_PLAN[changes["role"]]

    if changes.get("plan"):
        plan = changes["plan"]
        if plan != user.plan:
            user.plan_since = today if plan != "free" else None
            user.plan_renewal = (today + timedelta(days=365 if plan == "enterprise" else 30)) if plan != "free" else None
        # Keep the role consistent with the plan (admins stay admins).
        if "role" not in changes and user.role != "admin":
            changes["role"] = "student" if plan == "free" else "premium"

    for field, value in changes.items():
        if value is None:
            continue
        if field == "email":
            value = value.strip().lower()
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def send_announcement(db: Session, data) -> Announcement:
    query = db.query(User).filter(User.status == "active")
    if data.audience == "student":
        query = query.filter(User.role == "student")
    elif data.audience == "premium":
        query = query.filter(User.role == "premium")
    users = query.all()

    announcement = Announcement(
        title=data.title.strip(), body=data.body.strip(),
        audience=data.audience, recipients=len(users),
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    for user in users:
        create_notification(
            db, user.id, "info", f"📢 {announcement.title}", announcement.body,
            color="#5FA7D2", key=f"announcement-{announcement.id}",
        )
    return announcement


def _month_end(year: int, month: int) -> datetime:
    nxt = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
    return datetime(nxt.year, nxt.month, nxt.day, tzinfo=timezone.utc)


def _as_utc(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)


def platform_analytics(db: Session, months: int = 7) -> dict:
    users = db.query(User).all()
    today = date.today()

    # Activity = any expense / income / contribution recorded that month
    activity: dict[str, set[int]] = {}
    for model, column in ((Expense, Expense.expense_date), (Income, Income.date), (SavingsContribution, SavingsContribution.date)):
        for user_id, when in db.query(model.user_id, column).all():
            activity.setdefault(when.strftime("%Y-%m"), set()).add(user_id)

    series = []
    for offset in range(months - 1, -1, -1):
        index = today.year * 12 + today.month - 1 - offset
        year, month = index // 12, index % 12 + 1
        end = _month_end(year, month)
        existing = [u for u in users if (_as_utc(u.created_at) or end) < end]
        paid = [u for u in existing if u.plan in ("premium", "enterprise")]
        key = f"{year:04d}-{month:02d}"
        active_ids = activity.get(key, set())
        logged_in = {u.id for u in existing if u.last_login and _as_utc(u.last_login).strftime("%Y-%m") == key}
        series.append({
            "month": date(year, month, 1).strftime("%b"),
            "users": len(existing),
            "active": len(active_ids | logged_in),
            "revenue": sum(PLAN_PRICES.get(u.plan, 0) for u in paid),
        })

    current = series[-1] if series else {"users": 0, "active": 0, "revenue": 0}
    previous = series[-2] if len(series) > 1 else None

    def mom(key):
        if not previous or not previous[key]:
            return None
        return round((current[key] - previous[key]) / previous[key] * 100, 1)

    return {
        "series": series,
        "total_users": len(users),
        "active_users": sum(1 for u in users if u.status == "active"),
        "suspended_users": sum(1 for u in users if u.status == "suspended"),
        "premium_users": sum(1 for u in users if u.role in ("premium", "admin")),
        "monthly_revenue": current["revenue"],
        "revenue_change": mom("revenue"),
        "users_change": mom("users"),
        "new_this_week": sum(
            1 for u in users
            if u.created_at and _as_utc(u.created_at) >= datetime.now(timezone.utc) - timedelta(days=7)
        ),
    }
