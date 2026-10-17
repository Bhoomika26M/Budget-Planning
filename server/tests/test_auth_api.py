from collections.abc import Generator

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
