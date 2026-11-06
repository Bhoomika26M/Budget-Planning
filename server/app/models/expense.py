"""
Expense SQLAlchemy ORM Model.

Tracks expense transactions categorized by type and payment method.
Tied strictly to the creating user for data privacy.
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Food, Transportation, Education, Shopping, Entertainment, Healthcare, Bills, Others
    date = Column(Date, nullable=False, default=date.today, index=True)
    payment_method = Column(String(50), default="Cash", nullable=False)  # Cash, Debit Card, Credit Card, UPI / Online, Bank Transfer
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="expenses")

    def __repr__(self):
        return f"<Expense id={self.id} user_id={self.user_id} title='{self.title}' amount={self.amount}>"

