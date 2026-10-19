import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  FileText,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import {
  dismissNotification,
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
} from "./notificationsService";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "./preferencesService";
import { formatWhen } from "./notificationFormat";
import "./Notifications.css";

// Categories backed by notification types the backend actually generates.
// The settings table has a `bill_reminders` flag, but nothing produces
// reminder notifications, so a Reminders tab would always be empty and is
// intentionally not offered.
const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "alerts", label: "Alerts" },
  { id: "updates", label: "Updates" },
];

const TYPE_CATEGORY = {
  budget_alert: "alerts",
  report: "updates",
};

const TYPE_META = {
  alerts: { icon: AlertTriangle, label: "Alert" },
  updates: { icon: FileText, label: "Update" },
};

// Any future/unknown notification type still renders safely in All/Unread.
const DEFAULT_META = { icon: Bell, label: "Notification" };

function isoTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Same-calendar-day comparison in the viewer's local timezone. The date input
// stores YYYY-MM-DD, so compare the parsed components instead of Date strings
// (which would be interpreted as UTC midnight).
function matchesDate(notification, dateFilter) {
  if (!dateFilter) return true;
  const [year, month, day] = dateFilter.split("-").map(Number);
  const created = new Date(notification.created_at);
  return (
    !Number.isNaN(created.getTime()) &&
    created.getFullYear() === year &&
    created.getMonth() + 1 === month &&
    created.getDate() === day
  );
}

