import os
import tempfile

import pytest

# Use a throw-away SQLite database for the whole test session.
_tmp_dir = tempfile.mkdtemp(prefix="budgetbuddy-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp_dir, 'test.db')}"
os.environ.setdefault("SEED_DEMO_DATA", "true")

from fastapi.testclient import TestClient  # noqa: E402

from src.main import app  # noqa: E402
from src.rate_limiter import login_limiter, otp_limiter  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    login_limiter.reset()
    otp_limiter.reset()
    yield


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def student_headers(client):
    return login(client, "john.doe@budgetbuddy.in", "budget2025")


@pytest.fixture()
def premium_headers(client):
    return login(client, "premium@budgetbuddy.in", "premium123")


@pytest.fixture()
def admin_headers(client):
    return login(client, "admin@budgetbuddy.in", "admin2026")


@pytest.fixture()
def new_user_headers(client):
    """A brand-new student account with no data."""
    import uuid

    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post("/api/auth/register", json={"name": "Test User", "email": email, "password": "secret123"})
    assert response.status_code == 201, response.text
    return login(client, email, "secret123")
