
import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import "./Settings.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const SETTINGS_API = `${API_BASE}/settings/`;
const AUTH_API = `${API_BASE}/auth`;

const defaultSettings = {
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  billReminders: true,
  weeklyReport: false,
  monthlyReport: true,
  darkMode: false,
  twoFactorAuth: false,
  currency: "INR",
  language: "English",
};

function Settings({
  settings: savedSettings,
  onSettingChange,
  transactions = [],
  onExportData,
  onDeleteAccount,
  isPremium = false,
}) {
  const { token, updatePremiumStatus, currentUser } = useAuth();

  const [premiumActive, setPremiumActive] = useState(
    Boolean(currentUser?.is_premium || isPremium)
  );

  const [premiumRequestStatus, setPremiumRequestStatus] =
    useState("none");

  const [upgrading, setUpgrading] = useState(false);

  const [preferences, setPreferences] = useState({
    ...defaultSettings,
    darkMode: localStorage.getItem("budgetbuddy-theme") === "dark",
    ...(savedSettings || {}),
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  const [status, setStatus] = useState("");

  // Load Premium request status from backend
  useEffect(() => {
    let cancelled = false;

    async function loadPremiumStatus() {
      if (!token) return;

      try {
        const response = await fetch(
          `${AUTH_API}/premium-request/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load Premium status."
          );
        }

        if (cancelled) return;

        const approved = Boolean(data.is_premium);

        setPremiumActive(approved);
        setPremiumRequestStatus(data.status || "none");

        updatePremiumStatus(approved);
      } catch (error) {
        console.error("Premium status error:", error);
      }
    }

    loadPremiumStatus();

    // Refresh status when user returns to the Settings page
    const handleFocus = () => {
      loadPremiumStatus();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, updatePremiumStatus]);

  // Apply dark mode
  useEffect(() => {
    const theme = preferences.darkMode ? "dark" : "light";

    document.documentElement.dataset.theme = theme;
    localStorage.setItem("budgetbuddy-theme", theme);

    window.dispatchEvent(new Event("budgetbuddy-theme-change"));
  }, [preferences.darkMode]);

  // Sync theme changes from navbar
  useEffect(() => {
    const syncFromNavbar = () => {
      const isDark =
        document.documentElement.dataset.theme === "dark";

      setPreferences((previous) =>
        previous.darkMode === isDark
          ? previous
          : { ...previous, darkMode: isDark }
      );
    };

    window.addEventListener(
      "budgetbuddy-theme-change",
      syncFromNavbar
    );

    return () =>
      window.removeEventListener(
        "budgetbuddy-theme-change",
        syncFromNavbar
      );
  }, []);

  // Load settings from backend
  useEffect(() => {
    async function loadSettings() {
      if (!token) return;

      try {
        const response = await fetch(SETTINGS_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load settings");
        }

        const data = await response.json();

        setPreferences((previous) => ({
          ...previous,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          budgetAlerts: data.budget_alerts,
          billReminders: data.bill_reminders,
          weeklyReport: data.weekly_report,
          monthlyReport: data.monthly_report,
          darkMode: data.dark_mode,
          currency: data.currency,
          language: data.language,
        }));
      } catch (error) {
        setStatus("Could not load settings from the server.");
        console.error("Settings loading error:", error);
      }
    }

    loadSettings();
  }, [token]);

  // Update settings
  async function updateSetting(key, value) {
    if (key === "twoFactorAuth") {
      setStatus(
        "Two-factor authentication is not connected to the backend yet."
      );
      return;
    }

    if (!token) {
      setStatus("Please log in to update your settings.");
      return;
    }

    const previous = { ...preferences };
    const updated = { ...previous, [key]: value };

    setPreferences(updated);
    setStatus("");

    const payload = {
      email_notifications: updated.emailNotifications,
      push_notifications: updated.pushNotifications,
      budget_alerts: updated.budgetAlerts,
      bill_reminders: updated.billReminders,
      weekly_report: updated.weeklyReport,
      monthly_report: updated.monthlyReport,
      dark_mode: updated.darkMode,
      currency: updated.currency,
      language: updated.language,
    };

    try {
      const response = await fetch(SETTINGS_API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${
            responseText || response.statusText
          }`
        );
      }

      setStatus("Settings saved successfully.");

      if (onSettingChange) {
        onSettingChange(key, value);
      }
    } catch (error) {
      setPreferences(previous);

      console.error("Settings save error:", error);

      setStatus(
        error instanceof TypeError
          ? "Could not connect to the settings API. Check the server and CORS configuration."
          : `Could not save settings: ${error.message}`
      );
    }
  }

  // Submit Premium request for administrator approval
  async function upgradePremium() {
    if (!token || upgrading) return;

    setUpgrading(true);
    setStatus("");

    try {
      const response = await fetch(
        `${AUTH_API}/premium-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to submit Premium request."
        );
      }

      setPremiumRequestStatus(data.status || "pending");

      // Do not activate Premium here.
      // Only administrator approval can activate it.
      setStatus(
        data.message ||
          "Your Premium request has been submitted. Waiting for administrator approval."
      );
    } catch (error) {
      console.error("Premium request error:", error);

      setStatus(
        error.message || "Could not submit Premium request."
      );
    } finally {
      setUpgrading(false);
    }
  }

  // Open password popup
  function openPasswordModal() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("");
    setShowPasswordModal(true);
  }

  // Close password popup
  function closePasswordModal() {
    if (changingPassword) return;

    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  // Change password through backend
  async function changePassword(event) {
    event.preventDefault();

    if (!token) {
      setStatus("Please log in to change your password.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setStatus(
        "New password must be different from the current password."
      );
      return;
    }

    setChangingPassword(true);
    setStatus("");

    try {
      const response = await fetch(
        `${AUTH_API}/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Password change failed."
        );
      }

      setStatus(
        data.message || "Password changed successfully!"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Password change error:", error);

      setStatus(
        error.message || "Could not change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  // Toggle settings
  function toggle(key) {
    const checked = Boolean(preferences[key]);

    return (
      <button
        type="button"
        className={`settings-switch ${checked ? "active" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={key}
        disabled={key === "twoFactorAuth"}
        onClick={() => updateSetting(key, !checked)}
      >
        <span />
      </button>
    );
  }

  // Export transactions as CSV
  function exportTransactions() {
    if (onExportData) {
      onExportData();
      return;
    }

    if (!transactions.length) {
      setStatus(
        "No transaction records are available to export."
      );
      return;
    }

    const columns = [
      "date",
      "description",
      "category",
      "type",
      "amount",
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      columns.join(","),
      ...transactions.map((transaction) =>
        columns
          .map((column) => escapeCSV(transaction[column]))
          .join(",")
      ),
    ];

    const blob = new Blob(
      ["\uFEFF" + rows.join("\r\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "budgetbuddy-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);

    setStatus("Transaction export downloaded.");
  }

  // Delete account
  async function deleteAccount() {
    if (!onDeleteAccount) {
      setStatus(
        "Account deletion is not connected to the backend yet."
      );

      setShowDeleteConfirm(false);
      return;
    }

    try {
      await onDeleteAccount();
    } catch {
      setStatus(
        "Account deletion failed. Please try again."
      );
    }

    setShowDeleteConfirm(false);
  }

  return (
    <main className="settings-page">

      {/* Premium Banner */}
      {!premiumActive && (
        <section className="premium-banner">
          <div className="premium-copy">
            <h2>
              <span aria-hidden="true">♛</span>
              Upgrade to Premium
              <span className="free-badge">FREE</span>
            </h2>

            <p>
              Unlock full Analytics, AI financial insights,
              advanced reports, and more.
            </p>

            <div className="premium-features">
              <span>✦ Full Analytics</span>
              <span>✦ AI Insights</span>
              <span>✦ Advanced Reports</span>
              <span>✦ Priority Support</span>
            </div>

            {premiumRequestStatus === "pending" && (
              <p className="premium-request-message" role="status">
                Your Premium request is pending administrator
                approval.
              </p>
            )}

            {premiumRequestStatus === "rejected" && (
              <p className="premium-request-message" role="status">
                Your previous request was rejected. You can
                submit another request.
              </p>
            )}
          </div>

          <button
            className="upgrade-button"
            type="button"
            onClick={upgradePremium}
            disabled={
              upgrading || premiumRequestStatus === "pending"
            }
          >
            {upgrading
              ? "Submitting..."
              : premiumRequestStatus === "pending"
                ? "Request Pending"
                : "♛ Request Premium"}
          </button>
        </section>
      )}

      {/* Notifications */}
      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>♧</span> Notifications
        </h2>

        <div className="settings-row">
          <div>
            <h3>Email Notifications</h3>
            <p>Receive summaries and alerts by email</p>
          </div>
          {toggle("emailNotifications")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Push Notifications</h3>
            <p>Get real-time alerts on your device</p>
          </div>
          {toggle("pushNotifications")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Budget Alerts</h3>
            <p>Alert when approaching budget limits</p>
          </div>
          {toggle("budgetAlerts")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Bill Reminders</h3>
            <p>Upcoming bill payment reminders</p>
          </div>
          {toggle("billReminders")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Weekly Report</h3>
            <p>Summary of your weekly finances</p>
          </div>
          {toggle("weeklyReport")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Monthly Report</h3>
            <p>Comprehensive monthly report</p>
          </div>
          {toggle("monthlyReport")}
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>☾</span> Appearance
        </h2>

        <div className="settings-row">
          <div>
            <h3>Dark Mode</h3>
            <p>Switch to dark theme for reduced eye strain</p>
          </div>
          {toggle("darkMode")}
        </div>
      </section>

      {/* Preferences */}
      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>◎</span> Preferences
        </h2>

        <div className="settings-row">
          <div>
            <h3>Currency</h3>
            <p>Display currency for amounts</p>
          </div>

          <select
            value={preferences.currency}
            onChange={(event) =>
              updateSetting("currency", event.target.value)
            }
            aria-label="Currency"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>

        <div className="settings-row">
          <div>
            <h3>Language</h3>
            <p>App language preference</p>
          </div>

          <select
            value={preferences.language}
            onChange={(event) =>
              updateSetting("language", event.target.value)
            }
            aria-label="Language"
          >
            <option value="English">English</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </section>

      {/* Security and Privacy */}
      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>♢</span> Security &amp; Privacy
        </h2>

        <div className="settings-row">
          <div>
            <h3>Change Password</h3>
            <p>Update your account password</p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={openPasswordModal}
          >
            Change <span>›</span>
          </button>
        </div>
      </section>

      {/* Data Management */}
      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>⇩</span> Data Management
        </h2>

        <div className="settings-row">
          <div>
            <h3>Export Data</h3>
            <p>Download your transactions as CSV</p>
          </div>

          <button
            className="success-button"
            type="button"
            onClick={exportTransactions}
          >
            ⇩ Export CSV
          </button>
        </div>

        <div className="settings-row">
          <div>
            <h3>Delete Account</h3>
            <p>
              Permanently remove your account and all data
            </p>
          </div>

          <button
            className="danger-button"
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </section>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="settings-dialog-backdrop">
          <section
            className="settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
          >
            <h2 id="password-title">Change Password</h2>

            <form onSubmit={changePassword}>
              <div className="password-form-group">
                <label htmlFor="current-password">
                  Current Password
                </label>

                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="password-form-group">
                <label htmlFor="new-password">
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="password-form-group">
                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="dialog-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                >
                  Cancel
                </button>

                <button
                  className="success-button"
                  type="submit"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <div className="settings-dialog-backdrop">
          <section
            className="settings-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">
              Delete account?
            </h2>

            <p>
              This action may permanently remove your account
              and associated data. Continue only if you are sure.
            </p>

            <div className="dialog-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                type="button"
                onClick={deleteAccount}
              >
                Confirm deletion
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <p className="settings-status" role="status">
          {status}
        </p>
      )}

    </main>
  );
}

export default Settings;
