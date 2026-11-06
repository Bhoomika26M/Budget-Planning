def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_student_cannot_access_reports(client):
    registration = client.post("/api/auth/register", json={
        "full_name": "Student Reports User",
        "email": "reports.student@test.com",
        "password": "Password123!",
        "role": "student",
    })
    assert registration.status_code == 201

    response = client.get(
        "/api/reports/summary",
        headers=auth_headers(registration.json()["access_token"]),
    )
    assert response.status_code == 403


def test_premium_can_access_reports(client):
    registration = client.post("/api/auth/register", json={
        "full_name": "Premium Reports User",
        "email": "reports.premium@test.com",
        "password": "Password123!",
        "role": "premium",
    })
    assert registration.status_code == 201

    response = client.get(
        "/api/reports/summary",
        headers=auth_headers(registration.json()["access_token"]),
    )
    assert response.status_code == 200


def test_admin_can_access_reports(client):
    registration = client.post("/api/auth/register", json={
        "full_name": "Admin Reports User",
        "email": "reports.admin@test.com",
        "password": "Password123!",
        "role": "admin",
    })
    assert registration.status_code == 201

    response = client.get(
        "/api/reports/summary",
        headers=auth_headers(registration.json()["access_token"]),
    )
    assert response.status_code == 200
