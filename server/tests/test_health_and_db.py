"""
Backend Unit and Integration Tests for Milestone 1.

Verifies:
1. Health check endpoint and DB connectivity.
2. Root API greeting and docs link.
3. Password hashing security (no plain text).
4. SQLAlchemy ORM models: User, UserProfile, Expense, Income, Budget, SavingsGoal.
5. Foreign key cascading and user-level data isolation.
"""

from datetime import date
from app.core.security import get_password_hash, verify_password
from app.models import (
    User,
    UserProfile,
    Expense,
    Income,
    Budget,
    SavingsGoal,
    SavingsContribution,
    Notification,
)


def test_root_endpoint(client):
    """Test that root endpoint returns operational greeting."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "/docs" in data["documentation"]


def test_health_check_endpoint(client):
    """Test that health check endpoint returns 200 and connected DB status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["app_name"] == "BudgetBuddy API"


def test_password_hashing():
    """Verify that passwords are securely hashed and plain text is never stored."""
    raw_password = "SuperSecurePassword123!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert len(hashed) > 20
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword456!", hashed) is False


def test_create_user_and_profile_models(db_session):
    """Test user and profile creation with database persistence."""
    hashed_pw = get_password_hash("password123")
    user = User(
        email="student@budgetbuddy.test",
        hashed_password=hashed_pw,
        role="student",
        is_active=True,
        is_setup_completed=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.role == "student"

    # Create associated profile
    profile = UserProfile(
        user_id=user.id,
        full_name="Alex Student",
        monthly_income=25000.0,
        currency="INR",
        financial_preference="Save and Invest",
        goal_focus="Emergency Fund",
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    assert profile.id is not None
    assert profile.user_id == user.id
    assert user.profile.full_name == "Alex Student"


def test_expense_and_income_models(db_session):
    """Test recording expense and income tied to a user."""
    user = User(
        email="test_finance@budgetbuddy.test",
        hashed_password=get_password_hash("pass123"),
        role="student",
    )
    db_session.add(user)
    db_session.commit()

    # Add Income
    income = Income(
        user_id=user.id,
        source="Pocket Money",
        amount=5000.0,
        date=date.today(),
        description="Monthly allowance",
    )
    # Add Expense
    expense = Expense(
        user_id=user.id,
        title="Textbooks",
        amount=1200.0,
        category="Education",
        date=date.today(),
        payment_method="UPI / Online",
        description="Computer Science reference books",
    )
    db_session.add_all([income, expense])
    db_session.commit()

    # Query back and verify
    incomes = db_session.query(Income).filter_by(user_id=user.id).all()
    expenses = db_session.query(Expense).filter_by(user_id=user.id).all()

    assert len(incomes) == 1
    assert incomes[0].amount == 5000.0
    assert len(expenses) == 1
    assert expenses[0].title == "Textbooks"


def test_budget_and_savings_models(db_session):
    """Test monthly budget and savings goal with contributions."""
    user = User(
        email="saver@budgetbuddy.test",
        hashed_password=get_password_hash("pass123"),
        role="premium",
    )
    db_session.add(user)
    db_session.commit()

    # Budget
    budget = Budget(
        user_id=user.id,
        month="2026-11",
        category="Overall",
        amount_limit=30000.0,
    )
    # Savings Goal
    goal = SavingsGoal(
        user_id=user.id,
        title="New Laptop",
        target_amount=60000.0,
        saved_amount=15000.0,
    )
    db_session.add_all([budget, goal])
    db_session.commit()

    # Contribution towards goal
    contrib = SavingsContribution(
        goal_id=goal.id,
        user_id=user.id,
        amount=5000.0,
        notes="Saved from freelancing",
    )
    db_session.add(contrib)
    db_session.commit()

    assert goal.id is not None
    assert len(goal.contributions) == 1
    assert goal.contributions[0].amount == 5000.0


def test_cascade_deletion(db_session):
    """Verify that deleting a user safely cascades to delete all their records."""
    user = User(
        email="delete_me@budgetbuddy.test",
        hashed_password=get_password_hash("pass123"),
        role="student",
    )
    db_session.add(user)
    db_session.commit()

    notification = Notification(
        user_id=user.id,
        title="Welcome!",
        message="Account created successfully",
        type="info",
    )
    db_session.add(notification)
    db_session.commit()

    user_id = user.id
    assert db_session.query(Notification).filter_by(user_id=user_id).count() == 1

    # Delete user
    db_session.delete(user)
    db_session.commit()

    # Verify notification was cascaded and deleted
    assert db_session.query(Notification).filter_by(user_id=user_id).count() == 0

