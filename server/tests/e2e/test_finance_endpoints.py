from datetime import date


def test_expense_crud_and_roles(client, new_user_headers):
    today = date.today().isoformat()
    res = client.post("/api/expenses/", json={"category": "Food", "amount": 250, "description": "Lunch", "expense_date": today}, headers=new_user_headers)
    assert res.status_code == 201
    expense = res.json()
    assert expense["status"] == "Completed"

    res = client.patch(f"/api/expenses/{expense['id']}", json={"status": "Pending", "amount": 300}, headers=new_user_headers)
    assert res.json()["status"] == "Pending" and res.json()["amount"] == 300

    month = today[:7]
    assert len(client.get(f"/api/expenses/?month={month}", headers=new_user_headers).json()) == 1
    # Students cannot delete (Premium feature)
    assert client.delete(f"/api/expenses/{expense['id']}", headers=new_user_headers).status_code == 403


def test_income_crud(client, premium_headers):
    res = client.post("/api/income/", json={"category": "Freelance", "amount": 4500, "date": date.today().isoformat(), "frequency": "One-time"}, headers=premium_headers)
    assert res.status_code == 201
    income = res.json()
    assert income["title"] == "Freelance" and income["frequency"] == "One-time"
    res = client.patch(f"/api/income/{income['id']}", json={"category": "Scholarship"}, headers=premium_headers)
    assert res.json()["title"] == "Scholarship"
    assert client.delete(f"/api/income/{income['id']}", headers=premium_headers).status_code == 204


def test_budget_spent_and_alerts(client, new_user_headers):
    client.post("/api/users/me/upgrade", json={}, headers=new_user_headers)
    res = client.post("/api/budgets/", json={"category": "Travel", "amount": 1000}, headers=new_user_headers)
    assert res.status_code == 201
    budget = res.json()
    assert budget["spent"] == 0
    assert client.post("/api/budgets/", json={"category": "travel", "amount": 500}, headers=new_user_headers).status_code == 409

    client.post("/api/expenses/", json={"category": "Travel", "amount": 950, "expense_date": date.today().isoformat()}, headers=new_user_headers)
    budgets = client.get("/api/budgets/", headers=new_user_headers).json()
    assert budgets[0]["spent"] == 950

    titles = [n["title"] for n in client.get("/api/notifications/", headers=new_user_headers).json()]
    assert any("Budget Almost Full" in t for t in titles)

    # Cancelled expenses are not counted
    client.post("/api/expenses/", json={"category": "Travel", "amount": 500, "expense_date": date.today().isoformat(), "status": "Cancelled"}, headers=new_user_headers)
    assert client.get("/api/budgets/", headers=new_user_headers).json()[0]["spent"] == 950

    res = client.put("/api/budgets/monthly", json={"monthly_budget": 18000}, headers=new_user_headers)
    assert res.json()["monthly_budget"] == 18000


def test_savings_goal_flow(client, new_user_headers):
    res = client.post("/api/savings/", json={"name": "Bike", "emoji": "🚲", "target": 1000, "saved": 400}, headers=new_user_headers)
    assert res.status_code == 201
    goal = res.json()
    assert goal["emoji"] == "🚲" and goal["completed"] is False
    assert client.post("/api/savings/", json={"name": "X", "target": 10, "saved": 20}, headers=new_user_headers).status_code == 400

    res = client.post(f"/api/savings/{goal['id']}/contributions", json={"amount": 600}, headers=new_user_headers)
    assert res.status_code == 201 and res.json()["goal_name"] == "Bike"
    assert client.get(f"/api/savings/{goal['id']}", headers=new_user_headers).json()["completed"] is True

    all_contribs = client.get("/api/savings/contributions", headers=new_user_headers).json()
    assert all_contribs[0]["goal_emoji"] == "🚲"
    titles = [n["title"] for n in client.get("/api/notifications/", headers=new_user_headers).json()]
    assert any("Goal Achieved" in t for t in titles)


def test_notifications_read_and_delete(client, premium_headers):
    notifs = client.get("/api/notifications/", headers=premium_headers).json()
    assert notifs
    first = notifs[0]["id"]
    assert client.patch(f"/api/notifications/{first}/read", headers=premium_headers).json()["read"] is True
    assert client.post("/api/notifications/read-all", headers=premium_headers).status_code == 204
    assert client.get("/api/notifications/unread-count", headers=premium_headers).json()["unread"] == 0
    assert client.delete(f"/api/notifications/{first}", headers=premium_headers).status_code == 204


def test_analytics_and_reports(client, premium_headers, student_headers):
    overview = client.get("/api/analytics/overview?months=6", headers=premium_headers).json()
    assert len(overview["monthly_trends"]) == 6
    assert overview["stats"]["top_category"] is not None
    assert len(client.get("/api/analytics/insights", headers=premium_headers).json()) >= 1
    assert client.get("/api/analytics/insights", headers=student_headers).status_code == 403

    report = client.get("/api/reports/summary?period=yearly", headers=premium_headers).json()
    assert report["title"].endswith("Annual Report")
    csv_res = client.get("/api/reports/export?format=csv", headers=premium_headers)
    assert csv_res.status_code == 200 and "BudgetBuddy Financial Report" in csv_res.text
    xlsx_res = client.get("/api/reports/export?format=xlsx", headers=premium_headers)
    assert xlsx_res.content[:2] == b"PK"
    assert client.get("/api/reports/summary", headers=student_headers).status_code == 403
