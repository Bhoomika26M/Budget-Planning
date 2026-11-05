import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AlertTriangle, CheckCircle, Chrome, Eye, Github, Lock, Trash2 } from "lucide-react";
import Card from "../components/Cards/Card";
import HelpFeedbackCard from "../components/Cards/HelpFeedbackCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toProfile } from "../services/mappers";

export default function SettingsScreen() {
  const { dark, setDark } = useOutletContext();
  const { user: profile, setUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const prefs = { email: profile.pref_email, reports: profile.pref_reports, alerts: profile.pref_alerts };
  const [oauthProviders, setOauthProviders] = useState({ google: false, github: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.oauthProviders().then(setOauthProviders).catch(() => {});
  }, []);

  async function togglePref(key) {
    try {
      await updateProfile({ [key]: !profile[key] });
      showToast("Preferences saved.");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function deleteAccount() {
    try {
      await api.deleteAccount();
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setShowDeleteConfirm(false);
      showToast(err.message, "error");
    }
  }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  function showToast(msg, type = "success") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  }
  async function handleChangePassword() {
    if (!curPwd) {
      setPwdError("Enter your current password.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(curPwd, newPwd);
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdError("");
      showToast("Password updated successfully!");
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2"
          style={{
            background:
              toastType === "success"
                ? "linear-gradient(135deg, #2E93C7, #0D6D91)"
                : "linear-gradient(135deg, #e53e3e, #c53030)",
          }}
        >
          {toastType === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast}
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Delete Account</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All your data — expenses, budgets, savings goals — will be permanently deleted. Are you
              absolutely sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #e53e3e, #c53030)",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your preferences and account security</p>
      </div>

      {/* Preferences */}
      <Card className="p-5 space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-3">Preferences</h3>
        {[
          {
            key: "dark",
            label: "Dark Mode",
            desc: "Switch to dark interface",
            value: dark,
            toggle: () => setDark(!dark),
          },
          {
            key: "email",
            label: "Email Notifications",
            desc: "Receive account emails (needs SendGrid on the server)",
            value: prefs.email,
            toggle: () => togglePref("pref_email"),
          },
          {
            key: "reports",
            label: "Monthly Reports",
            desc: "Notify me when last month's report is ready",
            value: prefs.reports,
            toggle: () => togglePref("pref_reports"),
          },
          {
            key: "alerts",
            label: "Spending Alerts",
            desc: "Budget limit, goal deadline & savings reminders",
            value: prefs.alerts,
            toggle: () => togglePref("pref_alerts"),
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={item.toggle}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${item.value ? "bg-primary" : "bg-switch-background"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${item.value ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Change Password */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Change Password</h3>
        <div className="space-y-4">
          {pwdError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{pwdError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={curPwd}
                onChange={(e) => {
                  setCurPwd(e.target.value);
                  setPwdError("");
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Enter current password"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showNewPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => {
                  setNewPwd(e.target.value);
                  setPwdError("");
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye size={14} />
              </button>
            </div>
            {newPwd && (
              <div className="mt-1.5 flex gap-1 items-center">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background:
                        newPwd.length >= i * 3
                          ? newPwd.length >= 10
                            ? "#22c55e"
                            : newPwd.length >= 7
                              ? "#f59e0b"
                              : "#e53e3e"
                          : "var(--muted)",
                    }}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {newPwd.length >= 10 ? "Strong" : newPwd.length >= 7 ? "Medium" : "Weak"}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => {
                  setConfirmPwd(e.target.value);
                  setPwdError("");
                }}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${confirmPwd && confirmPwd !== newPwd ? "border-red-300" : "border-border"}`}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
          >
            {busy ? "Updating…" : "Update Password"}
          </button>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          {[
            {
              name: "Google",
              icon: Chrome,
              email: profile.email,
            },
            {
              name: "GitHub",
              icon: Github,
              email: profile.email,
            },
          ].map((a) => {
            const provider = a.name.toLowerCase();
            const isConnected = profile.oauth_provider === provider;
            return (
              <div
                key={a.name}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <a.icon size={18} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{isConnected ? a.email : "Not connected"}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (isConnected) {
                      try {
                        setUser(toProfile(await api.unlinkOAuth()));
                        showToast(`${a.name} disconnected successfully!`);
                      } catch (err) {
                        showToast(err.message, "error");
                      }
                    } else if (oauthProviders[provider]) {
                      // Signing in with the provider links it to this email address.
                      window.location.href = api.oauthLoginUrl(provider);
                    } else {
                      showToast(`${a.name} sign-in is not configured on the server yet.`, "error");
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={
                    isConnected
                      ? {
                          border: "1px solid var(--border)",
                          color: "var(--muted-foreground)",
                        }
                      : {
                          background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                          color: "#fff",
                        }
                  }
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Help & feedback (shows up in the admin Feedback / Reported Issues tabs) */}
      <HelpFeedbackCard onDone={(msg) => showToast(msg)} onError={(msg) => showToast(msg, "error")} />

      {/* Danger Zone */}
      <Card
        className="p-5 border-red-100"
        style={{
          borderColor: "#fecaca",
        }}
      >
        <h3 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Once deleted, your account and all data cannot be recovered.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} /> Delete Account
        </button>
      </Card>
    </div>
  );
}
