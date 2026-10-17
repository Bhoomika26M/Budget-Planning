
import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Wallet,
  TrendingUp,
  CalendarDays,
  CircleDollarSign,
  BriefcaseBusiness,
  Laptop,
  Gift,
  Banknote,
  MoreHorizontal,
} from "lucide-react";
import "./Income.css";

const INITIAL_INCOME = [
  {
    id: 1,
    title: "Monthly Salary",
    category: "Salary",
    amount: 35000,
    date: "2026-10-01",
    description: "Monthly salary payment",
  },
  {
    id: 2,
    title: "Freelance Website",
    category: "Freelance",
    amount: 8500,
    date: "2026-10-05",
    description: "Website development project",
  },
  {
    id: 3,
    title: "Investment Returns",
    category: "Investments",
    amount: 2500,
    date: "2026-10-10",
    description: "Investment earnings",
  },
  {
    id: 4,
    title: "Scholarship",
    category: "Other",
    amount: 5000,
    date: "2026-10-14",
    description: "Education scholarship",
  },
  {
    id: 5,
    title: "Part-time Work",
    category: "Freelance",
    amount: 4000,
    date: "2026-09-20",
    description: "Part-time work payment",
  },
];

const CATEGORIES = ["Salary", "Freelance", "Investments", "Business", "Other"];

