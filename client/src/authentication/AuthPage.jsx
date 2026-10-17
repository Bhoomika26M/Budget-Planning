import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PiggyBank,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import "./auth.css";

const portals = [
  { id: "student", label: "Student" },
  { id: "premium", label: "Premium" },
  { id: "admin", label: "Admin" },
];

export default function AuthPage() {
  const { login, register, sessionError } = useAuth();
  const [portal, setPortal] = useState("student");
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const adminMode = portal === "admin";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (registering) {
        await register(form);
        setRegistering(false);
        setNotice("Account created. Sign in with your new credentials.");
      } else {
        await login(form.email.trim(), form.password, portal);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`auth-screen${adminMode ? " auth-screen-admin" : ""}`}>
      <section className="auth-brand-panel">
        <a className="auth-brand" href="/" aria-label="BudgetBuddy home">
          <span className="auth-brand-icon"><PiggyBank size={25} /></span>
          <span>BudgetBuddy</span>
        </a>
        <div className="auth-brand-copy">
          <span className="auth-eyebrow">{adminMode ? "Admin Control Center" : "Student Finance Platform"}</span>
          <h1>{adminMode ? "Platform administration & insights" : "Take control of your student finances"}</h1>
          <p>{adminMode
            ? "Manage user roles and access to the BudgetBuddy platform."
            : "Sign in to manage your income and keep your finances organized."}</p>
          {!adminMode && (
            <ul className="auth-highlights">
              <li><span><Activity size={18} /></span><div><strong>Track your money</strong><small>Keep your income records in one place.</small></div></li>
              <li><span><BarChart3 size={18} /></span><div><strong>See your progress</strong><small>Understand your finances with real records.</small></div></li>
              <li><span><Shield size={18} /></span><div><strong>Private by account</strong><small>Your account data requires your sign-in.</small></div></li>
            </ul>
          )}
        </div>
        <div className="auth-brand-footer">
          <span>{adminMode ? "Restricted access" : "Student accounts"}</span>
          <span>{adminMode ? "Role-managed" : "Secure sign in"}</span>
          <span>{adminMode ? "Audit carefully" : "Built for budgeting"}</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand"><PiggyBank size={24} /> BudgetBuddy</div>
          <div className="auth-card-heading">
            <span className="auth-card-icon">{adminMode ? <Shield size={24} /> : <UserRound size={24} />}</span>
            <h2>{registering ? "Create your account" : adminMode ? "Admin Portal" : "Welcome back"}</h2>
            <p>{registering ? "Start with a Student account. An administrator can change roles later." : adminMode ? "Restricted access for authorized administrators." : "Sign in to continue to your account."}</p>
          </div>

          <div className="auth-portals" role="tablist" aria-label="Sign-in portal">
            {portals.map(({ id, label }) => (
              <button
                type="button"
                role="tab"
                aria-selected={portal === id}
                className={portal === id ? "selected" : ""}
                key={id}
                onClick={() => { setPortal(id); setRegistering(false); setError(""); setNotice(""); }}
              >
                {id === "admin" ? <Shield size={14} /> : id === "premium" ? <Users size={14} /> : <UserRound size={14} />}
                {label}
              </button>
            ))}
          </div>

          {(error || sessionError) && <div className="auth-message error" role="alert">{error || sessionError}</div>}
          {notice && <div className="auth-message success" role="status">{notice}</div>}

          <form onSubmit={submit} className="auth-form">
            {registering && (
              <label>
                Full name
                <span className="auth-input-wrap">
                  <UserRound size={16} />
                  <input required maxLength="100" autoComplete="name" value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
                </span>
              </label>
            )}
            <label>
              Email address
              <span className="auth-input-wrap">
                <Mail size={16} />
                <input required type="email" autoComplete="email" value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
              </span>
            </label>
            <label>
              Password
              <span className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input required type={showPassword ? "text" : "password"}
                  minLength={registering ? "12" : undefined} maxLength="128"
                  autoComplete={registering ? "new-password" : "current-password"}
                  value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder={registering ? "At least 12 characters" : "Enter your password"} />
                <button type="button" className="auth-show-password" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <button className={`auth-submit${adminMode ? " admin-submit" : ""}`} type="submit" disabled={busy}>
              {busy ? "Please wait…" : registering ? "Create Student Account" : adminMode ? "Access Admin Portal" : "Sign In"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          {portal === "student" && (
            <p className="auth-switch">
              {registering ? "Already have an account?" : "New to BudgetBuddy?"}{" "}
              <button type="button" onClick={() => { setRegistering(!registering); setError(""); setNotice(""); }}>
                {registering ? "Sign in" : "Create an account"}
              </button>
            </p>
          )}
          {adminMode && <p className="auth-admin-note"><Shield size={14} /> Admin accounts are provisioned by server configuration.</p>}
        </div>
      </section>
    </main>
  );
}
