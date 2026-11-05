import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, Lock, Mail, X, Zap } from "lucide-react";
import api from "../../../services/api";

// ── Forgot-password modal ──────────────────────────────────────────
export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(""); // only returned when no email service is configured
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function sendOtp() {
    return call(async () => {
      const res = await api.forgotPassword(email.trim());
      setDevOtp(res.dev_otp || "");
      setOtp("");
      setStep("otp");
    });
  }

  function handleEmailSubmit() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    sendOtp();
  }
  function handleOtpSubmit() {
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    call(async () => {
      await api.verifyOtp(email.trim(), otp.trim());
      setStep("reset");
    });
  }
  function handleReset() {
    if (newPwd.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    call(async () => {
      await api.resetPassword(email.trim(), otp.trim(), newPwd);
      setStep("done");
    });
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
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border"
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
              <Lock size={13} className="text-white" />
            </div>
            <h3 className="text-base font-semibold font-['Poppins'] text-foreground">
              {step === "done" ? "Password Reset!" : "Forgot Password"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Step indicators */}
          {step !== "done" && (
            <div className="flex items-center gap-1.5 mb-2">
              {["email", "otp", "reset"].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step === s ? "text-white" : ["email", "otp", "reset"].indexOf(step) > i ? "text-white" : "text-muted-foreground border border-border bg-muted"}`}
                    style={
                      step === s || ["email", "otp", "reset"].indexOf(step) > i
                        ? {
                            background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                          }
                        : {}
                    }
                  >
                    {["email", "otp", "reset"].indexOf(step) > i ? "✓" : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-px w-8 ${["email", "otp", "reset"].indexOf(step) > i ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {step === "email" ? "Enter email" : step === "otp" ? "Verify OTP" : "New password"}
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {step === "email" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your registered email address and we&apos;ll send you a verification code.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleEmailSubmit}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                }}
              >
                Send OTP
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a 6-digit OTP to <span className="font-medium text-foreground">{email}</span>.
              </p>
              {/* Demo hint – shown only when the server has no e-mail service configured */}
              {devOtp && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <Zap size={13} className="text-primary shrink-0" />
                  <p className="text-xs text-primary">
                    Demo OTP: <span className="font-bold tracking-widest">{devOtp}</span>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Enter OTP</label>
                <input
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleOtpSubmit()}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm text-center tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                onClick={handleOtpSubmit}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                }}
              >
                Verify OTP
              </button>
              <button onClick={sendOtp} disabled={busy} className="w-full text-xs text-primary hover:underline disabled:opacity-60">
                Resend OTP
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <p className="text-sm text-muted-foreground">Choose a strong new password for your account.</p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={newPwd}
                    onChange={(e) => {
                      setNewPwd(e.target.value);
                      setError("");
                    }}
                    type={showNewPwd ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="Min. 6 characters"
                    autoFocus
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
                  <div className="mt-1.5 flex gap-1">
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
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={confirmPwd}
                    onChange={(e) => {
                      setConfirmPwd(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    type="password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${confirmPwd && confirmPwd !== newPwd ? "border-red-300" : "border-border"}`}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                }}
              >
                Reset Password
              </button>
            </>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #22c55e20, #16a34a20)",
                  border: "1.5px solid #22c55e30",
                }}
              >
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div>
                <h4 className="text-base font-bold font-['Poppins'] text-foreground">Password Reset!</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
