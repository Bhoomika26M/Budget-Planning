"""
User & Authentication Pydantic Schemas.

Validates input payloads for registration, login, role changes, and token issuance.
"""

from datetime import datetime
from typing import Optional, Literal
import re
from pydantic import BaseModel, Field

# Graceful email validation support (works with or without email-validator package)
try:
    from pydantic import EmailStr
    from pydantic.networks import import_email_validator
    import_email_validator()
except Exception:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    try:
        from pydantic import AfterValidator
        from typing import Annotated
        def _check_email(v: str) -> str:
            if not isinstance(v, str) or not EMAIL_REGEX.match(v.strip()):
                raise ValueError("Invalid email address format")
            return v.strip().lower()
        EmailStr = Annotated[str, AfterValidator(_check_email)]
    except Exception:
        EmailStr = str


class UserBase(BaseModel):
    email: EmailStr
    role: Literal["student", "premium", "admin"] = "student"


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Literal["student", "premium", "admin"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    role: Optional[Literal["student", "premium", "admin"]] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    is_setup_completed: bool
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    is_setup_completed: bool
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

