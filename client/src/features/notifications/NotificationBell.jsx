import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import {
  dismissNotification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markNotificationUnread,
} from "./notificationsService";
import { formatWhen } from "./notificationFormat";
import "./Notifications.css";

function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const wrapperRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
      setUnread((data || []).filter((item) => !item.is_read).length);
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    getUnreadCount(token)
      .then((data) => {
        if (active) setUnread(data.unread_count ?? 0);
      })
      .catch(() => {
        // The badge is non-critical; failures are surfaced when the panel opens.
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifications();
  };

  async function toggleRead(notification) {
    if (!token) return;
    setBusyId(notification.id);
    setError("");
    try {
      const updated = notification.is_read
        ? await markNotificationUnread(token, notification.id)
        : await markNotificationRead(token, notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setUnread((current) => (notification.is_read ? current + 1 : Math.max(0, current - 1)));
    } catch (requestError) {
      setError(requestError.message || "Unable to update the notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeNotification(notification) {
    if (!token) return;
    setBusyId(notification.id);
    setError("");
    try {
      await dismissNotification(token, notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      if (!notification.is_read) setUnread((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError.message || "Unable to dismiss the notification.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        className="header-icon-button notification-button"
        type="button"
        title="Notifications"
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={togglePanel}
      >
        <Bell size={19} />
        {unread > 0 && <span className="notification-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            {unread > 0 && <span className="notification-count">{unread} unread</span>}
          </div>

          <div className="notification-panel-body">
            {loading ? (
              <p className="notification-state">Loading notifications…</p>
            ) : error ? (
              <p className="notification-state notification-error" role="alert">{error}</p>
            ) : notifications.length === 0 ? (
              <p className="notification-state">You're all caught up. No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <article
                  className={`notification-item${notification.is_read ? "" : " unread"}`}
                  key={notification.id}
                >
                  <div className="notification-item-content">
                    <p className="notification-item-title">{notification.title}</p>
                    <p className="notification-item-message">{notification.message}</p>
                    <span className="notification-item-time">{formatWhen(notification.created_at)}</span>
                  </div>
                  <div className="notification-item-actions">
                    <button
                      type="button"
                      className="notification-action"
                      title={notification.is_read ? "Mark as unread" : "Mark as read"}
                      disabled={busyId === notification.id}
                      onClick={() => toggleRead(notification)}
                    >
                      {notification.is_read ? <RotateCcw size={14} /> : <Check size={14} />}
                    </button>
                    <button
                      type="button"
                      className="notification-action dismiss"
                      title="Dismiss"
                      disabled={busyId === notification.id}
                      onClick={() => removeNotification(notification)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
