"""
Income SQLAlchemy ORM Model.

Tracks incoming funds across multiple sources (Salary, Scholarship, Freelancing, etc.).
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)  # Salary, Pocket Money, Scholarship, Freelancing, Business, Other Income
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, default=date.today, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="incomes")

    def __repr__(self):
        return f"<Income id={self.id} user_id={self.user_id} source='{self.source}' amount={self.amount}>"

