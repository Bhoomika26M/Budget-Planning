from datetime import datetime, timedelta, timezone

from src.auth.service import create_access_token, hash_password, otp_is_valid, verify_password
from src.entities.user import User


def test_password_hash_roundtrip():
    hashed = hash_password("budget2025")
    assert hashed != "budget2025"
    assert verify_password("budget2025", hashed)
    assert not verify_password("wrong", hashed)


def test_verify_password_handles_garbage_hash():
    assert verify_password("x", "not-a-hash") is False


def test_access_token_is_string():
    assert isinstance(create_access_token(1), str)


def test_otp_validation_and_expiry():
    user = User(reset_otp="123456", reset_otp_expires=datetime.now(timezone.utc) + timedelta(minutes=5))
    assert otp_is_valid(user, "123456")
    assert not otp_is_valid(user, "654321")
    user.reset_otp_expires = datetime.now(timezone.utc) - timedelta(minutes=1)
    assert not otp_is_valid(user, "123456")
