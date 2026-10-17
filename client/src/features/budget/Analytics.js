import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Legend,
} from "recharts";
import { CreditCard, Utensils, PiggyBank, Zap } from "lucide-react";
import api from "../../services/api";
import "./BudgetAnalytics.css";

const COLORS = [
  "#2E93C7",
  "#0D6D91",
  "#5FA7D2",
  "#8DBEE3",
  "#B9D2E7",
  "#164A72",
];

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatMonth(value) {
  if (!value) return "Unknown";

  // The API normally returns YYYY-MM.
  const match = String(value).match(/^(\d{4})-(\d{2})$/);

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      1
    ).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }

  return String(value);
}

function EmptyChart({ children = "No data available yet." }) {
  return (
    <div
      style={{
        height: 230,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#6B8295",
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        // Fetch actual data belonging to the logged-in user.
        const [analyticsResult, budgetsResult] = await Promise.all([
          api.getAnalytics(),
          api.getBudgets(),
        ]);

        if (!active) return;

        setOverview(analyticsResult || {});
        setBudgets(Array.isArray(budgetsResult) ? budgetsResult : []);
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Could not load analytics. Check that the backend is running and you are logged in."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const data = Array.isArray(overview?.by_category)
      ? overview.by_category
      : [];

    return data
      .map((item, index) => ({
        name: item.category || "Miscellaneous",
        value: Number(item.total || 0),
        color: COLORS[index % COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [overview]);

  const monthlyTrend = useMemo(() => {
    const data = Array.isArray(overview?.monthly_trends)
      ? overview.monthly_trends
      : [];

    return data.map((item) => ({
      month: formatMonth(item.month),
      expenses: Number(item.total || 0),
    }));
  }, [overview]);

  const totalExpenses = Number(overview?.total_spending || 0);
  const budgetTotal = Number(overview?.budget_total || 0);
  const remainingBudget = Number(
    overview?.remaining_budget ?? budgetTotal - totalExpenses
  );

  const currentDay = new Date().getDate();
  const averageDaily = currentDay > 0 ? totalExpenses / currentDay : 0;

  const topCategory = [...categories].sort(
    (a, b) => b.value - a.value
  )[0];

  const budgetUsed =
    budgetTotal > 0
      ? Math.round((totalExpenses / budgetTotal) * 100)
      : null;

  const stats = [
    {
      label: "Avg Daily Spending",
      value: money(averageDaily),
      sub: "Current month to date",
      icon: CreditCard,
      color: "blue",
    },
    {
      label: "Top Category",
      value: topCategory?.name || "—",
      sub: topCategory
        ? `${money(topCategory.value)} spent`
        : "No spending recorded",
      icon: Utensils,
      color: "navy",
    },
    {
      label: "Remaining Budget",
      value: budgetTotal > 0 ? money(remainingBudget) : "—",
      sub:
        budgetTotal > 0
          ? `${money(budgetTotal)} total budget`
          : "Create a budget to track this",
      icon: PiggyBank,
      color: "sky",
    },
    {
      label: "Budget Used",
      value: budgetUsed === null ? "—" : `${budgetUsed}%`,
      sub:
        budgetUsed === null
          ? "No budget configured"
          : `${money(totalExpenses)} spent`,
      icon: Zap,
      color: "deep",
    },
  ];

  if (loading) {
    return (
      <div className="ba-page">
        <div className="ba-page-heading ba-analytics-heading">
          <div>
            <h1>Analytics</h1>
            <p>Deep insights into your financial habits</p>
          </div>
        </div>
        <section className="ba-card" style={{ padding: 24 }}>
          Loading your financial analytics...
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ba-page">
        <div className="ba-page-heading ba-analytics-heading">
          <div>
            <h1>Analytics</h1>
            <p>Deep insights into your financial habits</p>
          </div>
        </div>
        <section className="ba-card" style={{ padding: 24 }}>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, cursor: "pointer" }}
          >
            Retry
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="ba-page">
      <div className="ba-page-heading ba-analytics-heading">
        <div>
          <h1>Analytics</h1>
          <p>Insights based on your saved financial data</p>
        </div>
      </div>

      <div className="ba-analytics-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <section className="ba-card ba-stat-card" key={stat.label}>
              <div className={`ba-stat-icon ba-stat-${stat.color}`}>
                <Icon size={19} />
              </div>
              <div className="ba-stat-copy">
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
                <small>{stat.sub}</small>
              </div>
            </section>
          );
        })}
      </div>

      <div className="ba-analytics-grid">
        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Expenses by Category</h2>

          {categories.length === 0 ? (
            <EmptyChart>
              No expenses yet. Add an expense to see your category breakdown.
            </EmptyChart>
          ) : (
            <div className="ba-donut-layout ba-analytics-donut-layout">
              <div className="ba-donut">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={49}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {categories.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="ba-legend">
                {categories.map((item) => (
                  <div className="ba-legend-row" key={item.name}>
                    <span className="ba-legend-name">
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <strong>{money(item.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Monthly Expenses</h2>

          {monthlyTrend.length === 0 ? (
            <EmptyChart>
              Monthly spending will appear after you record expenses.
            </EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={monthlyTrend} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E4EFF7"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Bar
                  dataKey="expenses"
                  fill="#2E93C7"
                  radius={[3, 3, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Monthly Spending Trend</h2>

          {monthlyTrend.length === 0 ? (
            <EmptyChart>
              Your spending trend will appear when monthly expense data exists.
            </EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E4EFF7"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#2E93C7"
                  strokeWidth={2.5}
                  dot={{ fill: "#2E93C7", r: 4 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Budget Overview</h2>

          {budgets.length === 0 ? (
            <EmptyChart>
              Create a budget to start tracking your category limits.
            </EmptyChart>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={budgets.map((item) => ({
                  category: item.category,
                  allocated: Number(item.amount || 0),
                }))}
              >
                <defs>
                  <linearGradient
                    id="ba-savings-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#0D6D91"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#0D6D91"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E4EFF7"
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5FA7D2" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip formatter={(value) => money(value)} />
                <Area
                  type="monotone"
                  dataKey="allocated"
                  stroke="#0D6D91"
                  strokeWidth={2.5}
                  fill="url(#ba-savings-gradient)"
                  name="Budget allocated"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <p className="ba-data-note">
        Analytics uses your saved budgets and expense records. Income and
        savings-growth tracking are not available because the current backend
        does not store income transactions.
      </p>
    </div>
  );
}
