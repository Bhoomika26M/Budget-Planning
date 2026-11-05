import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.entities.user import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-this-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
OTP_EXPIRE_MINUTES = 10

# pbkdf2_sha256 is pure-python (no native bcrypt build issues on Windows);
# bcrypt hashes created by older versions of the app still verify.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def find_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email.strip().lower()).first()


def register_user(db: Session, name: str, email: str, password: str, role: str = "student"):
    if find_user_by_email(db, email):
        return None

    user = User(
        name=name.strip(),
        email=email.strip().lower(),
        hashed_password=hash_password(password),
        role=role,
        plan="enterprise" if role == "admin" else "premium" if role == "premium" else "free",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db: Session, email: str, password: str):
    user = find_user_by_email(db, email)

    if not user or not verify_password(password, user.hashed_password):
        return None

    return user


def mark_login(db: Session, user: User):
    user.last_login = datetime.now(timezone.utc)
    db.commit()


# ── Forgot password (OTP) ──────────────────────────────────────────

def create_reset_otp(db: Session, user: User) -> str:
    otp = f"{secrets.randbelow(900000) + 100000}"
    user.reset_otp = otp
    user.reset_otp_expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    db.commit()
    return otp


def otp_is_valid(user: User, otp: str) -> bool:
    if not user or not user.reset_otp or not user.reset_otp_expires:
        return False

    expires = user.reset_otp_expires
    if expires.tzinfo is None:  # SQLite returns naive datetimes
        expires = expires.replace(tzinfo=timezone.utc)

    return secrets.compare_digest(user.reset_otp, otp.strip()) and expires > datetime.now(timezone.utc)


def reset_password(db: Session, user: User, new_password: str):
    user.hashed_password = hash_password(new_password)
    user.reset_otp = None
    user.reset_otp_expires = None
    db.commit()
