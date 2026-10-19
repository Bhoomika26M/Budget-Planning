
import React, { useEffect, useLayoutEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";

import AdminDashboard from "./admin/AdminDashboard";
import AuthPage from "./authentication/AuthPage";
import Dashboard from "./features/dashboard/Dashboard";
import AddTransactionModal from "./features/dashboard/AddTransactionModal";
import ExpenseTracker from "./features/expenses/ExpenseTracker";
import Settings from "./features/settings/Settings";
import Reports from "./Reports/Reports.jsx";
import Income from "./income/Income";
import ProfilePage from "./profile/ProfilePage";
import Analytics from "./pages/Analytics";
import SavingsGoals from "./pages/SavingsGoals";

import Navbar from "./layout/Navbar";
import PageContainer from "./layout/PageContainer";
import Sidebar from "./layout/Sidebar";
import "./App.css";

function PlaceholderPage({ title, description }) {
  return (
    <section className="route-not-found">
      <h2>{title}</h2>
      <p>{description}</p>
      <p>This page is not implemented yet.</p>
    </section>
  );
}

const routes = {
  "/": {
    id: "dashboard",
    title: "Dashboard",
    Page: Dashboard,
  },

  "/dashboard": {
    id: "dashboard",
    title: "Dashboard",
    Page: Dashboard,
  },

  "/transactions": {
    id: "transactions",
    title: "Transactions",
    Page: () => (
      <PlaceholderPage
        title="Transactions"
        description="Manage and review your financial transactions."
      />
    ),
  },

  "/expenses": {
    id: "expenses",
    title: "Expenses",
    Page: ExpenseTracker,
  },

  "/income": {
    id: "income",
    title: "Income",
    Page: Income,
  },

  "/budgets": {
    id: "budgets",
    title: "Budget Planning",
    Page: () => (
      <PlaceholderPage
        title="Budget Planning"
        description="Plan and track your budgets."
      />
    ),
  },

  "/savings-goals": {
    id: "savings",
    title: "Savings Goals",
    Page: SavingsGoals,
  },

  "/analytics": {
    id: "analytics",
    title: "Analytics",
    Page: Analytics,
  },

  "/reports": {
    id: "reports",
    title: "Reports",
    Page: Reports,
  },

  // Notifications no longer opens Settings.
  "/notifications": {
    id: "notifications",
    title: "Notifications",
    subtitle: "View and manage your notifications.",
    Page: () => (
      <PlaceholderPage
        title="Notifications"
        description="Your notifications will appear here when this page is implemented."
      />
    ),
  },

  "/profile": {
    id: "profile",
    title: "Profile",
    Page: ProfilePage,
  },

  "/settings": {
    id: "settings",
    title: "Settings",
    subtitle: "Manage your account and preferences.",
    Page: Settings,
  },
};

function NotFoundPage({ onNavigate }) {
  return (
    <section className="route-not-found">
      <h2>Page not found</h2>
      <p>No page is registered for this address.</p>

      <a
        href="/"
        onClick={(event) => onNavigate(event, "/")}
      >
        Return to Dashboard
      </a>
    </section>
  );
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function getPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  const [pathname, setPathname] = useState(getPathname);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Initialize the global theme once when the app mounts.
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("budgetbuddy-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  // Keep React routing synchronized with browser back/forward buttons.
  useEffect(() => {
    const handlePopState = () => {
      setPathname(getPathname());
      setShowTransactionModal(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Navigation changes the URL and page, not the theme.
  function navigate(eventOrPath, maybePath) {
    let path;

    if (typeof eventOrPath === "string") {
      path = eventOrPath;
    } else {
      const event = eventOrPath;
      path = maybePath;

      if (!event || !isPlainLeftClick(event)) {
        return;
      }

      event.preventDefault();
    }

    if (!path) return;

    const normalizedPath =
      path.replace(/\/+$/, "") || "/";

    if (getPathname() !== normalizedPath) {
      window.history.pushState({}, "", normalizedPath);
      setPathname(normalizedPath);
      setShowTransactionModal(false);
    }
  }

  if (loading) {
    return (
      <main className="app-loading" role="status">
        Loading your account…
      </main>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  if (currentUser.role === "admin") {
    return <AdminDashboard onNavigate={navigate} />;
  }

  const currentRoute = routes[pathname] ?? {
    id: null,
    title: "Page not found",
    Page: NotFoundPage,
  };

  const Page = currentRoute.Page;

  const dashboardActions =
    currentRoute.id === "dashboard" ? (
      <button
        className="app-action-button"
        type="button"
        onClick={() => setShowTransactionModal(true)}
      >
        + Add Transaction
      </button>
    ) : null;

  return (
    <div className="app-shell">
      <Sidebar
        activeItem={currentRoute.id}
        onNavigate={navigate}
      />

      <div className="app-main">
        <Navbar
          title={currentRoute.title}
          subtitle={currentRoute.subtitle}
          actions={dashboardActions}
        />

        <PageContainer>
          <Page
            onNavigate={navigate}
            onAddTransaction={() => setShowTransactionModal(true)}
          />
        </PageContainer>
      </div>

      {showTransactionModal && (
        <AddTransactionModal
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
