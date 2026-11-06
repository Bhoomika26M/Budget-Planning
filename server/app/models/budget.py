"""
Budget SQLAlchemy ORM Model.

Stores user-defined spending limits per month (overall or per category).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # Format 'YYYY-MM'
    category = Column(String(50), default="Overall", nullable=False, index=True)
    amount_limit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "month", "category", name="uq_user_month_category"),
    )

    user = relationship("User", back_populates="budgets")

    def __repr__(self):
        return f"<Budget id={self.id} user_id={self.user_id} month='{self.month}' category='{self.category}' limit={self.amount_limit}>"

