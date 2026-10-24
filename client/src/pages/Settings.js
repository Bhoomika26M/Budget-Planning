
import React, { useEffect, useState } from "react";
import {
  UserRound,
  Bell,
  Palette,
  Wallet,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import "./Settings.css";

const SETTINGS_KEY = "budgetbuddy_settings_v1";

const DEFAULT_SETTINGS = {
  fullName: "Anna Grace",
  email: "",
  currency: "INR",
  monthlyBudget: "30000",
  budgetAlerts: true,
  savingsReminders: true,
  weeklySummary: true,
  emailNotifications: false,
  theme: "light",
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch {
      // Keep defaults if saved settings cannot be read.
    }
  }, []);

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaved(false);
  }

  function saveSettings(event) {
    event.preventDefault();

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSaved(true);

      if (settings.theme === "dark") {
        document.documentElement.dataset.theme = "dark";
      } else {
        delete document.documentElement.dataset.theme;
      }
    } catch {
      setSaved(false);
      window.alert("Unable to save settings in this browser.");
    }
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    delete document.documentElement.dataset.theme;
    setSaved(false);
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">PERSONALIZE YOUR EXPERIENCE</span>
          <h1>Settings</h1>
          <p>Manage your profile, financial preferences, and notifications.</p>
        </div>
      </header>

      {saved && (
        <div className="settings-success" role="status">
          <CheckCircle2 size={19} />
          Your settings have been saved successfully.
        </div>
      )}

      <form onSubmit={saveSettings}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon profile">
              <UserRound size={21} />
            </div>
            <div>
              <h2>Profile information</h2>
              <p>Manage your personal details.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              Full name
              <input
                type="text"
                value={settings.fullName}
                onChange={(event) =>
                  updateSetting("fullName", event.target.value)
                }
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={settings.email}
                onChange={(event) =>
                  updateSetting("email", event.target.value)
                }
              />
            </label>
          </div>

          <p className="settings-note">
            These profile fields are saved locally and do not change your login
            account details.
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon finance">
              <Wallet size={21} />
            </div>
            <div>
              <h2>Financial preferences</h2>
              <p>Set your default currency and monthly budget.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              Preferred currency
              <select
                value={settings.currency}
                onChange={(event) =>
                  updateSetting("currency", event.target.value)
                }
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </label>

            <label>
              Monthly budget
              <input
                type="number"
                min="0"
                step="100"
                value={settings.monthlyBudget}
                onChange={(event) =>
                  updateSetting("monthlyBudget", event.target.value)
                }
                required
              />
            </label>
          </div>

          <p className="settings-note">
            These preferences do not automatically change the budgets already
            stored in your planner.
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon notifications">
              <Bell size={21} />
            </div>
            <div>
              <h2>Notification preferences</h2>
              <p>Choose which financial updates you want to see.</p>
            </div>
          </div>

          <div className="settings-options">
            <label className="settings-toggle-row">
              <span>
                <strong>Budget alerts</strong>
                <small>Get notified when spending approaches a budget limit.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(event) =>
                  updateSetting("budgetAlerts", event.target.checked)
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <strong>Savings reminders</strong>
                <small>Stay on track with your savings goals.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.savingsReminders}
                onChange={(event) =>
                  updateSetting("savingsReminders", event.target.checked)
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <strong>Weekly summary</strong>
                <small>Review your spending and income activity.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.weeklySummary}
                onChange={(event) =>
                  updateSetting("weeklySummary", event.target.checked)
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <strong>Email notifications</strong>
                <small>Preference for future email notification support.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(event) =>
                  updateSetting("emailNotifications", event.target.checked)
                }
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-heading-icon appearance">
              <Palette size={21} />
            </div>
            <div>
              <h2>Appearance</h2>
              <p>Choose your preferred display theme.</p>
            </div>
          </div>

          <div className="settings-theme-options">
            <label
              className={`settings-theme-choice ${
                settings.theme === "light" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === "light"}
                onChange={() => updateSetting("theme", "light")}
              />
              <span className="settings-theme-preview light-preview" />
              <span>Light mode</span>
            </label>

            <label
              className={`settings-theme-choice ${
                settings.theme === "dark" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === "dark"}
                onChange={() => updateSetting("theme", "dark")}
              />
              <span className="settings-theme-preview dark-preview" />
              <span>Dark mode</span>
            </label>
          </div>

          <p className="settings-note">
            Dark mode applies a theme attribute to the document. Your other
            pages need matching CSS rules to display fully in dark mode.
          </p>
        </section>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset-button"
            onClick={resetSettings}
          >
            <RotateCcw size={17} />
            Reset settings
          </button>

          <button type="submit" className="settings-save-button">
            <Save size={17} />
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
