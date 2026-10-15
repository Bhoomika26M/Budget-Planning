from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


class Budget(Base):
    __tablename__ = 'budgets'

    __table_args__ = (
        UniqueConstraint(
            'name',
            'month',
            name='uq_budget_name_month',
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    budget: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    spent: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal('0.00'),
    )

    icon: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default='📦',
    )

    color: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        default='#4F93A0',
    )

    month: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )