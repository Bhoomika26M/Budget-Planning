import logging

from sqlalchemy.orm import Session

from src.logs.entity import SystemLog

logger = logging.getLogger("budgetbuddy")


def log_event(db: Session, message: str, level: str = "info", commit: bool = True):
    """Write an entry to the admin "System Logs" screen (and the console)."""
    level = level if level in ("info", "warn", "error") else "info"
    getattr(logger, "warning" if level == "warn" else level)(message)

    try:
        db.add(SystemLog(level=level, message=message[:500]))
        if commit:
            db.commit()
    except Exception:  # logging must never break the request
        db.rollback()


def list_logs(db: Session, level: str | None = None, limit: int = 200):
    query = db.query(SystemLog)
    if level and level != "all":
        query = query.filter(SystemLog.level == level)
    return query.order_by(SystemLog.created_at.desc(), SystemLog.id.desc()).limit(limit).all()
