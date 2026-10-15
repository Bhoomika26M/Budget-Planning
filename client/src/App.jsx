
import React, { useState } from "react";
import Dashboard from "./features/dashboard/Dashboard";
import Settings from "./features/settings/Settings";
import Reports from "./Reports/Reports.jsx";
import Income from "./income/Income";

function App() {
  const [currentPage, setCurrentPage] = useState("reports");

  return (
    <div>
      <nav style={{ display: "flex", gap: "12px", padding: "12px" }}>
        <button onClick={() => setCurrentPage("dashboard")}>
          Dashboard
        </button>

        <button onClick={() => setCurrentPage("reports")}>
          Reports
        </button>

        <button onClick={() => setCurrentPage("settings")}>
          Settings
        </button>

        <button onClick={() => setCurrentPage("income")}>
          Income
        </button>
      </nav>

      {currentPage === "dashboard" && <Dashboard />}
      {currentPage === "reports" && <Reports />}
      {currentPage === "settings" && <Settings />}
      {currentPage === "income" && <Income />}
    </div>
  );
}

export default App;
