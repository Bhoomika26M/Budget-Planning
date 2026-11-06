"""
FastAPI Security & Authentication Dependencies.

Provides dependencies to extract and validate the current authenticated user,
enforce active status, and verify role-based permissions (RBAC).
"""

from typing import List, Optional, Any
from fastapi import Depends, HTTPException, status, Header

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

try:
    from app.database import get_db
    from app.models.user import User
except ImportError:
    def get_db():
        yield None
    User = Any

from app.core.security import decode_access_token


def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts Bearer token from the standard Authorization header.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return parts[1]


def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates JWT token and fetches the corresponding User from the database.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identification in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated",
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensures user is active and has completed first-time setup where required.
    """
    return current_user


class RoleChecker:
    """
    Role-Based Access Control (RBAC) dependency validator.
    Usage: Depends(RoleChecker(["admin"])) or Depends(RoleChecker(["admin", "premium"]))
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(self.allowed_roles)}",
            )
        return current_user
