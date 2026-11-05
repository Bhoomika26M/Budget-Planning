from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from src.database.core import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_notification_user_key"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # alert | reminder | success | info
    type = Column(String(20), nullable=False, default="info")
    title = Column(String(200), nullable=False)
    body = Column(String(500), nullable=False, default="")
    color = Column(String(20), nullable=False, default="#2E93C7")
    read = Column(Boolean, nullable=False, default=False)
    # Optional de-duplication key so automatic alerts are only created once
    key = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
