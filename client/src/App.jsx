import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import AdminDashboard from "./admin/AdminDashboard";
import AuthPage from "./authentication/AuthPage";
import Income from "./income/Income";
import ProfilePage from "./profile/ProfilePage";
import FeatureStatusPage from "./pages/FeatureStatusPage";
import SavingsGoals from "./pages/SavingsGoals";
import "./App.css";
import AddTransactionModal from "./features/dashboard/AddTransactionModal";
import BudgetPlanning from "./features/budget/BudgetPlanning";
import Dashboard from "./features/dashboard/Dashboard";
import ExpenseTracker from "./features/expenses/ExpenseTracker";
import RecentTransactions from "./features/dashboard/RecentTransactions";
import Settings from "./features/settings/Settings";
import Navbar from "./layout/Navbar";
import PageContainer from "./layout/PageContainer";
import Sidebar from "./layout/Sidebar";

const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./Reports/Reports.jsx"));

const routes = {
  "/": { id: "dashboard", title: "Dashboard", Page: Dashboard },
  "/dashboard": { id: "dashboard", title: "Dashboard", Page: Dashboard },
  "/transactions": { id: "transactions", title: "Transactions", Page: RecentTransactions },
  "/expenses": { id: "expenses", title: "Expenses", Page: ExpenseTracker },
  "/analytics": { id: "analytics", title: "Analytics", Page: Analytics },
  "/budgets": {
    id: "budgets",
    title: "Budget Planning",
    Page: BudgetPlanning,
  },
  "/income": { id: "income", title: "Income", Page: Income },
  "/savings-goals": { id: "savings", title: "Savings Goals", Page: SavingsGoals },
  "/reports": { id: "reports", title: "Reports", subtitle: "Generate and export reports", Page: Reports },
  "/notifications": {
    id: "notifications",
    title: "Notifications",
    Page: FeatureStatusPage,
    pageProps: {
      title: "Notifications",
      summary: "View account alerts and reminders in one place.",
      missing: "A notifications inbox and delivery API are not implemented. Notification preference switches in Settings only save preferences; they do not send or display notifications.",
    },
  },
  "/admin": { id: "admin", title: "User Management", Page: AdminDashboard },
  "/settings": {
    id: "settings",
    title: "Settings",
    subtitle: "Manage your account and preferences.",
    Page: Settings,
  },
  "/profile": { id: "profile", title: "Profile", Page: ProfilePage },
};

function getPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function NotFoundPage({ onNavigate }) {
  return (
    <section className="route-not-found">
      <h2>Page not found</h2>
      <p>No page is registered for this address.</p>
      <a
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("/");
        }}
      >
        Return to Home
      </a>
    </section>
  );
}

function AccessDeniedPage() {
  return (
    <section className="route-not-found" role="alert">
      <h2>Access denied</h2>
      <p>This page is available to administrators only.</p>
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

function AppContent() {
  const { currentUser, loading, logout } = useAuth();
  const [pathname, setPathname] = useState(getPathname);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("budgetbuddy-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateTo(path) {
    if (getPathname() !== path) {
      window.history.pushState({}, "", path);
      setPathname(path);
    }
  }

  function navigate(event, path) {
    if (!isPlainLeftClick(event)) return;
    event.preventDefault();
    navigateTo(path);
  }

  if (loading) {
    return <main className="app-loading" role="status">Loading your account…</main>;
  }
  if (!currentUser) return <AuthPage />;

  const currentRoute = routes[pathname] ?? {
    id: null,
    title: "Page not found",
    Page: NotFoundPage,
  };
  const authorizedRoute =
    currentRoute.id !== "admin" || currentUser.role === "admin"
      ? currentRoute
      : {
          id: null,
          title: "Access denied",
          subtitle: "This page is available to administrators only.",
          Page: AccessDeniedPage,
        };
  const Page = authorizedRoute.Page;
  

  return (
    <div className="app-shell">
      <Sidebar
        activeItem={authorizedRoute.id}
        currentUser={currentUser}
        onNavigate={navigate}
      />
      <div className="app-main">
                <Navbar
          title={authorizedRoute.title}
          subtitle={authorizedRoute.subtitle}
          currentUser={currentUser}
          onNavigate={navigateTo}
          onLogout={logout}
          onAddTransaction={() => setShowTransactionModal(true)}
        />
        <PageContainer>
          <Suspense fallback={<p role="status">Loading page...</p>}>
            <Page
  {...authorizedRoute.pageProps}
  onNavigate={navigateTo}
  onAddTransaction={() => setShowTransactionModal(true)}
/>
          </Suspense>
        </PageContainer>
      </div>
      {showTransactionModal && (
        <AddTransactionModal onClose={() => setShowTransactionModal(false)} />
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
