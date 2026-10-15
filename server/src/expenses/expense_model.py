from datetime import date as Date

from sqlalchemy import Float, String, Date as SQLDate
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[Date] = mapped_column(SQLDate, nullable=False)
    note: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="Card", nullable=False)
