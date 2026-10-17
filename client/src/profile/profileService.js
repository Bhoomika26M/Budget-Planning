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
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail || "The request could not be completed.");
  }
  return body;
}

export function getProfileData(token) {
  return Promise.all([
    request("/dashboard/transactions", token),
    request("/income/", token),
    request("/income/sources", token),
    request("/settings/", token),
  ]).then(([transactions, income, incomeSources, settings]) => ({
    transactions,
    income,
    incomeSources,
    settings,
  }));
}

export function createIncomeSource(token, source) {
  return request("/income/sources", token, {
    method: "POST",
    body: JSON.stringify(source),
  });
}

export function deleteIncomeSource(token, sourceId) {
  return request(`/income/sources/${sourceId}`, token, { method: "DELETE" });
}

export function saveCurrency(token, settings, currency) {
  const payload = {
    email_notifications: settings.email_notifications,
    push_notifications: settings.push_notifications,
    budget_alerts: settings.budget_alerts,
    bill_reminders: settings.bill_reminders,
    weekly_report: settings.weekly_report,
    monthly_report: settings.monthly_report,
    dark_mode: settings.dark_mode,
    currency,
    language: settings.language,
  };
  return request("/settings/", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
