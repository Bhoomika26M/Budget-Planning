
import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "../context/useAuth";
import "./Reports.css";

const API_URL = "http://localhost:8000";

const reportTypes = [
  {
    title: "Monthly Summary",
    description: "Complete month-by-month financial overview",
    icon: "▥",
  },
  {
    title: "Expense History",
    description: "Detailed expense breakdown by category",
    icon: "↘",
  },
  {
    title: "Income Statement",
    description: "All income sources and transaction history",
    icon: "↗",
  },
  {
    title: "Budget Analysis",
    description: "Budget targets vs actual spending",
    icon: "▤",
  },
  {
    title: "Savings Progress",
    description: "Progress toward all savings goals",
    icon: "◎",
  },
];

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function Reports({ onAddTransaction, onNavigate }) {
  const { currentUser } = useAuth();

  const [activeReport, setActiveReport] = useState("Monthly Summary");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Read the current theme without changing it during rendering.
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "light";

    return (
      document.documentElement.dataset.theme ||
      localStorage.getItem("budgetbuddy-theme") ||
      "light"
    );
  });

  // Keep the theme icon synchronized with changes made by other components.
  useEffect(() => {
    const syncTheme = () => {
      const currentTheme =
        document.documentElement.dataset.theme ||
        localStorage.getItem("budgetbuddy-theme") ||
        "light";

      setTheme(currentTheme);
    };

    window.addEventListener("budgetbuddy-theme-change", syncTheme);

    return () => {
      window.removeEventListener("budgetbuddy-theme-change", syncTheme);
    };
  }, []);

  // Only the theme button should change the theme.
  const toggleTheme = (event) => {
    event.stopPropagation();

    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("budgetbuddy-theme", nextTheme);

    setTheme(nextTheme);

    window.dispatchEvent(new Event("budgetbuddy-theme-change"));
  };

  // Navigate without changing the theme.
  const navigateTo = (path) => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
      return;
    }

    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/reports/monthly-summary`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch report data.");
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Reports API error:", err);
      setReportData(null);
      setError(
        "Unable to load report data. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (amount) =>
    `$${Number(amount ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleAddTransaction = () => {
    if (typeof onAddTransaction === "function") {
      setError("");
      onAddTransaction();
    } else {
      setError(
        "The transaction form is not connected. Please check App.jsx."
      );
    }
  };

  const exportReport = async (type) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/reports/export/${type}`
      );

      if (!response.ok) {
        throw new Error(
          `Export ${type.toUpperCase()} is not available yet.`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        type === "excel" ? "report.xlsx" : `report.${type}`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report export error:", err);
      setError(err.message || "Unable to export report.");
    }
  };

  const userName =
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.full_name ||
    currentUser?.email?.split("@")[0] ||
    "Account";

  const userInitial = userName.charAt(0).toUpperCase();

  const monthlyData = Array.isArray(reportData?.monthly_data)
    ? reportData.monthly_data
    : [];

  const filteredMonthlyData = monthlyData.filter((item) =>
    String(item.month ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="reports-loading">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div className="reports-page-heading">
          <h1>Reports</h1>
          <p>Generate and export reports</p>
        </div>

        <div className="reports-header-actions">
          <div className="reports-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search months..."
              aria-label="Search report months"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <button
            className="add-transaction-btn"
            type="button"
            onClick={handleAddTransaction}
          >
            <span aria-hidden="true">+</span>
            Add Transaction
          </button>

          {/* Only this button toggles the theme. */}
          <button
            className="header-icon-btn"
            type="button"
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title="Toggle dark mode"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          {/* This button only navigates to Notifications. */}
          <button
            className="header-icon-btn notification-button"
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={(event) => {
              event.stopPropagation();
              navigateTo("/notifications");
            }}
          >
            <BellIcon />
          </button>

          <button
            type="button"
            className="profile-button"
            onClick={(event) => {
              event.stopPropagation();
              navigateTo("/profile");
            }}
            aria-label={`Open profile for ${userName}`}
            title="Open profile"
          >
            <span className="profile-avatar">{userInitial}</span>
            <span className="profile-name">{userName}</span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="backend-message" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="report-type-grid">
        {reportTypes.map((report) => (
          <button
            key={report.title}
            type="button"
            className={`report-type-card ${
              activeReport === report.title ? "active" : ""
            }`}
            onClick={() => setActiveReport(report.title)}
          >
            <div className="report-type-icon">{report.icon}</div>
            <h3 className="report-card-title">{report.title}</h3>
            <p>{report.description}</p>
          </button>
        ))}
      </div>

      <div className="report-action-card">
        <div className="report-title-section">
          <div className="report-main-icon">▥</div>
          <div>
            <h2 className="report-action-title">{activeReport}</h2>
            <p>
              {activeReport === "Monthly Summary"
                ? "Complete month-by-month financial overview"
                : "Report data will appear when financial data is available"}
            </p>
          </div>
        </div>

        <div className="export-buttons">
          <button
            type="button"
            className="preview-btn"
            onClick={() => window.print()}
          >
            ◉ Preview
          </button>

          <button
            type="button"
            className="pdf-btn"
            onClick={() => exportReport("pdf")}
          >
            ▣ Export PDF
          </button>

          <button
            type="button"
            className="excel-btn"
            onClick={() => exportReport("excel")}
          >
            ▤ Export Excel
          </button>

          <button
            type="button"
            className="csv-btn"
            onClick={() => exportReport("csv")}
          >
            ⇩ Export CSV
          </button>
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <div className="backend-message no-data-message">
          <h2>No report data available yet.</h2>
          <p>
            Reports will display financial data once the backend
            calculates the summary from your saved transactions.
          </p>
          <button
            className="add-transaction-btn"
            type="button"
            onClick={handleAddTransaction}
          >
            + Add Transaction
          </button>
        </div>
      ) : (
        <>
          <div className="section-heading">
            <span>$</span>
            <div>
              <h2>Financial Summary</h2>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card income-card">
              <div className="summary-card-top">
                <p>Total Income</p>
                <span>↗</span>
              </div>
              <h3>{formatCurrency(reportData?.total_income)}</h3>
              <small>
                {reportData?.income_transactions ?? 0} transactions
              </small>
            </div>

            <div className="summary-card expense-card">
              <div className="summary-card-top">
                <p>Total Expenses</p>
                <span>↘</span>
              </div>
              <h3>{formatCurrency(reportData?.total_expenses)}</h3>
              <small>
                {reportData?.expense_transactions ?? 0} transactions
              </small>
            </div>

            <div className="summary-card savings-card">
              <div className="summary-card-top">
                <p>Net Savings</p>
                <span>↗</span>
              </div>
              <h3>{formatCurrency(reportData?.net_savings)}</h3>
              <small>
                {reportData?.savings_rate ?? 0}% savings rate
              </small>
            </div>

            <div className="summary-card goals-card">
              <div className="summary-card-top">
                <p>Active Goals</p>
                <span>◎</span>
              </div>
              <h3>{reportData?.active_goals ?? 0}</h3>
              <small>
                {reportData?.completed_goals ?? 0} completed
              </small>
            </div>
          </div>

          <div className="monthly-heading">
            <h2>Monthly Trend</h2>
            <p>Income, expenses and savings by month</p>
          </div>

          <div className="chart-card">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredMonthlyData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 12,
                      fill: "var(--text)",
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "var(--text)",
                    }}
                  />

                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: "var(--surface, var(--bg))",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                      borderRadius: "10px",
                    }}
                  />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#22c55e"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="savings"
                    name="Savings"
                    fill="#4d98a4"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="monthly-table-wrapper">
              <table className="monthly-table">
                <thead>
                  <tr>
                    <th>MONTH</th>
                    <th>INCOME</th>
                    <th>EXPENSES</th>
                    <th>SAVINGS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMonthlyData.map((item, index) => (
                    <tr key={item.month ?? index}>
                      <td>{item.month}</td>
                      <td className="income-value">
                        {formatCurrency(item.income)}
                      </td>
                      <td className="expense-value">
                        {formatCurrency(item.expenses)}
                      </td>
                      <td className="saving-value">
                        {formatCurrency(item.savings)}
                      </td>
                    </tr>
                  ))}

                  {filteredMonthlyData.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        No months match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
