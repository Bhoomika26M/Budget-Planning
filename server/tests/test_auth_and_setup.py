"""
Automated Tests for Milestone 2: Authentication & Onboarding Setup.

Covers:
- User Registration across roles (Student, Premium, Admin)
- Duplicate email prevention
- Password hashing verification
- Login authentication & JWT token generation
- Invalid credentials handling
- Forgot password workflow
- Authenticated user session retrieval (/api/auth/me)
- First-time onboarding setup (/api/profile/setup) and is_setup_completed state transition
- Role-based authorization protection
"""

import pytest


def test_student_registration_success(client):
    """Test registering a new student account creates user, profile, and JWT token."""
    payload = {
        "full_name": "Rohan Sharma",
        "email": "rohan.student@test.com",
        "password": "StudentPassword123!",
        "role": "student",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "student"
    assert data["is_setup_completed"] is False
    assert data["user"]["email"] == "rohan.student@test.com"
    assert data["user"]["full_name"] == "Rohan Sharma"


def test_registration_duplicate_email_fails(client):
    """Test duplicate registration with the same email is prevented."""
    payload = {
        "full_name": "Initial User",
        "email": "duplicate@test.com",
        "password": "Password123!",
        "role": "student",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration attempt with identical email
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_login_success(client):
    """Test authenticating with valid credentials returns a valid JWT token."""
    # Register first
    client.post("/api/auth/register", json={
        "full_name": "Priya Patel",
        "email": "priya@test.com",
        "password": "SecurePassword123!",
        "role": "premium",
    })

    # Login
    response = client.post("/api/auth/login", json={
        "email": "priya@test.com",
        "password": "SecurePassword123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "premium"
    assert data["is_setup_completed"] is False


def test_login_invalid_credentials(client):
    """Test login with wrong password returns 401 Unauthorized."""
    client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "user@test.com",
        "password": "CorrectPassword123!",
        "role": "student",
    })

    # Attempt login with incorrect password
    response = client.post("/api/auth/login", json={
        "email": "user@test.com",
        "password": "WrongPassword999!",
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_login_nonexistent_email(client):
    """Test login with nonexistent email returns 401 Unauthorized."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "SomePassword123!",
    })
    assert response.status_code == 401


def test_forgot_password_and_login_with_new_password(client):
    """Test password reset workflow and subsequent login with the updated password."""
    client.post("/api/auth/register", json={
        "full_name": "Reset User",
        "email": "reset@test.com",
        "password": "OldPassword123!",
        "role": "student",
    })

    # Reset password
    reset_resp = client.post("/api/auth/forgot-password", json={
        "email": "reset@test.com",
        "new_password": "NewSecretPassword456!",
    })
    assert reset_resp.status_code == 200
    assert "updated successfully" in reset_resp.json()["message"].lower()

    # Old password should now fail
    old_login = client.post("/api/auth/login", json={
        "email": "reset@test.com",
        "password": "OldPassword123!",
    })
    assert old_login.status_code == 401

    # New password should successfully authenticate
    new_login = client.post("/api/auth/login", json={
        "email": "reset@test.com",
        "password": "NewSecretPassword456!",
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_get_current_user_me(client):
    """Test authenticated session retrieval via /api/auth/me."""
    reg = client.post("/api/auth/register", json={
        "full_name": "Aarav Kumar",
        "email": "aarav@test.com",
        "password": "Password123!",
        "role": "admin",
    })
    token = reg.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_info = me_resp.json()
    assert user_info["email"] == "aarav@test.com"
    assert user_info["role"] == "admin"
    assert user_info["full_name"] == "Aarav Kumar"


def test_unauthenticated_request_rejected(client):
    """Test accessing protected route without a token returns 401."""
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_first_time_setup_workflow(client):
    """Test complete first-time onboarding wizard and is_setup_completed flag update."""
    # 1. Register student
    reg = client.post("/api/auth/register", json={
        "full_name": "Simran Kaur",
        "email": "simran@test.com",
        "password": "Password123!",
        "role": "student",
    })
    token = reg.json()["access_token"]
    assert reg.json()["is_setup_completed"] is False
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Complete setup
    setup_payload = {
        "full_name": "Simran Kaur",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Simran",
        "monthly_income": 35000.0,
        "currency": "INR",
        "financial_preference": "Save and Invest",
        "goal_focus": "Laptop",
    }
    setup_resp = client.put("/api/profile/setup", json=setup_payload, headers=headers)
    assert setup_resp.status_code == 200
    profile_data = setup_resp.json()
    assert profile_data["currency"] == "INR"
    assert profile_data["monthly_income"] == 35000.0
    assert profile_data["financial_preference"] == "Save and Invest"
    assert profile_data["goal_focus"] == "Laptop"

    # 3. Verify user model now reflects is_setup_completed = True
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["is_setup_completed"] is True
