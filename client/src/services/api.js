
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("bb_access_token");
}

export function saveToken(token) {
  localStorage.setItem("bb_access_token", token);
}

export function clearToken() {
  localStorage.removeItem("bb_access_token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_BASE_URL}. Check that the backend is running.`
    );
  }

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("bb:unauthorized"));

    throw new Error(
      "Your session has expired or you are not logged in. Please log in again."
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const data = await response.json();

      message =
        typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((item) => item.msg).join(", ")
            : message;
    } catch {
      // Keep the HTTP status message if the response has no JSON body.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Authentication
  register: (data) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => apiRequest("/api/auth/me"),

  // Budgets
  getBudgets: () => apiRequest("/api/budgets/"),

  createBudget: (data) =>
    apiRequest("/api/budgets/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBudget: (id, data) =>
    apiRequest(`/api/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBudget: (id) =>
    apiRequest(`/api/budgets/${id}`, {
      method: "DELETE",
    }),

  // Expenses
  getExpenses: () => apiRequest("/api/expenses/"),

  createExpense: (data) =>
    apiRequest("/api/expenses/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getExpenseSummary: () => apiRequest("/api/expenses/summary"),

  // Analytics
  getAnalytics: () => apiRequest("/api/analytics/overview"),

  // Income
  getIncome: () => apiRequest("/api/income/"),

  createIncome: (data) =>
    apiRequest("/api/income/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateIncome: (id, data) =>
    apiRequest(`/api/income/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteIncome: (id) =>
    apiRequest(`/api/income/${id}`, {
      method: "DELETE",
    }),
    
  // Savings Goals
  getSavingsGoals: () => apiRequest("/api/savings/"),

  createSavingsGoal: (data) =>
    apiRequest("/api/savings/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSavingsGoal: (id, data) =>
    apiRequest(`/api/savings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSavingsGoal: (id) =>
    apiRequest(`/api/savings/${id}`, {
      method: "DELETE",
    }),

  getSavingsContributions: (goalId) =>
    apiRequest(`/api/savings/${goalId}/contributions`),

  addSavingsContribution: (goalId, data) =>
    apiRequest(`/api/savings/${goalId}/contributions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

};

export default api;
