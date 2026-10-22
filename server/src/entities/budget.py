from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Budget(Base):
    """A monthly spending limit for one category, owned by one user.

    The amount already spent is NOT stored here: it is calculated from the
    user's expense transactions (see budgets/service.py), so the budget page
    always agrees with the Dashboard.
    """

    __tablename__ = 'budgets'
    __table_args__ = (
        UniqueConstraint('user_id', 'name', 'month', name='uq_budget_user_name_month'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    icon: Mapped[str] = mapped_column(String(8), nullable=False, default='📦')
    color: Mapped[str] = mapped_column(String(7), nullable=False, default='#4F93A0')
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # "YYYY-MM"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
