"""
Health Check Pydantic Schemas.
"""

from pydantic import BaseModel
from typing import Optional


class HealthCheckResponse(BaseModel):
    status: str = "ok"
    app_name: str
    version: str
    environment: str
    database: str
    timestamp: str

    class Config:
        from_attributes = True

