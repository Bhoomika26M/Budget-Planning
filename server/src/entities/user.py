from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from src.database.core import Base

ROLES = ("student", "premium", "admin")
STATUSES = ("active", "suspended")
PLANS = ("free", "premium", "enterprise")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Role based access: student | premium | admin
    role = Column(String(20), nullable=False, default="student")
    # Account status managed by admins: active | suspended
    status = Column(String(20), nullable=False, default="active")

    # Profile
    university = Column(String(150), nullable=True, default="")
    major = Column(String(150), nullable=True, default="")
    monthly_income = Column(Float, nullable=False, default=0)
    monthly_budget = Column(Float, nullable=False, default=25000)
    currency = Column(String(10), nullable=False, default="INR")

    # Preferences (Settings screen)
    pref_email = Column(Boolean, nullable=False, default=True)
    pref_reports = Column(Boolean, nullable=False, default=True)
    pref_alerts = Column(Boolean, nullable=False, default=True)

    # Subscription
    plan = Column(String(20), nullable=False, default="free")
    plan_since = Column(Date, nullable=True)
    plan_renewal = Column(Date, nullable=True)

    # OAuth2 (Google / GitHub) – provider used to create/link the account
    oauth_provider = Column(String(20), nullable=True)

    # Forgot-password OTP
    reset_otp = Column(String(10), nullable=True)
    reset_otp_expires = Column(DateTime(timezone=True), nullable=True)

    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
