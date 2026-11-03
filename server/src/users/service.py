from datetime import date, timedelta

from sqlalchemy.orm import Session

from src.auth.service import find_user_by_email, hash_password, verify_password
from src.budgets.entity import Budget
from src.entities.user import User
from src.expenses.entity import Expense
from src.income.entity import Income
from src.notifications.entity import Notification
from src.savings.entity import SavingsContribution, SavingsGoal


class EmailTakenError(ValueError):
    pass


def update_profile(db: Session, user: User, data) -> User:
    changes = data.model_dump(exclude_unset=True)

    if "email" in changes and changes["email"]:
        new_email = changes["email"].strip().lower()
        other = find_user_by_email(db, new_email)
        if other and other.id != user.id:
            raise EmailTakenError("Another account already uses this email address.")
        changes["email"] = new_email

    for field, value in changes.items():
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
    if not verify_password(current_password, user.hashed_password):
        return False
    user.hashed_password = hash_password(new_password)
    db.commit()
    return True


def upgrade_to_premium(db: Session, user: User) -> User:
    today = date.today()
    if user.role == "student":
        user.role = "premium"
    if user.plan == "free":
        user.plan = "premium"
    user.plan_since = user.plan_since or today
    user.plan_renewal = today + timedelta(days=30)
    db.commit()
    db.refresh(user)
    return user


def delete_user_data(db: Session, user: User):
    """Delete the user and everything that belongs to them."""
    for model in (SavingsContribution, SavingsGoal, Expense, Income, Budget, Notification):
        db.query(model).filter(model.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()


def activity_summary(db: Session, user: User) -> dict:
    return {
        "member_since": user.created_at,
        "last_login": user.last_login,
        "expenses": db.query(Expense).filter(Expense.user_id == user.id).count(),
        "income_entries": db.query(Income).filter(Income.user_id == user.id).count(),
        "goals": db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).count(),
    }
