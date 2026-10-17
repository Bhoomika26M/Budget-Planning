import { useEffect, useLayoutEffect, useState } from "react";
import "./App.css";
import AddTransactionModal from "./features/dashboard/AddTransactionModal";
import Dashboard from "./features/dashboard/Dashboard";
import ExpenseTracker from "./features/expenses/ExpenseTracker";
import Settings from "./features/settings/Settings";
import Navbar from "./layout/Navbar";
import PageContainer from "./layout/PageContainer";
import Sidebar from "./layout/Sidebar";

const routes = {
  "/": { id: "dashboard", title: "Dashboard", Page: Dashboard },
  "/dashboard": { id: "dashboard", title: "Dashboard", Page: Dashboard },
  "/expenses": { id: "expenses", title: "Expenses", Page: ExpenseTracker },
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
      <a href="/" onClick={(event) => onNavigate(event, "/")}>
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

function App() {
  const [pathname, setPathname] = useState(getPathname);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const currentRoute = routes[pathname] ?? {
    id: null,
    title: "Page not found",
    Page: NotFoundPage,
  };
  const Page = currentRoute.Page;

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("budgetbuddy-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(event, path) {
    if (!isPlainLeftClick(event)) {
      return;
    }

    event.preventDefault();
    if (getPathname() !== path) {
      window.history.pushState({}, "", path);
      setPathname(path);
    }
  }

  const dashboardActions = currentRoute.id === "dashboard" ? (
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
      <Sidebar activeItem={currentRoute.id} onNavigate={navigate} />
      <div className="app-main">
        <Navbar
          title={currentRoute.title}
          subtitle={currentRoute.subtitle}
          actions={dashboardActions}
        />
        <PageContainer>
          <Page onNavigate={navigate} />
        </PageContainer>
      </div>
      {showTransactionModal && (
        <AddTransactionModal onClose={() => setShowTransactionModal(false)} />
      )}
    </div>
  );

import React from "react";

import Settings from "./features/settings/Settings";
import Dashboard from "./features/dashboard/Dashboard";
import Income from "./income/Income";

function App() {
  return <Income />;
}

export default App;
