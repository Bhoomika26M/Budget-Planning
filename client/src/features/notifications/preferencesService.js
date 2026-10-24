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

/**
 * Notification preferences are the `budget_alerts` and `monthly_report` flags
 * on the existing user settings record (they gate notification generation in
 * the backend). No notification-specific settings endpoint is needed.
 */
export function getNotificationPreferences(token) {
  return request("/settings/", token);
}

/**
 * The settings API validates the complete settings object on PUT (every field
 * is required and unknown fields are rejected), so send back the object loaded
 * from GET with only the two notification flags changed.
 */
export function saveNotificationPreferences(token, settings) {
  return request("/settings/", token, {
    method: "PUT",
    body: JSON.stringify({
      email_notifications: settings.email_notifications,
      push_notifications: settings.push_notifications,
      budget_alerts: settings.budget_alerts,
      bill_reminders: settings.bill_reminders,
      weekly_report: settings.weekly_report,
      monthly_report: settings.monthly_report,
      dark_mode: settings.dark_mode,
      currency: settings.currency,
      language: settings.language,
    }),
  });
}
