from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database.core import Base
from src.dashboard.transaction_model import Transaction
from src.dashboard.transaction_routes import get_db as get_dashboard_db
from src.expenses import expense_routes
from src.expenses.expense_model import Expense
from src.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[expense_routes.get_db] = override_get_db
    app.dependency_overrides[get_dashboard_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_expenses_crud_flow(client):
    payload = {
        "title": "Lunch delivery",
        "category": "Food",
        "amount": 420.5,
        "date": date.today().isoformat(),
        "note": "Team lunch",
        "payment_method": "UPI",
    }

    create_response = client.post("/expenses/", json=payload)
    assert create_response.status_code == 200
    data = create_response.json()["expense"]
    assert data["title"] == "Lunch delivery"
    assert data["amount"] == 420.5

    expense_id = data["id"]

    list_response = client.get("/expenses/")
    assert list_response.status_code == 200
    assert any(item["id"] == expense_id for item in list_response.json())

    transactions = client.get("/dashboard/transactions").json()
    assert len(transactions) == 1
    assert transactions[0]["description"] == payload["title"]
    assert transactions[0]["amount"] == payload["amount"]

    updated_payload = {**payload, "amount": 500.0, "note": "Updated lunch"}
    update_response = client.put(f"/expenses/{expense_id}", json=updated_payload)
    assert update_response.status_code == 200
    assert update_response.json()["expense"]["amount"] == 500.0
    assert update_response.json()["expense"]["note"] == "Updated lunch"

    transactions = client.get("/dashboard/transactions").json()
    assert len(transactions) == 1
    assert transactions[0]["amount"] == 500.0

    delete_response = client.delete(f"/expenses/{expense_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Expense deleted successfully"

    remaining_expenses = client.get("/expenses/").json()
    remaining_transactions = client.get("/dashboard/transactions").json()
    assert remaining_expenses == []
    assert remaining_transactions == []
