const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}/savings-goals${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (response.status >= 500) {
      throw new Error("The savings goal service is temporarily unavailable.");
    }
    throw new Error(body?.detail || "The savings goal request could not be completed.");
  }
  return body;
}

export function getSavingsGoals(token) {
  return request("", token);
}

export function createSavingsGoal(token, goal) {
  return request("", token, {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export function updateSavingsGoalProgress(token, goalId, savedAmount) {
  return request(`/${goalId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ saved_amount: savedAmount }),
  });
}

export function deleteSavingsGoal(token, goalId) {
  return request(`/${goalId}`, token, { method: "DELETE" });
}
