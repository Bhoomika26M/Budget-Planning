
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from src.database.core import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    expense_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
