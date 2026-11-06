"""
SQLAlchemy Models Package.

Exports all ORM entity models for clean imports and Alembic autogenerate metadata.
"""

from app.database import Base
from app.models.user import User
from app.models.profile import UserProfile
from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings import SavingsGoal, SavingsContribution
from app.models.notification import Notification

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "Expense",
    "Income",
    "Budget",
    "SavingsGoal",
    "SavingsContribution",
    "Notification",
]

