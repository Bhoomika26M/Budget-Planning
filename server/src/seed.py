"""Demo data so the app is usable straight after `uvicorn src.main:app`.

Creates the three demo accounts shown on the login screen (only if they do
not exist yet) with ~6 months of realistic student finances, dated relative
to today so the dashboard always has current data.

Disable with SEED_DEMO_DATA=false. Run manually with `python -m src.seed`.
"""

import os
import random
from datetime import date, datetime, timedelta, timezone
from calendar import monthrange

from sqlalchemy.orm import Session

from src.admin.entity import Announcement
from src.auth.service import hash_password
from src.budgets.entity import Budget
from src.categories.service import ensure_default_categories
from src.entities.user import User
from src.expenses.entity import Expense
from src.income.entity import Income
from src.logs.entity import SystemLog
from src.notifications.entity import Notification
from src.savings.entity import SavingsContribution, SavingsGoal
from src.support.entity import Feedback, Issue

DEMO_ACCOUNTS = [
    {"name": "John Doe", "email": "john.doe@budgetbuddy.in", "password": "budget2025", "role": "student",
     "plan": "free", "university": "Delhi University", "major": "BTech Computer Science"},
    {"name": "Alex Premium", "email": "premium@budgetbuddy.in", "password": "premium123", "role": "premium",
     "plan": "premium", "university": "IIT Bombay", "major": "BTech Electrical Engineering"},
    {"name": "Admin User", "email": "admin@budgetbuddy.in", "password": "admin2026", "role": "admin",
     "plan": "enterprise", "university": "BudgetBuddy HQ", "major": "Platform Administration"},
]

EXPENSE_TEMPLATES = [
    ("Zomato Order", "Food", 250, 450),
    ("Canteen Lunch", "Food", 80, 160),
    ("Burger King", "Food", 300, 520),
    ("Grocery Run", "Food", 400, 900),
    ("Metro Card Recharge", "Travel", 300, 500),
    ("Ola Cab", "Travel", 150, 380),
    ("Bus Pass", "Travel", 200, 400),
    ("Amazon Purchase", "Shopping", 500, 1600),
    ("Myntra Order", "Shopping", 600, 1400),
    ("Udemy Course", "Education", 399, 899),
    ("Stationery", "Education", 100, 300),
    ("Netflix Subscription", "Entertainment", 199, 199),
    ("Movie Tickets", "Entertainment", 250, 600),
    ("Gym Membership", "Miscellaneous", 650, 650),
    ("Mobile Recharge", "Miscellaneous", 239, 299),
]

# Current month expenses taken from the Figma prototype
CURRENT_MONTH_EXPENSES = [
    ("Zomato Order", "Food", 320, 0, "Completed"),
    ("Metro Card Recharge", "Travel", 500, 1, "Completed"),
    ("Amazon Purchase", "Shopping", 1240, 2, "Completed"),
    ("Udemy Course", "Education", 799, 3, "Completed"),
    ("Netflix Subscription", "Entertainment", 199, 4, "Completed"),
    ("Gym Membership", "Miscellaneous", 650, 5, "Completed"),
    ("Burger King", "Food", 420, 6, "Completed"),
    ("Ola Cab", "Travel", 280, 7, "Pending"),
    ("Grocery Run", "Food", 860, 8, "Completed"),
    ("Movie Tickets", "Entertainment", 540, 9, "Completed"),
]

BUDGETS = [
    ("Food", 4000, "#2E93C7"),
    ("Travel", 2000, "#0D6D91"),
    ("Shopping", 3000, "#5FA7D2"),
    ("Education", 2500, "#8DBEE3"),
    ("Entertainment", 1000, "#164A72"),
    ("Miscellaneous", 1500, "#B9D2E7"),
]


