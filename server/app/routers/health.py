"""
Health Check Router.

Provides application status and checks active database connectivity.
"""

from typing import Any
from datetime import datetime
from fastapi import APIRouter, Depends
try:
    from sqlalchemy.orm import Session
    from sqlalchemy import text
except ImportError:
    Session = Any
    text = lambda s: s

from app.database import get_db
from app.core.config import settings
from app.schemas.health import HealthCheckResponse

router = APIRouter(prefix="", tags=["Health"])


@router.get("/health", response_model=HealthCheckResponse)
@router.get("/api/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    """
    Performs a live health check verifying:
    - FastAPI engine responsiveness
    - Database connectivity via a lightweight query (SELECT 1)
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
    }

