
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from src.database.core import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    email_notifications: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    push_notifications: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    budget_alerts: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    bill_reminders: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    weekly_report: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    monthly_report: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    dark_mode: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    currency: Mapped[str] = mapped_column(
        String(3), default="INR", nullable=False
    )
    language: Mapped[str] = mapped_column(
        String(30), default="English", nullable=False
    )
