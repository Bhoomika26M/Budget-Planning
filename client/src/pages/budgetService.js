const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}/budgets${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (response.status >= 500) {
      throw new Error("The budget service is temporarily unavailable.");
    }
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(", ")
      : detail || "The budget request failed.";
    throw new Error(message);
  }
  return payload;
}

export function getBudgets(token) {
  return request("", token);
}

export function createBudget(token, data) {
  return request("", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBudget(token, id, data) {
  return request(`/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBudget(token, id) {
  return request(`/${id}`, token, { method: "DELETE" });
}

export function getBudgetAlerts(token) {
  return request("/alerts", token);
}
