from datetime import date as Date

from sqlalchemy import String, Float, Date
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    date: Mapped[Date] = mapped_column(
        Date,
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    account: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Checking"
    )