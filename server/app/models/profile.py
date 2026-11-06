"""
UserProfile SQLAlchemy ORM Model.

Stores personal preferences, currency, monthly income, and financial focus.
Directly linked one-to-one with a User record.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    monthly_income = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)  # 'INR', 'USD', 'EUR', 'GBP'
    financial_preference = Column(
        String(100),
        default="Save and Invest",
        nullable=False
    )  # 'Save and Invest', 'Control Spending', 'Manage Debt', 'Build Emergency Fund'
    goal_focus = Column(String(100), default="Emergency Fund", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile user_id={self.user_id} full_name='{self.full_name}' currency='{self.currency}'>"

