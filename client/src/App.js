
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";
import Sidebar from "./layout/Sidebar";
import Navbar from "./layout/Navbar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const location = useLocation();

  const pageTitles = {
    "/": "Dashboard",
    "/budget": "Budget Planner",
    "/analytics": "Analytics",
  };

  const user = {
    name: "Anna Grace",
    role: "Student",
  };

  return (
    <div className={dark ? "app-layout dark-theme" : "app-layout"}>
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
