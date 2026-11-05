import { useCallback, useEffect, useState } from "react";
import { Shield, Users } from "lucide-react";
import { useAuth } from "../context/useAuth";
import "./admin.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const roleLabels = {
  student: "Student",
  premium: "Premium",
  admin: "Admin",
};

async function readResponse(response, fallback) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || fallback);
  }

  return data;
}

async function requestUsers(token) {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readResponse(response, "Unable to load accounts.");
}

async function requestPremiumRequests(token) {
  const response = await fetch(
    `${API_BASE_URL}/auth/premium-requests`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return readResponse(
    response,
    "Unable to load Premium requests."
  );
}

export default function AdminDashboard() {
  const { currentUser, token } = useAuth();

  const [users, setUsers] = useState([]);
  const [premiumRequests, setPremiumRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const [userData, requestData] = await Promise.all([
        requestUsers(token),
        requestPremiumRequests(token),
      ]);

      setUsers(userData);
      setPremiumRequests(requestData);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function changeRole(user, role) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/users/${user.id}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      const updated = await readResponse(
        response,
        "Unable to update role."
      );

      setUsers((existing) =>
        existing.map((item) =>
          item.id === user.id ? updated : item
        )
      );

      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update role.");
    }
  }

  async function reviewPremiumRequest(requestId, decision) {
    if (reviewingId !== null) return;

    setReviewingId(requestId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/premium-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: decision,
          }),
        }
      );

      const result = await readResponse(
        response,
        "Unable to review Premium request."
      );

      setPremiumRequests((existing) =>
        existing.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: decision,
                reviewed_at: new Date().toISOString(),
              }
            : request
        )
      );

      if (decision === "approved") {
        setUsers((existing) =>
          existing.map((user) =>
            user.id === result.user_id
              ? { ...user, is_premium: true }
              : user
          )
        );
      }

      setSuccess(
        result.message ||
          `Premium request ${decision} successfully.`
      );
    } catch (err) {
      setError(
        err.message || "Unable to review Premium request."
      );
    } finally {
      setReviewingId(null);
    }
  }

  const roleCounts = users.reduce((counts, user) => {
    counts[user.role] = (counts[user.role] || 0) + 1;
    return counts;
  }, {});

  const pendingRequests = premiumRequests.filter(
    (request) => request.status === "pending"
  );

  return (
    <main className="admin-page">
      <section className="admin-content">
        <div className="admin-title">
          <div>
            <p>PLATFORM CONTROL</p>
            <h1>User Management</h1>
            <span>
              Manage registered accounts and their access levels.
            </span>
          </div>

          <div className="admin-count">
            <Users size={18} />
            {users.length} accounts
          </div>
        </div>

        <div className="admin-role-summary">
          {Object.entries(roleLabels).map(([role, label]) => (
            <div
              className={`admin-summary-card ${role}`}
              key={role}
            >
              <span>{label}</span>
              <strong>{roleCounts[role] || 0}</strong>
            </div>
          ))}
        </div>

        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="admin-success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* Premium Requests */}
        <section className="admin-users-card">
          <div className="admin-users-heading">
            <div>
              <h2>Premium Requests</h2>
              <p>
                Review and approve or reject Premium membership
                requests.
              </p>
            </div>

            <span className="admin-pending-count">
              {pendingRequests.length} pending
            </span>
          </div>

          {loading ? (
            <p className="admin-empty">
              Loading Premium requests...
            </p>
          ) : premiumRequests.length === 0 ? (
            <p className="admin-empty">
              No Premium requests have been submitted.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {premiumRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name}</td>
                      <td>{request.email}</td>

                      <td>
                        {request.requested_at
                          ? new Date(
                              request.requested_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`premium-request-status ${request.status}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.status === "pending" ? (
                          <div className="premium-review-actions">
                            <button
                              type="button"
                              className="premium-approve-button"
                              disabled={reviewingId !== null}
                              onClick={() =>
                                reviewPremiumRequest(
                                  request.id,
                                  "approved"
                                )
                              }
                            >
                              {reviewingId === request.id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              className="premium-reject-button"
                              disabled={reviewingId !== null}
                              onClick={() =>
                                reviewPremiumRequest(
                                  request.id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          "Reviewed"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Existing User Management */}
        <section className="admin-users-card">
          <div className="admin-users-heading">
            <div>
              <h2>Registered users</h2>
              <p>
                Role updates are saved to the backend.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">
              Loading accounts…
            </p>
          ) : users.length === 0 ? (
            <p className="admin-empty">
              No registered accounts.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Premium access</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="admin-you">
                            You
                          </span>
                        )}
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <select
                          aria-label={`Role for ${user.email}`}
                          value={user.role}
                          disabled={
                            user.id === currentUser?.id
                          }
                          onChange={(event) =>
                            changeRole(
                              user,
                              event.target.value
                            )
                          }
                        >
                          {Object.entries(roleLabels).map(
                            ([value, label]) => (
                              <option
                                value={value}
                                key={value}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        {user.is_premium
                          ? "Approved"
                          : "Not Premium"}
                      </td>

                      <td>
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="admin-security-note">
          <Shield size={14} />
          Financial analytics and account deletion are
          withheld until ownership and retention policies
          are defined.
        </p>
      </section>
    </main>
  );
}