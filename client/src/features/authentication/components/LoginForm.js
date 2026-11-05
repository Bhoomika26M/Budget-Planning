import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Chrome,
  Crown,
  Eye,
  Github,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import ForgotPasswordModal from "./ForgotPasswordModal";
import CreateAccountModal from "./SignupForm";
import AuthPanel from "./AuthPanel";
import { ROLE_META } from "../../../data/constants";

// ── Login ──────────────────────────────────────────────────────────
export const DEMO_ROLES = [
  {
    role: "student",
    label: "Student",
    email: "john.doe@budgetbuddy.in",
    
    icon: GraduationCap,
    desc: "Basic access",
  },
  {
    role: "premium",
    label: "Premium User",
    email: "premium@budgetbuddy.in",
    
    icon: Crown,
    desc: "Full feature access",
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@budgetbuddy.in",
    icon: ShieldCheck,
    desc: "User management",
  },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false, github: false });

  // Which social logins are configured on the server + errors coming back from OAuth.
  useEffect(() => {
    api.oauthProviders().then(setOauthProviders).catch(() => {});
    const oauthError = searchParams.get("oauth_error");
    if (oauthError === "suspended") setError("Your account has been suspended. Please contact support.");
    else if (oauthError) setError("Social sign-in failed. Please try again or use your email and password.");
    if (searchParams.get("signup")) setShowCreate(true);
  }, [searchParams]);

  function socialLogin(provider) {
    if (!oauthProviders[provider]) {
      setError(
        `${provider === "google" ? "Google" : "GitHub"} sign-in isn't configured on this server yet (see README → OAuth). Use email & password for now.`
      );
      return;
    }
    window.location.href = api.oauthLoginUrl(provider);
  }
  function selectRole(r) {
    const demo = DEMO_ROLES.find((d) => d.role === r);
    setSelectedRole(r);
    setEmail(demo.email);
    setPwd("");
    setError("");
  }
  function attempt(emailOverride, pwdOverride) {
    if (loading) return;
    const e = (emailOverride ?? email).trim().toLowerCase();
    const p = pwdOverride ?? pwd;
    setError("");
    if (!e) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(e)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!p) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    login(e, p, remember)
      .then((me) => navigate(me.role === "admin" ? "/admin-dashboard" : "/", { replace: true }))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }
  return (
    <div className="min-h-screen flex">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onCreated={(newEmail) => {
            setShowCreate(false);
            setSelectedRole(null);
            setEmail(newEmail);
            setPwd("");
            setError("");
            setCreateSuccess(true);
            setTimeout(() => setCreateSuccess(false), 4000);
          }}
        />
      )}

      <AuthPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Wallet size={20} className="text-primary" />
            <span className="font-bold text-lg font-['Poppins'] text-foreground">BudgetBuddy</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground font-['Poppins'] mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your money</p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Sign in as
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ROLES.map((d) => {
                const meta = ROLE_META[d.role];
                const active = selectedRole === d.role;
                return (
                  <button
                    key={d.role}
                    onClick={() => selectRole(d.role)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                    style={
                      active
                        ? {
                            borderColor: meta.color,
                            background: meta.bg,
                          }
                        : {
                            borderColor: "var(--border)",
                            background: "var(--card)",
                          }
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{
                        background: active ? `${meta.color}20` : "var(--secondary)",
                      }}
                    >
                      <d.icon
                        size={20}
                        style={{
                          color: active ? meta.color : "var(--muted-foreground)",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{
                          color: active ? meta.color : "var(--foreground)",
                        }}
                      >
                        {d.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                    </div>
                    {active && (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          background: meta.color,
                        }}
                      >
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedRole ? (
              <div
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: ROLE_META[selectedRole].bg,
                }}
              >
                <Zap
                  size={12}
                  style={{
                    color: ROLE_META[selectedRole].color,
                  }}
                  className="shrink-0"
                />
                <p
                  className="text-[11px]"
                  style={{
                    color: ROLE_META[selectedRole].color,
                  }}
                >
                  Demo <strong>{ROLE_META[selectedRole].label}</strong> account filled in — enter password & press Sign in
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                <Zap size={12} className="text-muted-foreground shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  Pick a demo role above, or sign in with your own account
                </p>
              </div>
            )}
          </div>

          {createSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 border border-green-200 bg-green-50">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                Account created! Sign in with your new credentials.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 border border-red-200 bg-red-50">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && attempt()}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${error && !email ? "border-red-300" : "border-border"}`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && attempt()}
                  type={showPwd ? "text" : "password"}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${error && !pwd ? "border-red-300" : "border-border"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setRemember((v) => !v)}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${remember ? "bg-primary border-primary" : "border-border"}`}
                >
                  {remember && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={() => attempt()}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in to BudgetBuddy"
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Google",
                  icon: Chrome,
                },
                {
                  label: "GitHub",
                  icon: Github,
                },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => socialLogin(label.toLowerCase())}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="text-primary font-semibold hover:underline"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
