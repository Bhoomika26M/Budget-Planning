import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, Lock, Mail, Wallet, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// ── Create-account modal ───────────────────────────────────────────
export default function CreateAccountModal({ onCreated, onClose }) {
  const { register } = useAuth();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  async function handleCreate() {
    if (busy) return;
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (pwd.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms & Privacy Policy.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await register({ name, email, password: pwd });
      onCreated(email.trim().toLowerCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(12,42,69,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
              }}
            >
              <Wallet size={13} className="text-white" />
            </div>
            <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Create Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Join thousands of people managing their finances smarter.
          </p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              placeholder="e.g. Rahul Sharma"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  setError("");
                }}
                type={showPwd ? "text" : "password"}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye size={14} />
              </button>
            </div>
            {pwd && (
              <div className="mt-1.5 flex gap-1 items-center">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background:
                        pwd.length >= i * 3
                          ? pwd.length >= 10
                            ? "#22c55e"
                            : pwd.length >= 7
                              ? "#f59e0b"
                              : "#e53e3e"
                          : "var(--muted)",
                    }}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {pwd.length >= 10 ? "Strong" : pwd.length >= 7 ? "Medium" : "Weak"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={confirmPwd}
                onChange={(e) => {
                  setConfirmPwd(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                type="password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${confirmPwd && confirmPwd !== pwd ? "border-red-300" : "border-border"}`}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer" onClick={() => setAgree((v) => !v)}>
            <div
              className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${agree ? "bg-primary border-primary" : "border-border"}`}
            >
              {agree && <CheckCircle size={10} className="text-white" />}
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the <span className="text-primary font-medium">Terms of Service</span> and{" "}
              <span className="text-primary font-medium">Privacy Policy</span>
            </span>
          </label>

          <button
            onClick={handleCreate}
            disabled={busy}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
          >
            {busy ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={onClose} className="text-primary font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
