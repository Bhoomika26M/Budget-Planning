from collections.abc import Generator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.auth.security import get_db
from src.database.core import Base
from src.main import app

test_engine = create_engine(
    'sqlite://',
    connect_args={'check_same_thread': False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def register(client: TestClient, email: str = 'student@example.com') -> dict:
    response = client.post(
        '/auth/register',
        json={'name': 'Student', 'email': email, 'password': 'a-long-test-password'},
    )
    assert response.status_code == 201
    return response.json()


def login(client: TestClient, email: str) -> str:
    response = client.post(
        '/auth/token',
        data={'username': email, 'password': 'a-long-test-password'},
    )
    assert response.status_code == 200
    return response.json()['access_token']


def auth(token: str) -> dict:
    return {'Authorization': f'Bearer {token}'}


def test_notifications_require_authentication(client: TestClient):
    assert client.get('/notifications/').status_code == 401
    assert client.get('/notifications/unread-count').status_code == 401


def test_new_user_has_no_notifications(client: TestClient):
    register(client)
    token = login(client, 'student@example.com')

    assert client.get('/notifications/', headers=auth(token)).json() == []
    assert client.get('/notifications/unread-count', headers=auth(token)).json() == {
        'unread_count': 0
    }


def test_notifications_are_generated_from_real_activity_and_are_user_scoped(client: TestClient):
    user = register(client)
    other = register(client, 'another@example.com')
    token = login(client, user['email'])
    other_token = login(client, other['email'])

    today = date.today().isoformat()
    assert client.post(
        '/dashboard/transactions',
        json={
            'type': 'income',
            'description': 'Part-time job',
            'amount': 1000,
            'date': today,
            'category': 'Employment',
        },
        headers=auth(token),
    ).status_code == 201
    assert client.post(
        '/dashboard/transactions',
        json={
            'type': 'expense',
            'description': 'New laptop',
            'amount': 500,
            'date': today,
            'category': 'Education',
        },
        headers=auth(token),
    ).status_code == 201

    notifications = client.get('/notifications/', headers=auth(token)).json()
    assert isinstance(notifications, list) and notifications
    types = {item['type'] for item in notifications}
    assert 'budget_alert' in types
    assert 'report' in types
    assert all(set(item) >= {'id', 'title', 'message', 'created_at', 'is_read'} for item in notifications)

    # Repeat requests must not duplicate generated notifications.
    assert len(client.get('/notifications/', headers=auth(token)).json()) == len(notifications)

    # The other user only sees their own (empty) inbox.
    assert client.get('/notifications/', headers=auth(other_token)).json() == []
    assert client.get('/notifications/unread-count', headers=auth(other_token)).json() == {
        'unread_count': 0
    }

    unread = client.get('/notifications/unread-count', headers=auth(token)).json()
    assert unread['unread_count'] == len(notifications)


def test_mark_read_unread_and_dismiss(client: TestClient):
    user = register(client)
    token = login(client, user['email'])

    today = date.today().isoformat()
    client.post(
        '/dashboard/transactions',
        json={
            'type': 'income',
            'description': 'Wages',
            'amount': 800,
            'date': today,
            'category': 'Employment',
        },
        headers=auth(token),
    )
    notifications = client.get('/notifications/', headers=auth(token)).json()
    assert notifications
    target = notifications[0]

    # A different account cannot mutate this notification.
    other = register(client, 'other@example.com')
    other_token = login(client, other['email'])
    assert client.patch(
        f"/notifications/{target['id']}/read", headers=auth(other_token)
    ).status_code == 404

    read = client.patch(
        f"/notifications/{target['id']}/read", headers=auth(token)
    )
    assert read.status_code == 200
    assert read.json()['is_read'] is True

    unread = client.patch(
        f"/notifications/{target['id']}/unread", headers=auth(token)
    )
    assert unread.status_code == 200
    assert unread.json()['is_read'] is False

    assert client.delete(
        f"/notifications/{target['id']}", headers=auth(token)
    ).status_code == 204
    remaining_ids = {
        item['id'] for item in client.get('/notifications/', headers=auth(token)).json()
    }
    assert target['id'] not in remaining_ids

    assert client.delete(
        f"/notifications/{target['id']}", headers=auth(token)
    ).status_code == 404


def test_budget_alert_preferences_are_respected(client: TestClient):
    user = register(client)
    token = login(client, user['email'])

    disabled = {
        'email_notifications': False,
        'push_notifications': False,
        'budget_alerts': False,
        'bill_reminders': False,
        'weekly_report': False,
        'monthly_report': False,
        'dark_mode': False,
        'currency': 'INR',
        'language': 'English',
    }
    assert client.put('/settings/', json=disabled, headers=auth(token)).status_code == 200

    today = date.today().isoformat()
    client.post(
        '/dashboard/transactions',
        json={
            'type': 'income',
            'description': 'Wages',
            'amount': 1000,
            'date': today,
            'category': 'Employment',
        },
        headers=auth(token),
    )
    client.post(
        '/dashboard/transactions',
        json={
            'type': 'expense',
            'description': 'Rent',
            'amount': 700,
            'date': today,
            'category': 'Housing',
        },
        headers=auth(token),
    )

    assert client.get('/notifications/', headers=auth(token)).json() == []
