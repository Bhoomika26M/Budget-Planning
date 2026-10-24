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

export function getNotifications(token) {
  return request("/notifications/", token);
}

export function getUnreadCount(token) {
  return request("/notifications/unread-count", token);
}

export function markNotificationRead(token, notificationId) {
  return request(`/notifications/${notificationId}/read`, token, { method: "PATCH" });
}

export function markNotificationUnread(token, notificationId) {
  return request(`/notifications/${notificationId}/unread`, token, { method: "PATCH" });
}

export function dismissNotification(token, notificationId) {
  return request(`/notifications/${notificationId}`, token, { method: "DELETE" });
}
