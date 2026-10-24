const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const body = response.status === 204
    ? null
    : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (response.status === 422) {
      throw new Error("Please check the expense details and try again.");
    }
    if (response.status >= 500) {
      throw new Error("The expense service is temporarily unavailable.");
    }
    throw new Error(body?.detail || "The expense request could not be completed.");
  }
  return body;
}

export function getExpenses(token) {
  return request("/expenses/", token);
}

export function createExpense(token, expense) {
  return request("/expenses/", token, {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

export function updateExpense(token, expenseId, expense) {
  return request(`/expenses/${expenseId}`, token, {
    method: "PUT",
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(token, expenseId) {
  return request(`/expenses/${expenseId}`, token, { method: "DELETE" });
}
