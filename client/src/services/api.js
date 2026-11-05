// Central API client for the FastAPI backend (server/).
// Every request sends the JWT saved at login in the Authorization header.

export const API_BASE_URL = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const TOKEN_KEY = "bb_access_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// remember=true keeps the user signed in after the browser closes.
export function saveToken(token, remember = true) {
  try {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode) – the session just won't persist
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function readError(response) {
  let message = `Request failed (${response.status}).`;
  try {
    const data = await response.json();
    if (typeof data.detail === "string") message = data.detail;
    else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((item) => {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          return field && field !== "body" ? `${field}: ${item.msg}` : item.msg;
        })
        .join(", ");
    }
  } catch {
    // keep the HTTP status message
  }
  return message;
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const { raw, ...fetchOptions } = options;

  const headers = {
    ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
    ...fetchOptions.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers });
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE_URL}. Check that the server is running.`);
  }

  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event("bb:unauthorized"));
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    const error = new Error(await readError(response));
    error.status = response.status;
    throw error;
  }

  if (raw) return response;
  if (response.status === 204) return null;
  return response.json();
}

const json = (method, data) => ({ method, body: JSON.stringify(data ?? {}) });
const qs = (params) => {
  const search = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return search ? `?${search}` : "";
};

export const api = {
  // Authentication
  register: (data) => apiRequest("/api/auth/register", json("POST", data)),
  login: (data) => apiRequest("/api/auth/login", json("POST", data)),
  me: () => apiRequest("/api/auth/me"),
  forgotPassword: (email) => apiRequest("/api/auth/forgot-password", json("POST", { email })),
  verifyOtp: (email, otp) => apiRequest("/api/auth/verify-otp", json("POST", { email, otp })),
  resetPassword: (email, otp, newPassword) =>
    apiRequest("/api/auth/reset-password", json("POST", { email, otp, new_password: newPassword })),
  oauthProviders: () => apiRequest("/api/auth/oauth/providers"),
  oauthLoginUrl: (provider) => `${API_BASE_URL}/api/auth/oauth/${provider}/login`,

  // Profile & settings
  updateProfile: (data) => apiRequest("/api/users/me", json("PATCH", data)),
  getActivity: () => apiRequest("/api/users/me/activity"),
  changePassword: (currentPassword, newPassword) =>
    apiRequest("/api/users/me/change-password", json("POST", { current_password: currentPassword, new_password: newPassword })),
  upgrade: (paymentMethod) => apiRequest("/api/users/me/upgrade", json("POST", { plan: "premium", payment_method: paymentMethod })),
  deleteAccount: () => apiRequest("/api/users/me", { method: "DELETE" }),
  unlinkOAuth: () => apiRequest("/api/users/me/oauth", { method: "DELETE" }),

  // Categories
  getCategories: () => apiRequest("/api/categories/"),

  // Expenses
  getExpenses: (params) => apiRequest(`/api/expenses/${qs(params)}`),
  createExpense: (data) => apiRequest("/api/expenses/", json("POST", data)),
  updateExpense: (id, data) => apiRequest(`/api/expenses/${id}`, json("PATCH", data)),
  deleteExpense: (id) => apiRequest(`/api/expenses/${id}`, { method: "DELETE" }),
  getExpenseSummary: () => apiRequest("/api/expenses/summary"),

  // Income
  getIncome: (params) => apiRequest(`/api/income/${qs(params)}`),
  createIncome: (data) => apiRequest("/api/income/", json("POST", data)),
  updateIncome: (id, data) => apiRequest(`/api/income/${id}`, json("PATCH", data)),
  deleteIncome: (id) => apiRequest(`/api/income/${id}`, { method: "DELETE" }),

  // Budgets (Premium)
  getBudgets: (month) => apiRequest(`/api/budgets/${qs({ month })}`),
  createBudget: (data) => apiRequest("/api/budgets/", json("POST", data)),
  updateBudget: (id, data) => apiRequest(`/api/budgets/${id}`, json("PATCH", data)),
  deleteBudget: (id) => apiRequest(`/api/budgets/${id}`, { method: "DELETE" }),
  setMonthlyBudget: (amount) => apiRequest("/api/budgets/monthly", json("PUT", { monthly_budget: amount })),

  // Savings goals
  getSavingsGoals: () => apiRequest("/api/savings/"),
  getSavingsGoal: (id) => apiRequest(`/api/savings/${id}`),
  createSavingsGoal: (data) => apiRequest("/api/savings/", json("POST", data)),
  updateSavingsGoal: (id, data) => apiRequest(`/api/savings/${id}`, json("PATCH", data)),
  deleteSavingsGoal: (id) => apiRequest(`/api/savings/${id}`, { method: "DELETE" }),
  getAllContributions: () => apiRequest("/api/savings/contributions"),
  getSavingsContributions: (goalId) => apiRequest(`/api/savings/${goalId}/contributions`),
  addSavingsContribution: (goalId, data) => apiRequest(`/api/savings/${goalId}/contributions`, json("POST", data)),

  // Analytics & reports
  getAnalytics: (params) => apiRequest(`/api/analytics/overview${qs(params)}`),
  getInsights: () => apiRequest("/api/analytics/insights"),
  getReport: (period, month) => apiRequest(`/api/reports/summary${qs({ period, month })}`),
  exportReport: (format, period, month) =>
    apiRequest(`/api/reports/export${qs({ format, period, month })}`, { raw: true }),

  // Notifications
  getNotifications: () => apiRequest("/api/notifications/"),
  markNotificationRead: (id) => apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => apiRequest("/api/notifications/read-all", { method: "POST" }),
  deleteNotification: (id) => apiRequest(`/api/notifications/${id}`, { method: "DELETE" }),

  // Help & feedback
  sendFeedback: (type, message) => apiRequest("/api/support/feedback", json("POST", { type, message })),
  reportIssue: (issue, severity) => apiRequest("/api/support/issues", json("POST", { issue, severity })),

  // Admin
  admin: {
    users: () => apiRequest("/api/admin/users"),
    updateUser: (id, data) => apiRequest(`/api/admin/users/${id}`, json("PATCH", data)),
    deleteUser: (id) => apiRequest(`/api/admin/users/${id}`, { method: "DELETE" }),
    analytics: () => apiRequest("/api/admin/analytics"),
    categories: () => apiRequest("/api/admin/categories"),
    addCategory: (name) => apiRequest("/api/admin/categories", json("POST", { name })),
    renameCategory: (id, name) => apiRequest(`/api/admin/categories/${id}`, json("PATCH", { name })),
    deleteCategory: (id) => apiRequest(`/api/admin/categories/${id}`, { method: "DELETE" }),
    logs: (level) => apiRequest(`/api/admin/logs${qs({ level })}`),
    announcements: () => apiRequest("/api/admin/announcements"),
    sendAnnouncement: (data) => apiRequest("/api/admin/announcements", json("POST", data)),
    deleteAnnouncement: (id) => apiRequest(`/api/admin/announcements/${id}`, { method: "DELETE" }),
    feedback: () => apiRequest("/api/admin/feedback"),
    updateFeedback: (id, status) => apiRequest(`/api/admin/feedback/${id}`, json("PATCH", { status })),
    deleteFeedback: (id) => apiRequest(`/api/admin/feedback/${id}`, { method: "DELETE" }),
    issues: () => apiRequest("/api/admin/issues"),
    updateIssue: (id, status) => apiRequest(`/api/admin/issues/${id}`, json("PATCH", { status })),
    deleteIssue: (id) => apiRequest(`/api/admin/issues/${id}`, { method: "DELETE" }),
  },
};

export default api;
