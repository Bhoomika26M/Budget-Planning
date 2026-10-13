import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function Reports() {
  const [activeReport, setActiveReport] =
    useState("Monthly Summary");

  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchReportData();
  }, []);

  // ==============================
  // FETCH REPORT DATA
  // ==============================

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/reports/monthly-summary`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch report data");
      }

      const data = await response.json();

      setReportData(data);
    } catch (err) {
      console.error("Reports API error:", err);

      setReportData(null);
      setError("Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FORMAT CURRENCY
  // ==============================

  const formatCurrency = (amount) => {
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ==============================
  // EXPORT REPORT
  // ==============================

  const exportReport = async (type) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/reports/export/${type}`
      );

      if (!response.ok) {
        throw new Error(
          "Export endpoint is not available yet."
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        type === "excel"
          ? "report.xlsx"
          : `report.${type}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report export error:", err);

      setError(
        `${type.toUpperCase()} export is not available yet.`
      );
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="reports-loading">
        <div>Loading reports...</div>
      </div>
    );
  }

  // ==============================
  // CHECK REAL DATA
  // ==============================

  const hasReportData =
    reportData &&
    Array.isArray(reportData.monthly_data) &&
    reportData.monthly_data.length > 0;

  // ==============================
  // REPORT PAGE
  // ==============================

  return (
    <div className="reports-page">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="reports-header">

        <div>
          <h1>Reports</h1>

          <p>
            Generate and export reports
          </p>
        </div>

        <div className="reports-header-actions">

          {/* SEARCH */}

          <div className="reports-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search..."
            />

          </div>

          {/* ADD TRANSACTION */}

          <button
            className="add-transaction-btn"
            type="button"
            onClick={() => {
              setError(
                "Transactions are managed by the Transactions module."
              );
            }}
          >
            + Add Transaction
          </button>

          {/* HEADER BUTTONS */}

          <button
            className="header-icon-btn"
            type="button"
            aria-label="Notifications"
          >
            ◔
          </button>

          <button
            className="header-icon-btn"
            type="button"
            aria-label="Settings"
          >
            ♧
          </button>

        </div>

      </div>


      {/* ==============================
          ERROR MESSAGE
      ============================== */}

      {error && (
        <div className="backend-message">
          {error}
        </div>
      )}


      {/* ==============================
          REPORT TYPE CARDS
      ============================== */}

      <div className="report-type-grid">

        {reportTypes.map((report) => (

          <button
            key={report.title}
            type="button"
            className={`report-type-card ${
              activeReport === report.title
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveReport(report.title)
            }
          >

            <div className="report-type-icon">
              {report.icon}
            </div>

            <h3 className="report-card-title">
              {report.title}
            </h3>

            <p>
              {report.description}
            </p>

          </button>

        ))}

      </div>


      {/* ==============================
          ACTION BAR
      ============================== */}

      <div className="report-action-card">

        <div className="report-title-section">

          <div className="report-main-icon">
            ▥
          </div>

          <div>

            <h2 className="report-action-title">
              {activeReport}
            </h2>

            <p>
              {activeReport === "Monthly Summary"
                ? "Complete month-by-month financial overview"
                : "Report data will appear when financial data is available"}
            </p>

          </div>

        </div>


        {/* EXPORT BUTTONS */}

        <div className="export-buttons">

          {/* PREVIEW */}

          <button
            type="button"
            className="preview-btn"
            onClick={() => window.print()}
          >
            ◉ Preview
          </button>


          {/* PDF */}

          <button
            type="button"
            className="pdf-btn"
            onClick={() =>
              exportReport("pdf")
            }
          >
            ▣ Export PDF
          </button>


          {/* EXCEL */}

          <button
            type="button"
            className="excel-btn"
            onClick={() =>
              exportReport("excel")
            }
          >
            ▤ Export Excel
          </button>


          {/* CSV */}

          <button
            type="button"
            className="csv-btn"
            onClick={() =>
              exportReport("csv")
            }
          >
            ⇩ Export CSV
          </button>

        </div>

      </div>


      {/* ==============================
          NO REAL DATA
      ============================== */}

      {!hasReportData && (

        <div className="backend-message no-data-message">

          <h2>
            No report data available yet.
          </h2>

          <p>
            Reports will be generated automatically
            when financial data is available in the
            database.
          </p>

        </div>

      )}


      {/* ==============================
          REAL FINANCIAL DATA
      ============================== */}

      {hasReportData && (
        <>

          {/* ==============================
              FINANCIAL SUMMARY
          ============================== */}

          <div className="section-heading">

            <span>$</span>

            <div>
              <h2>
                Financial Summary
              </h2>
            </div>

          </div>


          <div className="summary-grid">

            {/* INCOME */}

            <div className="summary-card income-card">

              <div className="summary-card-top">

                <p>
                  Total Income
                </p>

                <span>
                  ↗
                </span>

              </div>

              <h3>
                {formatCurrency(
                  reportData.total_income
                )}
              </h3>

              <small>
                {reportData.income_transactions}
                {" "}
                transactions
              </small>

            </div>


            {/* EXPENSES */}

            <div className="summary-card expense-card">

              <div className="summary-card-top">

                <p>
                  Total Expenses
                </p>

                <span>
                  ↘
                </span>

              </div>

              <h3>
                {formatCurrency(
                  reportData.total_expenses
                )}
              </h3>

              <small>
                {reportData.expense_transactions}
                {" "}
                transactions
              </small>

            </div>


            {/* SAVINGS */}

            <div className="summary-card savings-card">

              <div className="summary-card-top">

                <p>
                  Net Savings
                </p>

                <span>
                  ↗
                </span>

              </div>

              <h3>
                {formatCurrency(
                  reportData.net_savings
                )}
              </h3>

              <small>
                {reportData.savings_rate}
                % savings rate
              </small>

            </div>


            {/* GOALS */}

            <div className="summary-card goals-card">

              <div className="summary-card-top">

                <p>
                  Active Goals
                </p>

                <span>
                  ◎
                </span>

              </div>

              <h3>
                {reportData.active_goals}
              </h3>

              <small>
                {reportData.completed_goals}
                {" "}
                completed
              </small>

            </div>

          </div>


          {/* ==============================
              MONTHLY TREND
          ============================== */}

          <div className="monthly-heading">

            <h2>
              Monthly Trend
            </h2>

            <p>
              Last 6 months of income, expenses & savings
            </p>

          </div>


          <div className="chart-card">

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={reportData.monthly_data}
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
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#22c55e"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="savings"
                    name="Savings"
                    fill="#4d98a4"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>


            {/* ==============================
                MONTHLY TABLE
            ============================== */}

            <div className="monthly-table-wrapper">

              <table className="monthly-table">

                <thead>

                  <tr>

                    <th>
                      MONTH
                    </th>

                    <th>
                      INCOME
                    </th>

                    <th>
                      EXPENSES
                    </th>

                    <th>
                      SAVINGS
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {reportData.monthly_data.map(
                    (item) => (

                      <tr key={item.month}>

                        <td>
                          {item.month}
                        </td>

                        <td className="income-value">
                          {formatCurrency(
                            item.income
                          )}
                        </td>

                        <td className="expense-value">
                          {formatCurrency(
                            item.expenses
                          )}
                        </td>

                        <td className="saving-value">
                          {formatCurrency(
                            item.savings
                          )}
                        </td>

                      </tr>

                    )
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