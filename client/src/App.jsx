import { useEffect, useLayoutEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import AuthPage from "./authentication/AuthPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import "./App.css";

// ===========================================================================
// TEMPORARY DEVELOPMENT-ONLY PREVIEW — Notifications branch (Gouri).
// Remove / do not merge as-is.
// - Renders ONLY the standalone NotificationsPage at full browser width:
//   no Sidebar, no BudgetBuddy branding/logo, no Account heading, no shared
//   Navbar / PageContainer application shell.
// - `npm run dev` skips the login page so the UI opens directly.
// This does NOT weaken authentication: no user is faked, no token is forged,
// the backend still enforces bearer auth, and production builds
// (import.meta.env.DEV === false) still render the real <AuthPage /> gate,
// so this file can never ship as the team's authentication flow.
// ===========================================================================
const DEV_PREVIEW = import.meta.env.DEV;
const NOTIFICATIONS_PATH = "/notifications";

function getPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("budgetbuddy-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  // Standalone preview: any path (including "/", "/dashboard", …) normalises
  // to /notifications, the single development entry page.
  useEffect(() => {
    const normalize = () => {
      if (getPathname() !== NOTIFICATIONS_PATH) {
        window.history.replaceState({}, "", NOTIFICATIONS_PATH);
      }
    };
    normalize();
    window.addEventListener("popstate", normalize);
    return () => window.removeEventListener("popstate", normalize);
  }, []);

  if (loading) {
    return <main className="app-loading" role="status">Loading your account…</main>;
  }

  // Preview only: in the dev server, show the Notifications UI even without
  // a session instead of the login page. Production builds keep <AuthPage />.
  if (!currentUser && !DEV_PREVIEW) return <AuthPage />;

  return <NotificationsPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
