from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from src.database.core import Base

DEFAULT_CATEGORIES = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Miscellaneous"]


class Category(Base):
    """Expense categories offered to every user (managed by admins)."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
