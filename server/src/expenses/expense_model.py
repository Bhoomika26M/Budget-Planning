from datetime import date as Date

from sqlalchemy import Date as SQLDate, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_user_id", "user_id"),
        Index("uq_expenses_transaction_id", "transaction_id", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    transaction_id: Mapped[int | None] = mapped_column(
        ForeignKey("transactions.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[Date] = mapped_column(SQLDate, nullable=False)
    note: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="Card", nullable=False)
