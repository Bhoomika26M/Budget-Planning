from datetime import date


def register_user(client, email, full_name="Income User"):
    response = client.post("/api/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": "IncomeTest123!",
        "role": "student",
    })
    assert response.status_code == 201
    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_income_crud_and_user_isolation(client):
    owner_token = register_user(client, "income-owner@test.com")
    other_token = register_user(client, "income-other@test.com")
    owner_headers = auth_headers(owner_token)
    other_headers = auth_headers(other_token)

    create_response = client.post("/api/income", json={
        "source": "Freelancing",
        "amount": 12500.25,
        "date": date.today().isoformat(),
        "description": "Website project",
    }, headers=owner_headers)
    assert create_response.status_code == 201
    income_id = create_response.json()["id"]

    list_response = client.get("/api/income", headers=owner_headers)
    assert list_response.status_code == 200
    assert [record["id"] for record in list_response.json()] == [income_id]

    update_response = client.put(f"/api/income/{income_id}", json={
        "source": "Salary",
        "amount": 15000.50,
        "description": "Monthly salary",
    }, headers=owner_headers)
    assert update_response.status_code == 200
    assert update_response.json()["source"] == "Salary"
    assert update_response.json()["amount"] == 15000.50

    assert client.get(f"/api/income/{income_id}", headers=other_headers).status_code == 404
    assert client.put(f"/api/income/{income_id}", json={
        "amount": 1,
    }, headers=other_headers).status_code == 404

    summary_response = client.get("/api/income/summary", headers=owner_headers)
    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert summary["total_amount"] == 15000.50
    assert summary["this_month_total"] == 15000.50
    assert summary["count"] == 1
    assert summary["source_totals"]["Salary"] == 15000.50

    delete_response = client.delete(f"/api/income/{income_id}", headers=owner_headers)
    assert delete_response.status_code == 204

    assert client.get("/api/income", headers=owner_headers).json() == []
    assert client.delete(f"/api/income/{income_id}", headers=owner_headers).status_code == 404