function NotificationsPage() {
  const { token, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  // Load only when a real token exists; without one, surface the existing
  // error state immediately instead of spinning forever or faking data.
  const [loading, setLoading] = useState(() => Boolean(token));
  const [error, setError] = useState(() =>
    token ? "" : "Not signed in: a real backend session is required to load notifications.",
  );
  const [busyId, setBusyId] = useState(null);

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [markingAll, setMarkingAll] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState("");
  const [prefsMessage, setPrefsMessage] = useState("");

  // Everything the header badge, tabs and summary show is derived from the
  // loaded list, so counts can never drift from the visible notifications.
  const unread = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const counts = useMemo(() => {
    const result = { all: notifications.length, unread, alerts: 0, updates: 0 };
    for (const item of notifications) {
      const category = TYPE_CATEGORY[item.type];
      if (category) result[category] += 1;
    }
    return result;
  }, [notifications, unread]);

  const filteredNotifications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (activeTab === "unread" && item.is_read) return false;
      if (
        (activeTab === "alerts" || activeTab === "updates") &&
        TYPE_CATEGORY[item.type] !== activeTab
      ) {
        return false;
      }
      if (needle) {
        const haystack = `${item.title ?? ""} ${item.message ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return matchesDate(item, dateFilter);
    });
  }, [notifications, activeTab, query, dateFilter]);

  const filtersActive = Boolean(query.trim() || dateFilter || activeTab !== "all");

  // Initial load: setState only inside promise callbacks (project convention,
  // keeps react-hooks/set-state-in-effect happy). Retry uses loadNotifications.
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getNotifications(token)
      .then((data) => {
        if (active) setNotifications(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function loadNotifications() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

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
    } catch (requestError) {
      setError(requestError.message || "Unable to dismiss the notification.");
    } finally {
      setBusyId(null);
    }
  }

  // There is no bulk endpoint, so this uses the existing per-notification
  // mark-read API for every unread item and reports partial failures.
  async function markAllRead() {
    if (!token) return;
    const targets = notifications.filter((item) => !item.is_read);
    if (targets.length === 0) return;
    setMarkingAll(true);
    setError("");
    const results = await Promise.allSettled(
      targets.map((item) => markNotificationRead(token, item.id)),
    );
    const updated = new Map();
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") updated.set(result.value.id, result.value);
      else failed += 1;
    }
    setNotifications((current) =>
      current.map((item) => (updated.has(item.id) ? updated.get(item.id) : item)),
    );
    if (failed > 0) {
      setError(
        `Could not mark ${failed} notification${failed === 1 ? "" : "s"} as read. The others were updated.`,
      );
    }
    setMarkingAll(false);
  }

  function clearFilters() {
    setQuery("");
    setDateFilter("");
    setActiveTab("all");
  }

  function handleTabKeyDown(event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    setActiveTab(next.id);
    document.getElementById(`np-tab-${next.id}`)?.focus();
  }

  async function togglePreferences() {
    if (!token) return;
    if (prefsOpen) {
      setPrefsOpen(false);
      return;
    }
    setPrefsOpen(true);
    setPrefsError("");
    setPrefsMessage("");
    setPrefsLoading(true);
    try {
      const settings = await getNotificationPreferences(token);
      setPrefs(settings);
    } catch (requestError) {
      setPrefsError(requestError.message || "Unable to load notification preferences.");
    } finally {
      setPrefsLoading(false);
    }
  }

  function updatePreference(field, value) {
    setPrefs((current) => ({ ...current, [field]: value }));
    setPrefsMessage("");
  }

  async function savePreferences() {
    if (!token || !prefs) return;
    setPrefsSaving(true);
    setPrefsError("");
    setPrefsMessage("");
    try {
      await saveNotificationPreferences(token, prefs);
      setPrefsMessage("Preferences saved.");
    } catch (requestError) {
      setPrefsError(requestError.message || "Unable to save notification preferences.");
    } finally {
      setPrefsSaving(false);
    }
  }

  let listContent;
  if (loading) {
    listContent = (
      <div className="np-skeletons" role="status" aria-label="Loading notifications">
        {[0, 1, 2].map((key) => (
          <div className="np-skeleton" key={key} aria-hidden="true" />
        ))}
      </div>
    );
  } else if (notifications.length === 0 && error) {
    listContent = (
      <div className="np-state np-error" role="alert">
        <p>{error}</p>
        <button type="button" className="np-button" onClick={loadNotifications}>
          Try again
        </button>
      </div>
    );
  } else if (notifications.length === 0) {
    listContent = (
      <div className="np-state">
        <Bell size={26} aria-hidden="true" />
        <p>You&rsquo;re all caught up. No notifications yet.</p>
      </div>
    );
  } else if (filteredNotifications.length === 0) {
    listContent = (
      <div className="np-state">
        <Search size={24} aria-hidden="true" />
        <p>No notifications match your filters.</p>
        {filtersActive && (
          <button type="button" className="np-button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  } else {
    listContent = filteredNotifications.map((notification) => {
      const category = TYPE_CATEGORY[notification.type];
      const meta = TYPE_META[category] || DEFAULT_META;
      const Icon = meta.icon;
      return (
        <article
          key={notification.id}
          className={`np-card${notification.is_read ? "" : " np-card-unread"}`}
        >
          <span
            className={`np-type-icon${category ? ` np-type-${category}` : ""}`}
            aria-hidden="true"
          >
            <Icon size={16} />
          </span>
          <div className="np-card-body">
            <div className="np-card-head">
              <h3 className="np-card-title">{notification.title}</h3>
              <time className="np-card-time" dateTime={isoTime(notification.created_at)}>
                {formatWhen(notification.created_at)}
              </time>
            </div>
            <p className="np-card-message">{notification.message}</p>
            <div className="np-card-meta">
              {!notification.is_read && <span className="np-pill np-pill-unread">Unread</span>}
              <span className="np-pill">{meta.label}</span>
            </div>
          </div>
          <div className="np-card-actions">
            <button
              type="button"
              className="np-icon-button"
              title={notification.is_read ? "Mark as unread" : "Mark as read"}
              aria-label={
                notification.is_read
                  ? `Mark "${notification.title}" as unread`
                  : `Mark "${notification.title}" as read`
              }
              disabled={busyId === notification.id}
              onClick={() => toggleRead(notification)}
            >
              {notification.is_read ? <RotateCcw size={14} /> : <Check size={14} />}
            </button>
            <button
              type="button"
              className="np-icon-button dismiss"
              title="Dismiss"
              aria-label={`Dismiss "${notification.title}"`}
              disabled={busyId === notification.id}
              onClick={() => removeNotification(notification)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </article>
      );
    });
  }

  return (
    <main className="notifications-page">
      <header className="np-header">
        <div className="np-header-top">
          <div className="np-heading">
            <h1>Notifications</h1>
            <p>Stay updated with your financial activities and important alerts.</p>
          </div>

          <div className="np-header-tools">
            <div className="np-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications"
                aria-label="Search notifications"
              />
              {query && (
                <button
                  type="button"
                  className="np-search-clear"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="np-date">
              <CalendarDays size={15} aria-hidden="true" />
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                aria-label="Show notifications created on this date"
                title="Show notifications created on this date"
              />
            </div>
            {dateFilter && (
              <button
                type="button"
                className="np-icon-button"
                title="Clear date filter"
                aria-label="Clear date filter"
                onClick={() => setDateFilter("")}
              >
                <X size={14} />
              </button>
            )}

            <div
              className="np-bell"
              title={`${unread} unread notification${unread === 1 ? "" : "s"}`}
            >
              <Bell size={18} aria-hidden="true" />
              <span
                className={`np-bell-badge${unread === 0 ? " np-bell-zero" : ""}`}
                aria-hidden="true"
              >
                {unread > 99 ? "99+" : unread}
              </span>
              <span className="np-sr-only">
                {unread === 0 ? "No unread notifications" : `${unread} unread notifications`}
              </span>
            </div>

            {currentUser && (
              <div className="np-profile">
                <span className="np-profile-avatar" aria-hidden="true">
                  {(currentUser.name || "?").charAt(0).toUpperCase()}
                </span>
                <span className="np-profile-text">
                  <strong>{currentUser.name}</strong>
                  <small>{currentUser.email}</small>
                </span>
              </div>
            )}
          </div>
        </div>

        <nav
          className="np-tabs"
          role="tablist"
          aria-label="Notification categories"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`np-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="np-panel"
              className={`np-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="np-tab-count">{counts[tab.id]}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="np-grid">
        <section
          className="np-list"
          id="np-panel"
          role="tabpanel"
          aria-labelledby={`np-tab-${activeTab}`}
          tabIndex={0}
        >
          {!loading && notifications.length > 0 && error && (
            <p className="np-alert" role="alert">
              {error}
            </p>
          )}
          {listContent}
          {!loading && notifications.length > 0 && (
            <p className="np-footnote">
              Showing {filteredNotifications.length} of {notifications.length} notification
              {notifications.length === 1 ? "" : "s"}.
            </p>
          )}
        </section>

        <aside className="np-sidebar" aria-label="Notification summary and actions">
          <section className="np-panel">
            <h2 className="np-panel-title">Summary</h2>
            <div className="np-stats">
              <div className="np-stat">
                <span className="np-stat-value">{unread}</span>
                <span className="np-stat-label">Unread</span>
              </div>
              <div className="np-stat">
                <span className="np-stat-value">{counts.all - unread}</span>
                <span className="np-stat-label">Read</span>
              </div>
              <div className="np-stat np-stat-alerts">
                <span className="np-stat-value">{counts.alerts}</span>
                <span className="np-stat-label">Alerts</span>
              </div>
              <div className="np-stat np-stat-updates">
                <span className="np-stat-value">{counts.updates}</span>
                <span className="np-stat-label">Updates</span>
              </div>
            </div>
          </section>

          <section className="np-panel">
            <h2 className="np-panel-title">Quick Actions</h2>
            <button
              type="button"
              className="np-action"
              onClick={markAllRead}
              disabled={unread === 0 || markingAll || loading || !token}
            >
              <CheckCheck size={16} aria-hidden="true" />
              {markingAll ? "Marking all as read…" : "Mark all as read"}
            </button>
            <button
              type="button"
              className="np-action"
              aria-expanded={prefsOpen}
              aria-controls="np-preferences"
              onClick={togglePreferences}
              disabled={!token}
            >
              <Settings size={16} aria-hidden="true" />
              Notification preferences
            </button>

            {prefsOpen && (
              <div className="np-prefs" id="np-preferences">
                {prefsLoading ? (
                  <p className="np-prefs-note">Loading preferences…</p>
                ) : prefs ? (
                  <>
                    <label className="np-pref-row">
                      <span>
                        <strong>Budget alerts</strong>
                        <small>Large expenses and overspending</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(prefs.budget_alerts)}
                        onChange={(event) =>
                          updatePreference("budget_alerts", event.target.checked)
                        }
                      />
                    </label>
                    <label className="np-pref-row">
                      <span>
                        <strong>Monthly report</strong>
                        <small>Monthly income and spending summary</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(prefs.monthly_report)}
                        onChange={(event) =>
                          updatePreference("monthly_report", event.target.checked)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="np-button np-button-primary"
                      onClick={savePreferences}
                      disabled={prefsSaving}
                    >
                      {prefsSaving ? "Saving…" : "Save preferences"}
                    </button>
                    {prefsError && (
                      <p className="np-prefs-error" role="alert">
                        {prefsError}
                      </p>
                    )}
                    {prefsMessage && (
                      <p className="np-prefs-success" role="status">
                        {prefsMessage}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="np-prefs-error" role="alert">
                    {prefsError || "Unable to load notification preferences."}
                  </p>
                )}
              </div>
            )}

            <p className="np-prefs-note">
              Preferences control future budget alerts and monthly summaries.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default NotificationsPage;
