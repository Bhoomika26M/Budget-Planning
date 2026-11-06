"""
Savings Goals & Contributions SQLAlchemy ORM Models.

Enables tracking of specific targets (e.g. Laptop, Emergency Fund, College Fees)
and incremental deposits made toward those goals.
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, default=0.0, nullable=False)
    target_date = Column(Date, nullable=True)
    category = Column(String(50), nullable=True)
    status = Column(String(20), default="in_progress", nullable=False)  # in_progress, completed, archived
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="savings_goals")
    contributions = relationship("SavingsContribution", back_populates="goal", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SavingsGoal id={self.id} title='{self.title}' target={self.target_amount} saved={self.saved_amount}>"


class SavingsContribution(Base):
    __tablename__ = "savings_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    goal = relationship("SavingsGoal", back_populates="contributions")
    user = relationship("User", back_populates="savings_contributions")

    def __repr__(self):
        return f"<SavingsContribution id={self.id} goal_id={self.goal_id} amount={self.amount}>"

