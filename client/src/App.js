import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";
import LoginForm from "./features/authentication/components/LoginForm";
import SignupForm from "./features/authentication/components/SignupForm";
import Sidebar from "./layout/Sidebar";
import Navbar from "./layout/Navbar";
import api, { clearToken, getToken } from "./services/api";

function AppLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();

  const pageTitles = {
    "/": "Dashboard",
    "/budget": "Budget Planner",
    "/analytics": "Analytics",
  };

  return (
    <div className={dark ? "app-layout dark-theme" : "app-layout"}>
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <div className="app-main">
        <Navbar
          pageTitle={pageTitles[location.pathname] || "BudgetBuddy"}
          user={user}
          dark={dark}
          onToggleTheme={() => setDark((previous) => !previous)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="app-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const handleAuthenticated = (event) => {
      if (!active) return;

      setUser(event.detail);
      setAuthLoading(false);
    };

    const handleUnauthorized = () => {
      if (!active) return;

      setUser(null);
      setAuthLoading(false);
    };

    window.addEventListener("bb:authenticated", handleAuthenticated);
    window.addEventListener("bb:unauthorized", handleUnauthorized);

    async function restoreSession() {
      if (!getToken()) {
        if (active) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.me();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        clearToken();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
      window.removeEventListener("bb:authenticated", handleAuthenticated);
      window.removeEventListener("bb:unauthorized", handleUnauthorized);
    };
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  if (authLoading) {
    return (
      <div className="auth-loading" role="status">
        Loading BudgetBuddy...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" replace /> : <LoginForm />
        }
      />

      <Route
        path="/signup"
        element={
          user ? <Navigate to="/" replace /> : <SignupForm />
        }
      />

      <Route
        element={
          user ? (
            <AppLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
