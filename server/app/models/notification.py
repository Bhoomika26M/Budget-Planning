"""
Notification SQLAlchemy ORM Model.

Stores user-specific alerts such as budget thresholds reached (e.g. 80%, 100%),
savings updates, and administrative notifications.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False)  # 'budget_alert', 'expense_alert', 'goal_update', 'system'
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification id={self.id} user_id={self.user_id} title='{self.title}' is_read={self.is_read}>"

