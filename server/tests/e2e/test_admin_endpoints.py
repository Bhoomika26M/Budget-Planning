def test_admin_only(client, student_headers):
    assert client.get("/api/admin/users", headers=student_headers).status_code == 403


def test_user_management(client, admin_headers, new_user_headers):
    me = client.get("/api/auth/me", headers=new_user_headers).json()
    users = client.get("/api/admin/users", headers=admin_headers).json()
    assert any(u["id"] == me["id"] for u in users)

    res = client.patch(f"/api/admin/users/{me['id']}", json={"plan": "premium"}, headers=admin_headers)
    assert res.json()["role"] == "premium"

    res = client.patch(f"/api/admin/users/{me['id']}", json={"status": "suspended"}, headers=admin_headers)
    assert res.json()["status"] == "suspended"
    assert client.get("/api/expenses/", headers=new_user_headers).status_code == 403

    admin_id = client.get("/api/auth/me", headers=admin_headers).json()["id"]
    assert client.patch(f"/api/admin/users/{admin_id}", json={"status": "suspended"}, headers=admin_headers).status_code == 400
    assert client.delete(f"/api/admin/users/{me['id']}", headers=admin_headers).status_code == 204


def test_categories_announcements_feedback(client, admin_headers, student_headers):
    res = client.post("/api/admin/categories", json={"name": "Healthcare"}, headers=admin_headers)
    assert res.status_code == 201
    cat_id = res.json()["id"]
    assert "Healthcare" in [c["name"] for c in client.get("/api/categories/", headers=student_headers).json()]
    assert client.patch(f"/api/admin/categories/{cat_id}", json={"name": "Health"}, headers=admin_headers).json()["name"] == "Health"
    assert client.delete(f"/api/admin/categories/{cat_id}", headers=admin_headers).status_code == 204

    res = client.post("/api/admin/announcements", json={"title": "Maintenance", "body": "Down at 2 AM", "audience": "all"}, headers=admin_headers)
    assert res.json()["recipients"] >= 2
    titles = [n["title"] for n in client.get("/api/notifications/", headers=student_headers).json()]
    assert "📢 Maintenance" in titles

    fb = client.post("/api/support/feedback", json={"type": "bug", "message": "Chart overlaps on mobile"}, headers=student_headers).json()
    assert client.patch(f"/api/admin/feedback/{fb['id']}", json={"status": "resolved"}, headers=admin_headers).json()["status"] == "resolved"
    issue = client.post("/api/support/issues", json={"issue": "Crash on logout", "severity": "high"}, headers=student_headers).json()
    assert client.patch(f"/api/admin/issues/{issue['id']}", json={"status": "in-progress"}, headers=admin_headers).json()["status"] == "in-progress"

    logs = client.get("/api/admin/logs?level=warn", headers=admin_headers).json()
    assert all(log["level"] == "warn" for log in logs)
    analytics = client.get("/api/admin/analytics", headers=admin_headers).json()
    assert len(analytics["series"]) == 7
