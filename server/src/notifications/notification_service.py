"""Notification generation and state management.

Notifications are derived from the authenticated user's real records
(transactions, income and their saved preferences). Nothing is hardcoded or
seeded: when a user has no activity, no notifications are produced. Generated
items are upserted by a deterministic ``dedupe_key`` so repeat requests never
duplicate them, and read/dismissed state is persisted on the row.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.dashboard.transaction_model import Transaction
from src.entities.income import Income
from src.settings.settings_model import UserSettings
from src.notifications.notification_model import Notification

LARGE_EXPENSE_RATIO = Decimal('0.25')


def _settings_for(db: Session, user_id: int) -> UserSettings | None:
    return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()


def _money(value: Decimal | float) -> str:
    return f"{Decimal(str(value)):,.2f}"


def _month_bounds(today: date) -> tuple[date, date]:
    start = today.replace(day=1)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _serialize(notification: Notification) -> dict:
    return {
        'id': notification.id,
        'type': notification.type,
        'title': notification.title,
        'message': notification.message,
        'created_at': notification.created_at,
        'is_read': notification.read_at is not None,
        'read_at': notification.read_at,
    }


def generate_notifications(db: Session, user_id: int) -> None:
    """Create any notification records implied by the user's current data."""
    today = date.today()
    month_start, month_end = _month_bounds(today)
    month_label = month_start.strftime('%B %Y')

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= month_start,
            Transaction.date < month_end,
        )
        .all()
    )
    income_records = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            Income.date >= month_start,
            Income.date < month_end,
        )
        .all()
    )

    month_income = sum(
        (Decimal(str(item.amount)) for item in transactions if item.type == 'income'),
        Decimal('0'),
    ) + sum((Decimal(str(item.amount)) for item in income_records), Decimal('0'))
    month_expenses = sum(
        (abs(Decimal(str(item.amount))) for item in transactions if item.type == 'expense'),
        Decimal('0'),
    )

    settings = _settings_for(db, user_id)
    budget_alerts = settings.budget_alerts if settings is not None else True
    monthly_report = settings.monthly_report if settings is not None else True

    candidates: list[dict] = []

    if budget_alerts and month_income > 0:
        threshold = month_income * LARGE_EXPENSE_RATIO
        for item in transactions:
            amount = abs(Decimal(str(item.amount)))
            if item.type == 'expense' and amount >= threshold:
                candidates.append({
                    'dedupe_key': f'large-expense-{item.id}',
                    'type': 'budget_alert',
                    'title': 'Large expense recorded',
                    'message': (
                        f"{item.description} for {_money(amount)} is at least "
                        f"25% of your {month_label} income."
                    ),
                })

    if budget_alerts and month_income > 0 and month_expenses > month_income:
        candidates.append({
            'dedupe_key': f'overspend-{month_start.isoformat()}',
            'type': 'budget_alert',
            'title': 'Spending exceeded income',
            'message': (
                f"In {month_label} you spent {_money(month_expenses)} against "
                f"{_money(month_income)} of income."
            ),
        })

    if monthly_report and (transactions or income_records):
        savings = month_income - month_expenses
        candidates.append({
            'dedupe_key': f'monthly-summary-{month_start.isoformat()}',
            'type': 'report',
            'title': f'Your {month_label} summary is ready',
            'message': (
                f"Income {_money(month_income)}, expenses {_money(month_expenses)}, "
                f"net {_money(savings)}."
            ),
        })

    if not candidates:
        return

    existing_keys = {
        key
        for (key,) in db.query(Notification.dedupe_key)
        .filter(Notification.user_id == user_id)
        .all()
    }
    created = False
    for candidate in candidates:
        if candidate['dedupe_key'] in existing_keys:
            continue
        db.add(Notification(user_id=user_id, **candidate))
        created = True
    if created:
        try:
            db.commit()
        except IntegrityError:
            # A concurrent request inserted the same dedupe keys first. The
            # unique (user_id, dedupe_key) index is the source of truth, so
            # discard this session's pending inserts instead of failing.
            db.rollback()


def list_notifications(db: Session, user_id: int) -> list[dict]:
    generate_notifications(db, user_id)
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.dismissed_at.is_(None),
        )
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .all()
    )
    return [_serialize(item) for item in notifications]


def unread_count(db: Session, user_id: int) -> int:
    generate_notifications(db, user_id)
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.dismissed_at.is_(None),
            Notification.read_at.is_(None),
        )
        .count()
    )


def _get_owned(db: Session, user_id: int, notification_id: int) -> Notification | None:
    return (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )


def mark_read(db: Session, user_id: int, notification_id: int) -> dict | None:
    notification = _get_owned(db, user_id, notification_id)
    if notification is None or notification.dismissed_at is not None:
        return None
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return _serialize(notification)


def mark_unread(db: Session, user_id: int, notification_id: int) -> dict | None:
    notification = _get_owned(db, user_id, notification_id)
    if notification is None or notification.dismissed_at is not None:
        return None
    if notification.read_at is not None:
        notification.read_at = None
        db.commit()
        db.refresh(notification)
    return _serialize(notification)


def dismiss(db: Session, user_id: int, notification_id: int) -> bool:
    notification = _get_owned(db, user_id, notification_id)
    if notification is None or notification.dismissed_at is not None:
        return False
    notification.dismissed_at = datetime.now(timezone.utc)
    db.commit()
    return True