def _month_start(today: date, months_back: int) -> date:
    index = today.year * 12 + today.month - 1 - months_back
    return date(index // 12, index % 12 + 1, 1)


def _day(month_start: date, day: int, today: date) -> date:
    last = monthrange(month_start.year, month_start.month)[1]
    d = month_start.replace(day=min(day, last))
    return min(d, today)


def _end_of_month(today: date, months_ahead: int) -> date:
    start = _month_start(today, -months_ahead)
    return start.replace(day=monthrange(start.year, start.month)[1])


def _seed_finances(db: Session, user: User, rng: random.Random, today: date):
    # Income – last 6 months
    for back in range(5, -1, -1):
        start = _month_start(today, back)
        # Dates are clamped to today, so the current month is never empty.
        entries = [
            ("Pocket Money", 8000, 1, "Monthly"),
            ("Part-time Job", 2000, 10, "Monthly"),
            ("Scholarship", 3000, 15, "Monthly"),
        ]
        if back % 2 == 0:
            entries.append(("Freelance", rng.choice([3500, 4500, 6000]), 20, "One-time"))
        for source, amount, day, freq in entries:
            db.add(Income(user_id=user.id, title=source, category=source, amount=amount,
                          date=_day(start, day, today), frequency=freq))

    # Expenses – previous 5 months (random but repeatable)
    for back in range(5, 0, -1):
        start = _month_start(today, back)
        for _ in range(rng.randint(12, 16)):
            desc, cat, lo, hi = rng.choice(EXPENSE_TEMPLATES)
            amount = lo if lo == hi else rng.randrange(lo, hi + 1, 10)
            db.add(Expense(user_id=user.id, description=desc, category=cat, amount=amount,
                           expense_date=_day(start, rng.randint(1, 28), today), status="Completed"))

    # Expenses – current month (spread over the days so far)
    start = _month_start(today, 0)
    for desc, cat, amount, offset, status in CURRENT_MONTH_EXPENSES:
        when = today - timedelta(days=offset * max(today.day - 1, 0) // 10)
        db.add(Expense(user_id=user.id, description=desc, category=cat, amount=amount,
                       expense_date=max(when, start), status=status))

    # Category budgets
    for cat, amount, color in BUDGETS:
        db.add(Budget(user_id=user.id, category=cat, amount=amount, period="monthly", color=color))

    # Savings goals + contributions
    goals = [
        SavingsGoal(user_id=user.id, name="Laptop Fund", emoji="💻", target=80000, saved=52000,
                    deadline=_end_of_month(today, 2), color="#2E93C7",
                    note="One step closer to your dream setup!"),
        SavingsGoal(user_id=user.id, name="Japan Trip", emoji="✈️", target=150000, saved=48000,
                    deadline=_end_of_month(today, 13), color="#0D6D91",
                    note="The world is waiting — keep saving!"),
        SavingsGoal(user_id=user.id, name="Emergency Fund", emoji="🛡️", target=50000, saved=37000,
                    deadline=_end_of_month(today, 6), color="#5FA7D2",
                    note="Security is the greatest investment."),
        SavingsGoal(user_id=user.id, name="Trip to Thailand", emoji="🏖️", target=100000, saved=100000,
                    deadline=_end_of_month(today, -2), color="#22c55e", completed=True,
                    note="Adventure awaits — and you made it happen!"),
    ]
    db.add_all(goals)
    db.flush()

    contributions = [
        (0, 100, 0), (1, 250, 1), (2, 500, 5), (0, 1500, 9), (1, 3000, 11), (2, 2000, 14),
        (0, 2500, 19), (1, 5000, 24), (2, 1000, 31), (0, 3000, 39), (1, 4000, 44), (2, 2500, 49),
    ]
    for goal_index, amount, days_ago in contributions:
        db.add(SavingsContribution(user_id=user.id, goal_id=goals[goal_index].id, amount=amount,
                                   date=today - timedelta(days=days_ago)))

    db.add(Notification(user_id=user.id, type="info", title="Welcome to BudgetBuddy! 👋",
                        body="Track expenses, plan budgets and reach your savings goals — all in one place.",
                        color="#5FA7D2", read=True, key="welcome"))


def _seed_admin_content(db: Session, users: dict[str, User]):
    if db.query(Feedback.id).first() is None:
        john, alex = users.get("john.doe@budgetbuddy.in"), users.get("premium@budgetbuddy.in")
        for u, kind, msg, status in [
            (john, "suggestion", "Would love a dark mode for the mobile app too!", "open"),
            (alex, "bug", "CSV export sometimes downloads an empty file.", "open"),
            (john, "praise", "The savings goal tracker is incredibly motivating!", "resolved"),
            (alex, "suggestion", "Add recurring expense support.", "open"),
        ]:
            if u:
                db.add(Feedback(user_id=u.id, user_name=u.name, user_email=u.email, type=kind, message=msg, status=status))
        for u, text, severity, status in [
            (john, "App crashes on logout from notifications page", "high", "open"),
            (alex, "PDF report shows wrong month in filename", "low", "in-progress"),
            (john, "Savings goal progress bar overflows at 100%", "medium", "resolved"),
        ]:
            if u:
                db.add(Issue(user_id=u.id, user_name=u.name, user_email=u.email, issue=text, severity=severity, status=status))

    if db.query(Announcement.id).first() is None:
        db.add(Announcement(title="New Premium Features", body="AI Insights and advanced analytics are now live!",
                            audience="all", recipients=len(users)))

    if db.query(SystemLog.id).first() is None:
        now = datetime.now(timezone.utc)
        for hours, level, msg in [
            (72, "info", "System backup completed successfully"),
            (60, "info", "New account created: premium@budgetbuddy.in"),
            (30, "warn", "Failed login attempt for unknown@mail.com"),
            (20, "error", "Storage quota warning: 87% used"),
            (2, "info", "Demo data loaded"),
        ]:
            db.add(SystemLog(level=level, message=msg, created_at=now - timedelta(hours=hours)))


def seed_demo_data(db: Session, force: bool = False):
    if not force and os.getenv("SEED_DEMO_DATA", "true").lower() in ("0", "false", "no"):
        return

    ensure_default_categories(db)
    today = date.today()
    users: dict[str, User] = {}

    for index, account in enumerate(DEMO_ACCOUNTS):
        user = db.query(User).filter(User.email == account["email"]).first()
        if user is not None:
            users[user.email] = user
            continue

        user = User(
            name=account["name"],
            email=account["email"],
            hashed_password=hash_password(account["password"]),
            role=account["role"],
            plan=account["plan"],
            plan_since=_month_start(today, 8) if account["plan"] != "free" else None,
            plan_renewal=_end_of_month(today, 1) if account["plan"] != "free" else None,
            university=account["university"],
            major=account["major"],
            monthly_income=13000,
            monthly_budget=25000,
            created_at=datetime.now(timezone.utc) - timedelta(days=240 - index * 30),
        )
        db.add(user)
        db.flush()
        users[user.email] = user

        if account["role"] != "admin":
            _seed_finances(db, user, random.Random(42 + index), today)

    _seed_admin_content(db, users)
    db.commit()


if __name__ == "__main__":
    from src.main import app  # noqa: F401  (creates tables)
    from src.database.core import SessionLocal

    with SessionLocal() as session:
        seed_demo_data(session, force=True)
    print("Demo data ready.")
