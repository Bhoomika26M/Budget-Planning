def test_profile_update_and_password(client, new_user_headers):
    res = client.patch("/api/users/me", json={"university": "CCE", "major": "CSE", "pref_alerts": False}, headers=new_user_headers)
    assert res.status_code == 200
    assert res.json()["university"] == "CCE" and res.json()["pref_alerts"] is False

    bad = client.post("/api/users/me/change-password", json={"current_password": "wrong", "new_password": "abcdef1"}, headers=new_user_headers)
    assert bad.status_code == 400
    ok = client.post("/api/users/me/change-password", json={"current_password": "secret123", "new_password": "abcdef1"}, headers=new_user_headers)
    assert ok.status_code == 200


def test_email_must_be_unique(client, new_user_headers):
    res = client.patch("/api/users/me", json={"email": "john.doe@budgetbuddy.in"}, headers=new_user_headers)
    assert res.status_code == 409


def test_upgrade_unlocks_premium(client, new_user_headers):
    assert client.get("/api/budgets/", headers=new_user_headers).status_code == 403
    res = client.post("/api/users/me/upgrade", json={"payment_method": "upi"}, headers=new_user_headers)
    assert res.json()["role"] == "premium"
    assert client.get("/api/budgets/", headers=new_user_headers).status_code == 200


def test_delete_account(client, new_user_headers):
    assert client.delete("/api/users/me", headers=new_user_headers).status_code == 204
    assert client.get("/api/auth/me", headers=new_user_headers).status_code == 401
