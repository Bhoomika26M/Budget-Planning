"""
Routers package.
"""

from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router

__all__ = ["health_router", "auth_router", "profile_router"]
