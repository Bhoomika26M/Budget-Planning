import React, { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import api from "../services/api";
import "./Home.css";

const COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function Home() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          api.getBudgets(),
          api.getExpenses(),
          api.getAnalytics(),
        ]);

        if (!active) return;

        const [budgetResult, expenseResult, analyticsResult] = results;

        if (budgetResult.status === "fulfilled") {
          const data = budgetResult.value;
          setBudgets(
            Array.isArray(data)
              ? data
              : data?.items || data?.budgets || []
          );
        } else {
          setBudgets([]);
        }

        if (expenseResult.status === "fulfilled") {
          const data = expenseResult.value;
          setExpenses(
            Array.isArray(data)
              ? data
              : data?.items || data?.expenses || []
          );
        } else {
          setExpenses([]);
        }

        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value);
        } else {
          setAnalytics(null);
        }

        if (results.every((result) => result.status === "rejected")) {
          setError(
            "Unable to load dashboard data. Check that the backend is running."
          );
        }
      } catch {
        if (active) {
          setError("Unable to load dashboard data. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = expenses.filter((expense) => {
    const rawDate =
      expense.expense_date || expense.date || expense.created_at;
    if (!rawDate) return false;

    const date = new Date(rawDate);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const totalSpent = monthlyExpenses.reduce(
    (sum, expense) =>
      sum + (Number(expense.amount) || 0),
    0
  );

  const monthlyBudgets = budgets.filter(
    (budget) => !budget.period || budget.period === "monthly"
  );

  const totalBudget =
    analytics?.budget_total != null
      ? Number(analytics.budget_total) || 0
      : monthlyBudgets.reduce(
          (sum, budget) =>
            sum + (Number(budget.amount ?? budget.allocated) || 0),
          0
        );

  const remaining = totalBudget - totalSpent;

  const categoryTotals = {};

  monthlyExpenses.forEach((expense) => {
    const category = expense.category || "Other";
    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      (Number(expense.amount) || 0);
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const nearLimitCategories = monthlyBudgets.filter((budget) => {
    const limit = Number(budget.amount ?? budget.allocated) || 0;
    if (limit <= 0) return false;

    const category = budget.category || budget.cat;
    const spent = monthlyExpenses
      .filter((expense) => expense.category === category)
      .reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
      );

    return spent / limit >= 0.8;
  });

  const utilization =
    totalBudget > 0
      ? Math.round((totalSpent / totalBudget) * 100)
      : 0;

  if (loading) {
    return (
      <div className="home-dashboard">
        <div className="home-loading">
          <RefreshCw size={22} className="home-spin" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      <header className="home-header">
        <div>
          <p className="home-eyebrow">YOUR FINANCIAL OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="home-subtitle">
            Track your budget and spending for{" "}
            {now.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>
      </header>

      {error && (
        <div className="home-error" role="alert">
          {error}
        </div>
      )}

      <section className="home-stats">
        <article className="home-stat-card">
          <div className="home-stat-icon purple">
            <Wallet size={21} />
          </div>
          <p>Total Monthly Budget</p>
          <h2>{money(totalBudget)}</h2>
          <span>Combined monthly limits</span>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon blue">
            <TrendingDown size={21} />
          </div>
          <p>Total Spent</p>
          <h2>{money(totalSpent)}</h2>
          <span>{utilization}% of budget used</span>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon green">
            <TrendingUp size={21} />
          </div>
          <p>Remaining Budget</p>
          <h2>{money(remaining)}</h2>
          <span>
            {remaining < 0 ? "Budget exceeded" : "Available this month"}
          </span>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon orange">
            <AlertTriangle size={21} />
          </div>
          <p>Near Limit Categories</p>
          <h2>{nearLimitCategories.length}</h2>
          <span>Categories at 80% or more</span>
        </article>
      </section>

      <section className="home-panel home-budget-panel">
        <div className="home-panel-heading">
          <div>
            <h2>Monthly Budget Progress</h2>
            <p>Compare your spending with your budget.</p>
          </div>
          <strong>{utilization}%</strong>
        </div>

        <div
          className="home-progress-track"
          role="progressbar"
          aria-label="Monthly budget used"
          aria-valuenow={Math.max(0, Math.min(utilization, 100))}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`home-progress-fill ${
              utilization >= 100 ? "over-budget" : ""
            }`}
            style={{
              width: `${Math.max(0, Math.min(utilization, 100))}%`,
            }}
          />
        </div>

        <div className="home-progress-labels">
          <span>Spent: {money(totalSpent)}</span>
          <span>Budget: {money(totalBudget)}</span>
        </div>
      </section>

      <section className="home-content-grid">
        <article className="home-panel">
          <div className="home-panel-heading">
            <div>
              <h2>Spending by Category</h2>
              <p>Where your money is going this month.</p>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="home-empty">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <>
              <div className="home-chart">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => money(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="home-category-list">
                {categoryData.map((category, index) => (
                  <div
                    className="home-category-row"
                    key={category.name}
                  >
                    <span
                      className="home-category-dot"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />
                    <span className="home-category-name">
                      {category.name}
                    </span>
                    <strong>{money(category.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        <article className="home-panel">
          <div className="home-panel-heading">
            <div>
              <h2>Category Budget Status</h2>
              <p>Monitor your monthly category limits.</p>
            </div>
          </div>

          {monthlyBudgets.length === 0 ? (
            <div className="home-empty">
              No monthly budgets found. Add categories in Budget Planner.
            </div>
          ) : (
            <div className="home-budget-list">
              {monthlyBudgets.map((budget, index) => {
                const category = budget.category || budget.cat || "Other";
                const limit =
                  Number(budget.amount ?? budget.allocated) || 0;

                const spent = monthlyExpenses
                  .filter((expense) => expense.category === category)
                  .reduce(
                    (sum, expense) =>
                      sum + (Number(expense.amount) || 0),
                    0
                  );

                const percent =
                  limit > 0 ? Math.round((spent / limit) * 100) : 0;

                return (
                  <div
                    className="home-budget-row"
                    key={budget.id ?? `${category}-${index}`}
                  >
                    <div className="home-budget-row-heading">
                      <span>{category}</span>
                      <strong>{money(spent)} / {money(limit)}</strong>
                    </div>

                    <div className="home-progress-track small">
                      <div
                        className={`home-progress-fill ${
                          percent >= 100
                            ? "over-budget"
                            : percent >= 80
                            ? "near-limit"
                            : ""
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(percent, 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="home-budget-row-footer">
                      <span>{percent}% used</span>
                      {percent >= 100 ? (
                        <span className="home-status danger">
                          Over budget
                        </span>
                      ) : percent >= 80 ? (
                        <span className="home-status warning">
                          Near limit
                        </span>
                      ) : (
                        <span className="home-status safe">
                          On track
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
