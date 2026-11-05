import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import AccessDenied from "./components/Access/AccessDenied";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import { ToastProvider } from "./context/ToastContext";
import PageContainer from "./layout/PageContainer";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Budget from "./pages/Budget";
import Expenses from "./pages/Expenses";
import Home from "./pages/Home";
import Income from "./pages/Income";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Savings from "./pages/Savings";
import Settings from "./pages/Settings";
import { ROLE_SCREENS } from "./utils/permissions";

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm" role="status">
      {children}
    </div>
  );
}

/** Only signed-in users; admins are sent to the admin panel and vice versa. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenMessage>Loading BudgetBuddy…</FullScreenMessage>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Screen-level role check (Students see an upgrade prompt for Premium screens). */
function RoleRoute({ screen, children }) {
  const { user } = useAuth();
  const role = user?.role ?? "student";

  if (ROLE_SCREENS[role]?.includes(screen)) return children;
  if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (screen.startsWith("admin-")) return <Navigate to="/" replace />;
  // PricingModal upgrades the account itself; the new role then unlocks this route.
  return <AccessDenied role={role} screen={screen} />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  return (
    <RoleRoute screen="dashboard">
      <Home />
    </RoleRoute>
  );
}

/** Google / GitHub sign-in returns here with #token=... */
function OAuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      navigate("/login?oauth_error=1", { replace: true });
      return;
    }
    loginWithToken(token)
      .then((me) => navigate(me.role === "admin" ? "/admin-dashboard" : "/", { replace: true }))
      .catch((err) => setError(err.message));
  }, [loginWithToken, navigate]);

  return <FullScreenMessage>{error || "Signing you in…"}</FullScreenMessage>;
}

const SCREENS = [
  ["expenses", "/expenses", <Expenses />],
  ["income", "/income", <Income />],
  ["budgets", "/budget", <Budget />],
  ["savings", "/savings", <Savings />],
  ["analytics", "/analytics", <Analytics />],
  ["reports", "/reports", <Reports />],
  ["notifications", "/notifications", <Notifications />],
  ["profile", "/profile", <Profile />],
  ["settings", "/settings", <Settings />],
];

const ADMIN_SCREENS = [
  "admin-dashboard",
  "admin-users",
  "admin-subscriptions",
  "admin-categories",
  "admin-analytics",
  "admin-logs",
  "admin-announcements",
  "admin-feedback",
  "admin-issues",
  "admin-permissions",
];

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading ? (
            <FullScreenMessage>Loading BudgetBuddy…</FullScreenMessage>
          ) : user ? (
            <Navigate to={user.role === "admin" ? "/admin-dashboard" : "/"} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route path="/signup" element={<Navigate to="/login?signup=1" replace />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      <Route
        element={
          <RequireAuth>
            <PageContainer />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        {SCREENS.map(([screen, path, element]) => (
          <Route key={screen} path={path.slice(1)} element={<RoleRoute screen={screen}>{element}</RoleRoute>} />
        ))}
        {ADMIN_SCREENS.map((screen) => (
          <Route
            key={screen}
            path={screen}
            element={
              <RoleRoute screen={screen}>
                <Admin screen={screen} />
              </RoleRoute>
            }
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <FinanceProvider>
            <AppRoutes />
          </FinanceProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
