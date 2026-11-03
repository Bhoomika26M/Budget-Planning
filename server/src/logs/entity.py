from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from src.database.core import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(10), nullable=False, default="info")  # info | warn | error
    message = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
