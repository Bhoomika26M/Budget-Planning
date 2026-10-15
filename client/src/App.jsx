
import React, { useState } from "react";
import Dashboard from "./features/dashboard/Dashboard";
import Settings from "./features/settings/Settings";
import Reports from "./Reports/Reports.jsx";

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
      </nav>

      {currentPage === "dashboard" && <Dashboard />}
      {currentPage === "reports" && <Reports />}
      {currentPage === "settings" && <Settings />}
    </div>
  );
}

export default App;
