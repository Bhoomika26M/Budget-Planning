"""Shared FastAPI dependencies for authentication and role-based access.

Every router imports `get_current_user` (and `require_roles` where a feature
is limited to some roles) from here instead of re-implementing JWT decoding.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.auth.service import ALGORITHM, SECRET_KEY
from src.database.core import get_db
from src.entities.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (JWTError, ValueError, TypeError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    return user


def require_roles(*roles: str):
    """Dependency factory: allow the request only for the given roles."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            pretty = " or ".join(r.capitalize() for r in roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires a {pretty} account.",
            )
        return user

    return checker


require_premium = require_roles("premium", "admin")
require_admin = require_roles("admin")
