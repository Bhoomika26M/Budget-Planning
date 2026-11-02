
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Download,
  Edit2,
  Plus,
  RefreshCw,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../services/api";
import "./Income.css";

const COLORS = ["#1e3a5f", "#2E93C7", "#5FA7D2", "#8DBEE3", "#b8d4e8", "#ddeaf5"];
const SOURCES = ["Pocket Money", "Scholarship", "Freelance", "Part-time Job", "Other"];
const FREQUENCIES = ["Monthly", "One-time", "Weekly"];

const money = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const isoDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 10)
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const displayDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${isoDate(value)}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const normalizeIncome = (item) => ({
  id: item.id,
  source: item.title || item.source || "Other",
  amount: Number(item.amount) || 0,
  date: isoDate(item.date),
  freq: FREQUENCIES.includes(item.category) ? item.category : "One-time",
  description: item.description || "",
});

const toPayload = (item) => ({
  title: item.source,
  category: item.freq,
  amount: Number(item.amount),
  date: isoDate(item.date),
  description: item.description || null,
});

function IncomeModal({ initial, onSave, onClose, saving }) {
  const [source, setSource] = useState(initial?.source || SOURCES[0]);
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : ""
  );
  const [date, setDate] = useState(
    initial?.date || new Date().toISOString().slice(0, 10)
  );
  const [freq, setFreq] = useState(initial?.freq || "Monthly");
  const [description, setDescription] = useState(initial?.description || "");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    if (!source.trim()) {
      setError("Please select an income source.");
      return;
    }

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    setError("");

    try {
      await onSave({
        ...(initial || {}),
        source: source.trim(),
        amount: Number(amount),
        date,
        freq,
        description: description.trim(),
      });
    } catch (err) {
      setError(err.message || "Unable to save this income.");
    }
  }

  return (
    <div className="inc-modal-backdrop" onMouseDown={onClose}>
      <div
        className="inc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inc-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="inc-modal-heading">
          <div>
            <h3 id="inc-modal-title">
              {initial ? "Edit Income" : "Add Income"}
            </h3>
            <p>Record an income transaction</p>
          </div>
          <button
            type="button"
            className="inc-icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form className="inc-form" onSubmit={submit}>
          {error && <div className="inc-error">{error}</div>}

          <label>
            Income Source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              {SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 8000"
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label>
            Frequency
            <select
              value={freq}
              onChange={(event) => setFreq(event.target.value)}
            >
              {FREQUENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description <span className="inc-optional">(optional)</span>
            <textarea
              rows={3}
              maxLength={255}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a note about this income"
            />
          </label>

          <div className="inc-modal-actions">
            <button
              type="button"
              className="inc-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inc-primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="inc-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  {initial ? "Save Changes" : "Add Income"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, badge, sub, positive, icon: Icon, action, onAction }) {
  return (
    <div className="inc-stat-card">
      <div className="inc-stat-top">
        <p>{label}</p>
        <span className={`inc-stat-badge ${positive ? "positive" : "negative"}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {badge}
        </span>
      </div>

      <div className="inc-stat-value">{money(value)}</div>
      <p className="inc-stat-sub">{sub}</p>

      {action && (
        <button type="button" className="inc-text-link" onClick={onAction}>
          {action} <ChevronRight size={13} />
        </button>
      )}

      <div className="inc-stat-icon">
        <Icon size={19} />
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return <section className={`inc-panel ${className}`}>{children}</section>;
}

export default function Income() {
  const [incomeList, setIncomeList] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [breakdownPeriod, setBreakdownPeriod] = useState("Monthly");
  const [showAllActivity, setShowAllActivity] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      api.getIncome(),
      api.getExpenses(),
    ]);

    const incomeResult = results[0];
    const expenseResult = results[1];

    if (incomeResult.status === "fulfilled") {
      setIncomeList(
        Array.isArray(incomeResult.value)
          ? incomeResult.value.map(normalizeIncome)
          : []
      );
    } else {
      setError(incomeResult.reason?.message || "Unable to load income.");
    }

    if (expenseResult.status === "fulfilled") {
      const rows = Array.isArray(expenseResult.value)
        ? expenseResult.value
        : [];

      setExpenses(
        rows.map((item) => ({
          id: item.id,
          desc: item.title || item.description || item.desc || "Expense",
          cat: item.category || item.cat || "Other",
          amount: Number(item.amount) || 0,
          date: isoDate(item.date),
        }))
      );
    } else {
      setExpenses([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveIncome = async (item) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = toPayload(item);
      let result;

      if (item.id) {
        result = await api.updateIncome(item.id, payload);
        setIncomeList((previous) =>
          previous.map((record) =>
            record.id === item.id ? normalizeIncome(result) : record
          )
        );
        setNotice("Income updated successfully.");
      } else {
        result = await api.createIncome(payload);
        setIncomeList((previous) => [
          normalizeIncome(result),
          ...previous,
        ]);
        setNotice("Income added successfully.");
      }

      setModal(null);
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteIncome = async (item) => {
    if (!window.confirm(`Delete income "${item.source}"?`)) return;

    setError("");
    setNotice("");

    try {
      await api.deleteIncome(item.id);
      setIncomeList((previous) =>
        previous.filter((record) => record.id !== item.id)
      );
      setNotice("Income deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete income.");
    }
  };

  const totalIncome = useMemo(
    () => incomeList.reduce((sum, item) => sum + item.amount, 0),
    [incomeList]
  );

  const totalExpense = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses]
  );

  const netCashFlow = totalIncome - totalExpense;

  const freelanceAmount = incomeList
    .filter((item) => item.source.toLowerCase() === "freelance")
    .reduce((sum, item) => sum + item.amount, 0);

  const now = new Date();
  const thisMonth = monthKey(now);
  const thisQuarter = Math.floor(now.getMonth() / 3);
  const thisYear = now.getFullYear();

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((item) => {
        const date = new Date(`${item.date}T00:00:00`);

        if (breakdownPeriod === "Monthly") {
          return monthKey(date) === thisMonth;
        }
        if (breakdownPeriod === "Quarterly") {
          return (
            date.getFullYear() === thisYear &&
            Math.floor(date.getMonth() / 3) === thisQuarter
          );
        }
        return date.getFullYear() === thisYear;
      }),
    [expenses, breakdownPeriod, thisMonth, thisQuarter, thisYear]
  );

  const breakdownData = useMemo(() => {
    const totals = {};

    filteredExpenses.forEach((item) => {
      totals[item.cat] = (totals[item.cat] || 0) + item.amount;
    });

    return Object.entries(totals).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }));
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
      const key = monthKey(date);

      const income = incomeList
        .filter((item) => item.date.startsWith(key))
        .reduce((sum, item) => sum + item.amount, 0);

      const expense = expenses
        .filter((item) => item.date.startsWith(key))
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        income,
        expenses: expense,
      };
    });
  }, [incomeList, expenses, thisMonth]);

  const allActivity = useMemo(
    () =>
      [
        ...incomeList.map((item) => ({
          id: `inc-${item.id}`,
          label: item.source,
          date: item.date,
          type: "income",
          amount: item.amount,
        })),
        ...expenses.map((item) => ({
          id: `exp-${item.id}`,
          label: item.desc,
          date: item.date,
          type: "expense",
          amount: item.amount,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [incomeList, expenses]
  );

  const upcoming = incomeList
    .filter((item) => item.freq === "Monthly")
    .slice(0, 5);

  const exportCSV = () => {
    const rows = [
      ["Source", "Amount", "Date", "Frequency", "Description"],
      ...incomeList.map((item) => [
        item.source,
        String(item.amount),
        item.date,
        item.freq,
        item.description || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "BudgetBuddy_Income.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="income-screen">
      {modal && (
        <IncomeModal
          initial={modal === "add" ? null : modal}
          onSave={saveIncome}
          onClose={() => !saving && setModal(null)}
          saving={saving}
        />
      )}

      {showAllActivity && (
        <div className="inc-modal-backdrop" onMouseDown={() => setShowAllActivity(false)}>
          <div
            className="inc-modal inc-activity-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="inc-modal-heading">
              <div>
                <h3>All Activity</h3>
                <p>Income and expense transactions</p>
              </div>
              <button
                className="inc-icon-button"
                onClick={() => setShowAllActivity(false)}
                aria-label="Close activity"
              >
                <X size={18} />
              </button>
            </div>
            <ActivityList activity={allActivity} />
          </div>
        </div>
      )}

      <header className="inc-page-header">
        <div>
          <h1>Income Management</h1>
          <p>Track your revenue, cash flow and income sources</p>
        </div>

        <div className="inc-header-actions">
          <button className="inc-export-button" onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="inc-primary-button" onClick={() => setModal("add")}>
            <Plus size={16} /> Add Income
          </button>
        </div>
      </header>

      {error && (
        <div className="inc-banner inc-banner-error" role="alert">
          <span>{error}</span>
          <button onClick={loadData}>
            <RefreshCw size={14} /> Retry
          </button>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {notice && (
        <div className="inc-banner inc-banner-success" role="status">
          <CheckCircle size={15} />
          <span>{notice}</span>
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="inc-loading">
          <RefreshCw size={22} className="inc-spin" />
          Loading your financial data...
        </div>
      ) : (
        <>
          <div className="inc-stat-grid">
            <StatCard
              label="Total Revenue"
              value={totalIncome}
              positive
              badge="Income"
              sub="All recorded sources"
              icon={TrendingUp}
            />
            <StatCard
              label="Total Expenses"
              value={totalExpense}
              positive={false}
              badge="Expenses"
              sub="Recorded transactions"
              icon={CreditCard}
              action="Review Expenses"
              onAction={() => window.location.assign("/expenses")}
            />
            <StatCard
              label="Net Cash Flow"
              value={netCashFlow}
              positive={netCashFlow >= 0}
              badge={netCashFlow >= 0 ? "Surplus" : "Deficit"}
              sub="Income − Expenses"
              icon={Wallet}
            />
            <StatCard
              label="Freelance"
              value={freelanceAmount}
              positive
              badge="Earnings"
              sub="Freelance income"
              icon={BarChart2}
            />
          </div>

          <div className="inc-main-grid">
            <Panel className="inc-cashflow-panel">
              <div className="inc-panel-heading">
                <div>
                  <h2>Cash Flow Analysis</h2>
                  <p>Income and expenses over the last seven months</p>
                </div>
                <div className="inc-chart-legend">
                  <span><i className="inc-legend-income" /> Income</span>
                  <span><i className="inc-legend-expense" /> Expenses</span>
                </div>
              </div>

              <div className="inc-cashflow-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inc-income-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E93C7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2E93C7" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="inc-expense-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={54}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(value) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                      formatter={(value, name) => [money(value), name === "income" ? "Income" : "Expenses"]}
                    />
                    <Area type="monotone" dataKey="income" stroke="#2E93C7" strokeWidth={2.5} fill="url(#inc-income-gradient)" dot={false} />
                    <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2.5} fill="url(#inc-expense-gradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="inc-activity-panel">
              <div className="inc-panel-heading">
                <h2>Recent Activity</h2>
                <button className="inc-text-link" onClick={() => setShowAllActivity(true)}>
                  Show All <ChevronRight size={13} />
                </button>
              </div>
              <ActivityList activity={allActivity.slice(0, 5)} />
            </Panel>
          </div>

          <div className="inc-bottom-grid">
            <Panel>
              <div className="inc-panel-heading">
                <h2>Expense Breakdown</h2>
                <span className="inc-muted-icon"><BarChart2 size={16} /></span>
              </div>

              <div className="inc-period-tabs">
                {["Monthly", "Quarterly", "Yearly"].map((period) => (
                  <button
                    key={period}
                    className={breakdownPeriod === period ? "active" : ""}
                    onClick={() => setBreakdownPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {breakdownData.length ? (
                <>
                  <div className="inc-pie-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdownData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={43}
                          outerRadius={70}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {breakdownData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [money(value), "Amount"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="inc-breakdown-list">
                    {breakdownData.slice(0, 5).map((item) => (
                      <div className="inc-breakdown-row" key={item.name}>
                        <span className="inc-breakdown-dot" style={{ background: item.color }} />
                        <span className="inc-breakdown-name">{item.name}</span>
                        <strong>{money(item.value)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="inc-empty-small">No expenses for this period.</div>
              )}
            </Panel>

            <Panel>
              <div className="inc-panel-heading">
                <h2>Income Sources</h2>
                <button className="inc-text-link" onClick={() => setModal("add")}>
                  <Plus size={13} /> Add
                </button>
              </div>

              {incomeList.length ? (
                <div className="inc-source-list">
                  {incomeList.slice(0, 5).map((item) => (
                    <div className="inc-source-row" key={item.id}>
                      <div className="inc-source-avatar">
                        {item.source.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="inc-source-info">
                        <strong>{item.source}</strong>
                        <span>{displayDate(item.date)}</span>
                      </div>
                      <div className="inc-source-amount">
                        <strong>{money(item.amount)}</strong>
                        <button
                          onClick={() => setModal(item)}
                          aria-label={`Edit ${item.source}`}
                          title="Edit income"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteIncome(item)}
                          aria-label={`Delete ${item.source}`}
                          title="Delete income"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="inc-empty-small">
                  No income records yet. Add your first income.
                </div>
              )}
            </Panel>

            <Panel>
              <div className="inc-panel-heading">
                <h2>Upcoming Income</h2>
                <CalendarDays size={17} className="inc-heading-icon" />
              </div>
              <p className="inc-panel-subtitle">Recurring monthly income sources</p>

              {upcoming.length ? (
                <div className="inc-upcoming-list">
                  {upcoming.map((item) => (
                    <div className="inc-upcoming-row" key={item.id}>
                      <div className="inc-upcoming-icon"><CalendarDays size={15} /></div>
                      <div className="inc-upcoming-info">
                        <strong>{item.source}</strong>
                        <span>{item.freq} · {displayDate(item.date)}</span>
                      </div>
                      <strong className="inc-upcoming-amount">{money(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="inc-empty-small">
                  No monthly income sources yet.
                </div>
              )}
            </Panel>
          </div>

          {/* <Panel className="inc-monthly-panel">
            <div className="inc-panel-heading">
              <div>
                <h2>Monthly Income vs Expenses</h2>
                <p>Comparison based on your saved transactions</p>
              </div>
            </div>
            <div className="inc-monthly-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5FA7D2" }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} tick={{ fontSize: 10, fill: "#5FA7D2" }} />
                  <Tooltip formatter={(value) => [money(value), ""]} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="income" fill="#2E93C7" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#8DBEE3" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel> */}
        </>
      )}
    </div>
  );
}

function ActivityList({ activity }) {
  if (!activity.length) {
    return <div className="inc-empty-small">No recent activity.</div>;
  }

  return (
    <div className="inc-activity-list">
      {activity.map((item) => (
        <div className="inc-activity-row" key={item.id}>
          <div className={`inc-activity-icon ${item.type}`}>
            {item.type === "income" ? <TrendingUp size={14} /> : <CreditCard size={14} />}
          </div>
          <div className="inc-activity-info">
            <strong>{item.label}</strong>
            <span>{displayDate(item.date)}</span>
          </div>
          <strong className={`inc-activity-amount ${item.type}`}>
            {item.type === "income" ? "+" : "−"}{money(item.amount)}
          </strong>
        </div>
      ))}
    </div>
  );
}
