

import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import "./Settings.css";

const SETTINGS_API = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/settings/`;

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
  onChangePassword,
  onDeleteAccount,
  isPremium = false,
  onUpgrade,
}) {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState({
    ...defaultSettings,
    darkMode: localStorage.getItem("budgetbuddy-theme") === "dark",
    ...(savedSettings || {}),
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const theme = preferences.darkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("budgetbuddy-theme", theme);
  }, [preferences.darkMode]);
  
useEffect(() => {
  async function loadSettings() {
    try {
      const response = await fetch(SETTINGS_API, {
        headers: { Authorization: `Bearer ${token}` },
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
      console.error(error);
    }
  }

  loadSettings();
}, [token]);

async function updateSetting(key, value) {
// Two-factor authentication is not supported by the current backend.
if (key === "twoFactorAuth") {
  setStatus(
    "Two-factor authentication is not connected to the backend yet."
  );
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
    // Restore the last known values if the save failed.
    setPreferences(previous);

    console.error("Settings save error:", error);

    setStatus(
      error instanceof TypeError
        ? "Could not connect to the settings API. Check the server and CORS configuration."
        : `Could not save settings: ${error.message}`
    );
  }
}



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

  async function changePassword() {
    if (!onChangePassword) {
      setStatus(
        "Password change is not connected to the authentication service yet."
      );
      return;
    }

    try {
      await onChangePassword();
    } catch {
      setStatus("Password change could not be completed.");
    }
  }

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
      setStatus("Account deletion failed. Please try again.");
    }

    setShowDeleteConfirm(false);
  }

  return (
    <main className="settings-page">
      {!isPremium && (
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
          </div>

          <button
            className="upgrade-button"
            type="button"
            onClick={() => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                setStatus(
                  "Premium upgrade is not connected yet."
                );
              }
            }}
          >
            ♛ Upgrade
          </button>
        </section>
      )}

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
            <p>Comprehensive monthly financial report</p>
          </div>
          {toggle("monthlyReport")}
        </div>
      </section>

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

      <section className="settings-card">
        <h2 className="settings-card-title">
          <span>♢</span> Security &amp; Privacy
        </h2>

        <div className="settings-row">
          <div>
            <h3>Two-Factor Authentication</h3>
            <p>Not available yet; this account is not protected by two-factor authentication.</p>
          </div>
          {toggle("twoFactorAuth")}
        </div>

        <div className="settings-row">
          <div>
            <h3>Change Password</h3>
            <p>Update your account password</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={changePassword}
          >
            Change <span>›</span>
          </button>
        </div>
      </section>

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
            <p>Permanently remove your account and all data</p>
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

      {showDeleteConfirm && (
        <div className="settings-dialog-backdrop">
          <section
            className="settings-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete account?</h2>
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

      {status && (
        <p className="settings-status" role="status">
          {status}
        </p>
      )}
    </main>
  );
}

export default Settings;
