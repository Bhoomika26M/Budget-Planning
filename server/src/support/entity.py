from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from src.database.core import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(100), nullable=False)
    user_email = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False, default="suggestion")  # suggestion | bug | praise
    message = Column(String(1000), nullable=False)
    status = Column(String(20), nullable=False, default="open")  # open | resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(100), nullable=False)
    user_email = Column(String(255), nullable=False)
    issue = Column(String(1000), nullable=False)
    severity = Column(String(10), nullable=False, default="medium")  # low | medium | high
    status = Column(String(20), nullable=False, default="open")  # open | in-progress | resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