const EMPTY_FORM = {
  title: "",
  category: "Salary",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

const CATEGORY_ICONS = {
  Salary: BriefcaseBusiness,
  Freelance: Laptop,
  Investments: TrendingUp,
  Business: Banknote,
  Other: Gift,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function Income() {
  const [income, setIncome] = useState(INITIAL_INCOME);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [period, setPeriod] = useState("This Month");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const isInPeriod = (item) => {
    const date = new Date(`${item.date}T00:00:00`);

    if (period === "All Time") return true;

    if (period === "This Month") {
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    }

    if (period === "This Year") {
      return date.getFullYear() === currentYear;
    }

    return true;
  };

  const periodIncome = useMemo(
    () => income.filter(isInPeriod),
    [income, period, currentMonth, currentYear]
  );

  const totalIncome = periodIncome.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const previousMonthIncome = income
    .filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      const previousMonth = new Date(currentYear, currentMonth - 1, 1);

      return (
        date.getMonth() === previousMonth.getMonth() &&
        date.getFullYear() === previousMonth.getFullYear()
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const currentMonthIncome = income
    .filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const growth =
    previousMonthIncome > 0
      ? ((currentMonthIncome - previousMonthIncome) /
          previousMonthIncome) *
        100
      : null;

  const filteredIncome = periodIncome
    .filter((item) => {
      const query = search.trim().toLowerCase();

      return (
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    })
    .filter(
      (item) =>
        categoryFilter === "All" || item.category === categoryFilter
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const categoryTotals = CATEGORIES.map((category) => ({
    category,
    amount: periodIncome
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0);

  const monthlyTotals = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - 5 + index, 1);

    const amount = income
      .filter((item) => {
        const itemDate = new Date(`${item.date}T00:00:00`);
        return (
          itemDate.getMonth() === date.getMonth() &&
          itemDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      amount,
    };
  });

  const maxMonthlyAmount = Math.max(
    ...monthlyTotals.map((item) => item.amount),
    1
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      date: item.date,
      description: item.description,
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setError("Please enter an income source.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select a date.");
      return;
    }

    const entry = {
      id: editingId ?? Date.now(),
      title: form.title.trim(),
      category: form.category,
      amount,
      date: form.date,
      description: form.description.trim(),
    };

    if (editingId !== null) {
      setIncome((previous) =>
        previous.map((item) => (item.id === editingId ? entry : item))
      );
    } else {
      setIncome((previous) => [...previous, entry]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this income entry?")) {
      setIncome((previous) => previous.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="income-page">
      <header className="income-page-header">
        <div>
          <span className="income-eyebrow">FINANCIAL OVERVIEW</span>
          <h1>Income Management</h1>
          <p>Track your earnings and understand where your money comes from.</p>
        </div>

        <button className="income-primary-button" onClick={openAddModal}>
          <Plus size={18} />
          Add Income
        </button>
      </header>

      <section className="income-summary-grid">
        <article className="income-summary-card income-total-card">
          <div className="income-card-top">
            <span>Total Income</span>
            <div className="income-summary-icon blue">
              <Wallet size={21} />
            </div>
          </div>
          <h2>{formatCurrency(totalIncome)}</h2>
          <p>
            {period === "All Time"
              ? "Across all recorded income"
              : period === "This Year"
                ? "Income this year"
                : "Income this month"}
          </p>
        </article>

        <article className="income-summary-card">
          <div className="income-card-top">
            <span>Income Sources</span>
            <div className="income-summary-icon teal">
              <CircleDollarSign size={21} />
            </div>
          </div>
          <h2>{periodIncome.length}</h2>
          <p>Recorded transactions</p>
        </article>

        <article className="income-summary-card">
          <div className="income-card-top">
            <span>Average Income</span>
            <div className="income-summary-icon purple">
              <CalendarDays size={21} />
            </div>
          </div>
          <h2>
            {formatCurrency(
              periodIncome.length ? totalIncome / periodIncome.length : 0
            )}
          </h2>
          <p>Per recorded transaction</p>
        </article>

        <article className="income-summary-card">
          <div className="income-card-top">
            <span>Monthly Growth</span>
            <div className="income-summary-icon green">
              <TrendingUp size={21} />
            </div>
          </div>
          <h2 className={growth !== null && growth < 0 ? "negative-growth" : ""}>
            {growth === null
              ? "—"
              : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          </h2>
          <p>Compared with previous month</p>
        </article>
      </section>

      <section className="income-insights-grid">
        <article className="income-panel income-chart-panel">
          <div className="income-panel-header">
            <div>
              <h2>Income Overview</h2>
              <p>Your earnings over the last six months</p>
            </div>
            <span className="income-chart-legend">
              <span />
              Income
            </span>
          </div>

          <div className="income-chart">
            {monthlyTotals.map((month) => (
              <div className="income-chart-column" key={month.label}>
                <span className="income-chart-value">
                  {month.amount > 0
                    ? new Intl.NumberFormat("en-IN", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(month.amount)
                    : ""}
                </span>
                <div className="income-chart-bar-area">
                  <div
                    className="income-chart-bar"
                    style={{
                      height: `${Math.max(
                        (month.amount / maxMonthlyAmount) * 100,
                        month.amount > 0 ? 5 : 0
                      )}%`,
                    }}
                    title={`${month.label}: ${formatCurrency(month.amount)}`}
                  />
                </div>
                <span className="income-chart-label">{month.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="income-panel income-category-panel">
          <div className="income-panel-header">
            <div>
              <h2>Income by Category</h2>
              <p>Breakdown for the selected period</p>
            </div>
            <MoreHorizontal size={21} color="#7790a6" />
          </div>

          {categoryTotals.length === 0 ? (
            <div className="income-empty-category">
              No income recorded for this period.
            </div>
          ) : (
            <div className="income-category-list">
              {categoryTotals.map(({ category, amount }) => {
                const Icon = CATEGORY_ICONS[category] || Gift;
                const percentage =
                  totalIncome > 0 ? (amount / totalIncome) * 100 : 0;

                return (
                  <div className="income-category-item" key={category}>
                    <div className="income-category-row">
                      <div className="income-category-name">
                        <span className={`income-category-icon ${category.toLowerCase()}`}>
                          <Icon size={17} />
                        </span>
                        <span>{category}</span>
                      </div>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                    <div className="income-progress-track">
                      <div
                        className={`income-progress-fill ${category.toLowerCase()}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="income-category-percentage">
                      {percentage.toFixed(1)}% of total income
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="income-panel income-transactions-panel">
        <div className="income-transactions-header">
          <div>
            <h2>Income Transactions</h2>
            <p>View and manage your income records.</p>
          </div>

          <select
            className="income-period-select"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="Filter income period"
          >
            <option>This Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>

        <div className="income-filters">
          <div className="income-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search income..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="income-category-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by income category"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="income-table-wrapper">
          <table className="income-table">
            <thead>
              <tr>
                <th>INCOME SOURCE</th>
                <th>CATEGORY</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredIncome.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || Gift;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="income-source-cell">
                        <span className={`income-source-icon ${item.category.toLowerCase()}`}>
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.description || "No description"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="income-category-badge">
                        {item.category}
                      </span>
                    </td>
                    <td className="income-date-cell">{formatDate(item.date)}</td>
                    <td className="income-amount-cell">
                      +{formatCurrency(item.amount)}
                    </td>
                    <td>
                      <div className="income-actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          aria-label={`Edit ${item.title}`}
                          title="Edit income"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.title}`}
                          title="Delete income"
                          className="income-delete-button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredIncome.length === 0 && (
                <tr>
                  <td colSpan="5" className="income-empty-state">
                    <Wallet size={28} />
                    <strong>No income found</strong>
                    <span>Try changing your filters or add a new income entry.</span>
                    <button
                      className="income-empty-add"
                      onClick={openAddModal}
                    >
                      <Plus size={16} /> Add Income
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="income-table-footer">
          Showing {filteredIncome.length} of {periodIncome.length} transactions
        </div>
      </section>

      {modalOpen && (
        <div
          className="income-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="income-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="income-modal-title"
          >
            <div className="income-modal-header">
              <div>
                <h2 id="income-modal-title">
                  {editingId !== null ? "Edit Income" : "Add Income"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the details of this income entry."
                    : "Enter the details of your new income."}
                </p>
              </div>

              <button
                type="button"
                className="income-modal-close"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Income source
                <input
                  type="text"
                  placeholder="e.g. Monthly Salary"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                  autoFocus
                />
              </label>

              <div className="income-form-row">
                <label>
                  Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    {CATEGORIES.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Date received
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Description (optional)
                <textarea
                  rows="3"
                  placeholder="Add a note about this income..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              {error && <p className="income-form-error">{error}</p>}

              <div className="income-modal-actions">
                <button
                  type="button"
                  className="income-cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="income-primary-button">
                  {editingId !== null ? "Save Changes" : "Add Income"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
