from collections.abc import Generator
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.auth.routes import bootstrap_initial_admin
from src.auth.security import get_db, hash_password
from src.database.core import Base
from src.entities.user import User
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


def login(
    client: TestClient,
    email: str,
    password: str = 'a-long-test-password',
) -> str:
    response = client.post(
        '/auth/token',
        data={'username': email, 'password': password},
    )
    assert response.status_code == 200
    return response.json()['access_token']


def test_registration_login_and_current_user(client: TestClient):
    created = register(client)
    assert created['role'] == 'student'
    assert 'password_hash' not in created
    assert client.post(
        '/auth/register',
        json={
            'name': 'Attacker',
            'email': 'other@example.com',
            'password': 'a-long-test-password',
            'role': 'admin',
        },
    ).status_code == 422

    token = login(client, 'student@example.com')
    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert response.json()['email'] == 'student@example.com'


def test_profile_update_is_authenticated_validated_and_persistent(client: TestClient):
    created = register(client)
    token = login(client, created['email'])

    assert client.patch(
        '/auth/me',
        json={'name': 'Updated Student'},
    ).status_code == 401

    response = client.patch(
        '/auth/me',
        json={
            'name': '  Updated Student  ',
            'phone': '  +1 555 0100 ',
            'location': '  Boston ',
            'university': ' Example University ',
            'major': ' Economics ',
        },
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    assert response.json()['name'] == 'Updated Student'
    assert response.json()['phone'] == '+1 555 0100'
    assert response.json()['location'] == 'Boston'
    assert response.json()['university'] == 'Example University'
    assert response.json()['major'] == 'Economics'
    assert client.get(
        '/auth/me',
        headers={'Authorization': f'Bearer {token}'},
    ).json()['university'] == 'Example University'

    assert client.patch(
        '/auth/me',
        json={'name': '   '},
        headers={'Authorization': f'Bearer {token}'},
    ).status_code == 422


def test_income_is_owned_by_authenticated_user(client: TestClient):
    register(client)
    first_token = login(client, 'student@example.com')
    register(client, 'another@example.com')
    second_token = login(client, 'another@example.com')

    created = client.post(
        '/income/',
        json={
            'description': 'Part-time job',
            'amount': 325.50,
            'date': '2026-10-17',
            'category': 'Employment',
            'user_id': 999,
        },
        headers={'Authorization': f'Bearer {first_token}'},
    )
    assert created.status_code == 422

    created = client.post(
        '/income/',
        json={
            'description': 'Part-time job',
            'amount': 325.50,
            'date': '2026-10-17',
            'category': 'Employment',
        },
        headers={'Authorization': f'Bearer {first_token}'},
    )
    assert created.status_code == 201
    income_id = created.json()['id']

    assert len(client.get('/income/', headers={'Authorization': f'Bearer {first_token}'}).json()) == 1
    assert client.get('/income/', headers={'Authorization': f'Bearer {second_token}'}).json() == []
    assert client.delete(
        f'/income/{income_id}',
        headers={'Authorization': f'Bearer {second_token}'},
    ).status_code == 404


def test_dashboard_transactions_and_settings_are_user_scoped(client: TestClient):
    assert client.get('/dashboard/transactions').status_code == 401
    assert client.get('/settings/').status_code == 401

    first_user = register(client)
    first_token = login(client, first_user['email'])
    second_user = register(client, 'another@example.com')
    second_token = login(client, second_user['email'])

    transaction = client.post(
        '/dashboard/transactions',
        json={
            'type': 'income',
            'description': 'Wages',
            'amount': 125.0,
            'date': '2026-10-17',
            'category': 'Employment',
        },
        headers={'Authorization': f'Bearer {first_token}'},
    )
    assert transaction.status_code == 201
    assert len(
        client.get(
            '/dashboard/transactions',
            headers={'Authorization': f'Bearer {first_token}'},
        ).json()
    ) == 1
    assert client.get(
        '/dashboard/transactions',
        headers={'Authorization': f'Bearer {second_token}'},
    ).json() == []

    first_settings = client.get(
        '/settings/',
        headers={'Authorization': f'Bearer {first_token}'},
    ).json()
    assert first_settings['user_id'] == first_user['id']
    second_settings = client.get(
        '/settings/',
        headers={'Authorization': f'Bearer {second_token}'},
    ).json()
    assert second_settings['user_id'] == second_user['id']
    assert second_settings['dark_mode'] is False


def test_expense_crud_is_owned_and_linked_to_dashboard_transaction(client: TestClient):
    assert client.get('/expenses/').status_code == 401

    first_user = register(client)
    first_token = login(client, first_user['email'])
    second_user = register(client, 'another@example.com')
    second_token = login(client, second_user['email'])
    first_headers = {'Authorization': f'Bearer {first_token}'}
    second_headers = {'Authorization': f'Bearer {second_token}'}

    invalid = client.post(
        '/expenses/',
        json={
            'title': '  ',
            'category': 'Food',
            'amount': 0,
            'date': '2026-10-17',
            'user_id': second_user['id'],
        },
        headers=first_headers,
    )
    assert invalid.status_code == 422

    created = client.post(
        '/expenses/',
        json={
            'title': 'Groceries',
            'category': 'Food',
            'amount': 42.75,
            'date': '2026-10-17',
            'note': 'Weekly groceries',
            'payment_method': 'Card',
        },
        headers=first_headers,
    )
    assert created.status_code == 201
    expense_id = created.json()['expense']['id']
    assert client.get('/expenses/', headers=first_headers).json()[0]['title'] == 'Groceries'
    assert client.get('/expenses/', headers=second_headers).json() == []

    linked_transactions = client.get('/dashboard/transactions', headers=first_headers).json()
    assert len(linked_transactions) == 1
    assert linked_transactions[0]['description'] == 'Groceries'

    assert client.put(
        f'/expenses/{expense_id}',
        json={
            'title': 'Market',
            'category': 'Food',
            'amount': 50,
            'date': '2026-10-17',
            'note': '',
            'payment_method': 'UPI',
        },
        headers=second_headers,
    ).status_code == 404

    updated = client.put(
        f'/expenses/{expense_id}',
        json={
            'title': 'Market',
            'category': 'Food',
            'amount': 50,
            'date': '2026-10-17',
            'note': '',
            'payment_method': 'UPI',
        },
        headers=first_headers,
    )
    assert updated.status_code == 200
    assert updated.json()['expense']['title'] == 'Market'
    updated_transactions = client.get(
        '/dashboard/transactions',
        headers=first_headers,
    ).json()
    assert len(updated_transactions) == 1
    assert updated_transactions[0]['description'] == 'Market'
    assert updated_transactions[0]['amount'] == 50

    assert client.delete(
        f'/expenses/{expense_id}',
        headers=second_headers,
    ).status_code == 404
    assert client.delete(
        f'/expenses/{expense_id}',
        headers=first_headers,
    ).status_code == 204
    assert client.get('/expenses/', headers=first_headers).json() == []
    assert client.get('/dashboard/transactions', headers=first_headers).json() == []


def test_analytics_requires_premium_and_uses_only_current_users_data(client: TestClient):
    assert client.get('/api/analytics').status_code == 401

    first_user = register(client)
    first_token = login(client, first_user['email'])
    first_headers = {'Authorization': f'Bearer {first_token}'}
    assert client.get('/api/analytics', headers=first_headers).status_code == 403

    with TestingSessionLocal() as db:
        db.query(User).filter_by(id=first_user['id']).update({'role': 'premium'})
        db.commit()

    second_user = register(client, 'another@example.com')
    second_headers = {
        'Authorization': f'Bearer {login(client, second_user["email"])}',
    }
    for headers, transaction in (
        (
            first_headers,
            {
                'type': 'income',
                'description': 'Scholarship',
                'amount': 1000,
                'date': '2025-10-17',
                'category': 'Education',
            },
        ),
        (
            first_headers,
            {
                'type': 'expense',
                'description': 'Books',
                'amount': 250,
                'date': '2026-10-17',
                'category': 'Education',
            },
        ),
        (
            second_headers,
            {
                'type': 'income',
                'description': 'Other account',
                'amount': 50000,
                'date': '2026-10-17',
                'category': 'Employment',
            },
        ),
    ):
        assert client.post(
            '/dashboard/transactions',
            json=transaction,
            headers=headers,
        ).status_code == 201

    response = client.get(
        f'/api/analytics?user_id={second_user["id"]}',
        headers=first_headers,
    )
    assert response.status_code == 200
    result = response.json()
    assert result['total_income'] == 1000
    assert result['total_expenses'] == 250
    assert result['savings_rate'] == 75
    assert result['avg_tx_amount'] == 250
    assert [month['month'] for month in result['monthly_trend']] == [
        'Oct 2025',
        'Oct 2026',
    ]
    assert result['expense_breakdown'] == [{'name': 'Education', 'value': 250}]


def test_admin_routes_require_admin_and_can_change_roles(client: TestClient):
    register(client)
    student_token = login(client, 'student@example.com')
    assert client.get('/auth/users').status_code == 401
    assert client.get(
        '/auth/users',
        headers={'Authorization': f'Bearer {student_token}'},
    ).status_code == 403

    with TestingSessionLocal() as db:
        admin = User(
            email='admin@example.com',
            name='Admin',
            password_hash=hash_password('a-long-test-password'),
            role='admin',
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        admin_id = admin.id

    admin_token = login(client, 'admin@example.com')
    response = client.patch(
        '/auth/users/1/role',
        json={'role': 'premium'},
        headers={'Authorization': f'Bearer {admin_token}'},
    )
    assert response.status_code == 200
    assert response.json()['role'] == 'premium'

    assert client.patch(
        f'/auth/users/{admin_id}/role',
        json={'role': 'student'},
        headers={'Authorization': f'Bearer {admin_token}'},
    ).status_code == 400


def test_login_rejects_invalid_password(client: TestClient):
    register(client)
    response = client.post(
        '/auth/token',
        data={'username': 'student@example.com', 'password': 'incorrect'},
    )
    assert response.status_code == 401


def test_initial_admin_is_created_from_server_configuration(client: TestClient, monkeypatch):
    monkeypatch.setenv('INITIAL_ADMIN_EMAIL', 'configured-admin@example.com')
    monkeypatch.setenv('INITIAL_ADMIN_PASSWORD', 'admin-test-password-long')

    with TestingSessionLocal() as db:
        bootstrap_initial_admin(db)
        admin = db.query(User).filter_by(email='configured-admin@example.com').one()
        assert admin.role == 'admin'
        assert admin.password_hash != 'admin-test-password-long'

    token = login(
        client,
        'configured-admin@example.com',
        'admin-test-password-long',
    )
    response = client.get('/auth/users', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200


def test_savings_goals_are_authenticated_validated_and_user_scoped(client: TestClient):
    assert client.get('/savings-goals/').status_code == 401

    first_user = register(client)
    first_headers = {
        'Authorization': f'Bearer {login(client, first_user["email"])}',
    }
    second_user = register(client, 'another@example.com')
    second_headers = {
        'Authorization': f'Bearer {login(client, second_user["email"])}',
    }

    invalid = client.post(
        '/savings-goals/',
        json={
            'name': '  ',
            'target_amount': 1000,
            'saved_amount': 1001,
            'target_date': '2026-12-31',
        },
        headers=first_headers,
    )
    assert invalid.status_code == 422

    created = client.post(
        '/savings-goals/',
        json={
            'name': 'Emergency fund',
            'target_amount': 1000,
            'saved_amount': 125.50,
            'target_date': '2026-12-31',
        },
        headers=first_headers,
    )
    assert created.status_code == 201
    goal = created.json()
    assert goal['name'] == 'Emergency fund'
    assert goal['saved_amount'] == 125.5
    goal_id = goal['id']

    assert client.get('/savings-goals/', headers=first_headers).json() == [goal]
    assert client.get('/savings-goals/', headers=second_headers).json() == []

    assert client.patch(
        f'/savings-goals/{goal_id}',
        json={'saved_amount': 200},
        headers=second_headers,
    ).status_code == 404
    assert client.delete(
        f'/savings-goals/{goal_id}',
        headers=second_headers,
    ).status_code == 404
    assert client.patch(
        f'/savings-goals/{goal_id}',
        json={'saved_amount': 1001},
        headers=first_headers,
    ).status_code == 422

    updated = client.patch(
        f'/savings-goals/{goal_id}',
        json={'saved_amount': 250},
        headers=first_headers,
    )
    assert updated.status_code == 200
    assert updated.json()['saved_amount'] == 250
    assert client.delete(
        f'/savings-goals/{goal_id}',
        headers=first_headers,
    ).status_code == 204
    assert client.get('/savings-goals/', headers=first_headers).json() == []


def test_budgets_are_authenticated_user_scoped_and_track_monthly_expenses(
    client: TestClient,
):
    assert client.get('/budgets/').status_code == 401
    assert client.get('/budgets/alerts').status_code == 401

    first_user = register(client)
    first_headers = {
        'Authorization': f'Bearer {login(client, first_user["email"])}',
    }
    second_user = register(client, 'another@example.com')
    second_headers = {
        'Authorization': f'Bearer {login(client, second_user["email"])}',
    }
    today = date.today()

    for headers, amount, transaction_date in (
        (first_headers, 85, today),
        (first_headers, 900, today.replace(day=1) - timedelta(days=1)),
        (second_headers, 500, today),
    ):
        response = client.post(
            '/dashboard/transactions',
            json={
                'type': 'expense',
                'description': 'Food shopping',
                'amount': amount,
                'date': transaction_date.isoformat(),
                'category': 'Food & Dining',
            },
            headers=headers,
        )
        assert response.status_code == 201

    invalid = client.post(
        '/budgets/',
        json={
            'name': '  ',
            'budget': 100,
            'icon': '🍽️',
            'color': '#4F93A0',
        },
        headers=first_headers,
    )
    assert invalid.status_code == 422

    created = client.post(
        '/budgets/',
        json={
            'name': 'Food & Dining',
            'budget': 100,
            'icon': '🍽️',
            'color': '#4F93A0',
        },
        headers=first_headers,
    )
    assert created.status_code == 201
    budget = created.json()
    budget_id = budget['id']
    assert budget['spent'] == 85
    assert budget['name'] == 'Food & Dining'

    duplicate = client.post(
        '/budgets/',
        json={
            'name': 'Food & Dining',
            'budget': 200,
        },
        headers=first_headers,
    )
    assert duplicate.status_code == 409

    assert client.get('/budgets/', headers=first_headers).json() == [budget]
    assert client.get('/budgets/', headers=second_headers).json() == []
    alerts = client.get('/budgets/alerts', headers=first_headers)
    assert alerts.status_code == 200
    assert alerts.json() == [{
        'id': budget_id,
        'name': 'Food & Dining',
        'message': 'You have used 85% of your monthly limit.',
    }]
    assert client.get('/budgets/alerts', headers=second_headers).json() == []

    assert client.put(
        f'/budgets/{budget_id}',
        json={'name': 'Food & Dining', 'budget': 80},
        headers=second_headers,
    ).status_code == 404
    updated = client.put(
        f'/budgets/{budget_id}',
        json={
            'name': 'Eating out',
            'budget': 120,
            'icon': '🍜',
            'color': '#22C55E',
        },
        headers=first_headers,
    )
    assert updated.status_code == 200
    assert updated.json()['name'] == 'Eating out'
    assert updated.json()['spent'] == 0
    assert client.delete(
        f'/budgets/{budget_id}',
        headers=second_headers,
    ).status_code == 404
    assert client.delete(
        f'/budgets/{budget_id}',
        headers=first_headers,
    ).status_code == 204
    assert client.get('/budgets/', headers=first_headers).json() == []
