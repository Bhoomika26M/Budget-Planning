import { useCallback, useEffect, useState } from "react";
import { Shield, Users } from "lucide-react";
import { useAuth } from "../context/useAuth";
import "./admin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const roleLabels = { student: "Student", premium: "Premium", admin: "Admin" };

async function requestUsers(token) {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Unable to load accounts.");
  return data;
}

export default function AdminDashboard() {
  const { currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await requestUsers(token));
    } catch (err) {
      setError(err.message || "Unable to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    requestUsers(token)
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load accounts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function changeRole(user, role) {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${user.id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const updated = await response.json().catch(() => null);
      if (!response.ok) throw new Error(updated?.detail || "Unable to update role.");
      setUsers((existing) => existing.map((item) => item.id === user.id ? updated : item));
    } catch (err) {
      setError(err.message || "Unable to update role.");
    }
  }

  const roleCounts = users.reduce((counts, user) => {
    counts[user.role] = (counts[user.role] || 0) + 1;
    return counts;
  }, {});

  return (
    <main className="admin-page">
      <section className="admin-content">
        <div className="admin-title">
          <div><p>PLATFORM CONTROL</p><h1>User Management</h1><span>Manage registered accounts and their access levels.</span></div>
          <div className="admin-count"><Users size={18} /> {users.length} accounts</div>
        </div>
        <div className="admin-role-summary">
          {Object.entries(roleLabels).map(([role, label]) => (
            <div className={`admin-summary-card ${role}`} key={role}>
              <span>{label}</span><strong>{roleCounts[role] || 0}</strong>
            </div>
          ))}
        </div>
        {error && <div className="admin-error" role="alert">{error}</div>}
        <section className="admin-users-card">
          <div className="admin-users-heading"><div><h2>Registered users</h2><p>Role updates are saved to the backend.</p></div><button onClick={loadUsers} disabled={loading}>Refresh</button></div>
          {loading ? <p className="admin-empty">Loading accounts…</p> : users.length === 0 ? <p className="admin-empty">No registered accounts.</p> : (
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>{users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}{user.id === currentUser.id && <span className="admin-you">You</span>}</td>
                    <td>{user.email}</td>
                    <td>
                      <select aria-label={`Role for ${user.email}`} value={user.role}
                        disabled={user.id === currentUser.id}
                        onChange={(event) => changeRole(user, event.target.value)}>
                        {Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
        <p className="admin-security-note"><Shield size={14} /> Financial analytics and account deletion are withheld until ownership and retention policies are defined.</p>
      </section>
    </main>
  );
}
