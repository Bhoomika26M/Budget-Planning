def test_register_login_me(client):
    payload = {"name": "Riya Sharma", "email": "riya@example.com", "password": "riya1234"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409

    res = client.post("/api/auth/login", json={"email": "RIYA@example.com", "password": "riya1234"})
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["role"] == "student"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.json()["email"] == "riya@example.com"


def test_wrong_password(client):
    res = client.post("/api/auth/login", json={"email": "john.doe@budgetbuddy.in", "password": "nope"})
    assert res.status_code == 401


def test_requires_token(client):
    assert client.get("/api/expenses/").status_code == 401
    assert client.get("/api/expenses/", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_forgot_password_flow(client):
    client.post("/api/auth/register", json={"name": "Otp User", "email": "otp@example.com", "password": "first123"})
    res = client.post("/api/auth/forgot-password", json={"email": "otp@example.com"})
    assert res.status_code == 200
    otp = res.json()["dev_otp"]

    assert client.post("/api/auth/verify-otp", json={"email": "otp@example.com", "otp": "000000"}).status_code == 400
    assert client.post("/api/auth/verify-otp", json={"email": "otp@example.com", "otp": otp}).status_code == 200
    res = client.post("/api/auth/reset-password", json={"email": "otp@example.com", "otp": otp, "new_password": "second123"})
    assert res.status_code == 200
    assert client.post("/api/auth/login", json={"email": "otp@example.com", "password": "second123"}).status_code == 200
    assert client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"}).status_code == 404


def test_oauth_not_configured(client):
    assert client.get("/api/auth/oauth/providers").json() == {"google": False, "github": False}
    assert client.get("/api/auth/oauth/google/login", follow_redirects=False).status_code == 501
