from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from src.database.core import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    body = Column(String(1000), nullable=False)
    audience = Column(String(20), nullable=False, default="all")  # all | student | premium
    recipients = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
