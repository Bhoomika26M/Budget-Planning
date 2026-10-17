import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Utensils, Plane, ShoppingBag, BookOpen, Gamepad2, MoreHorizontal,
   CalendarDays, Plus, Edit2, Trash2, AlertTriangle, X,
} from "lucide-react";
import "./BudgetAnalytics.css";

const COLORS = {
  "Food & Dining": "#2E93C7",
  Food: "#2E93C7",
  Travel: "#0D6D91",
  Shopping: "#5FA7D2",
  Education: "#8DBEE3",
  Entertainment: "#164A72",
  Miscellaneous: "#B9D2E7",
};

const CATEGORY_OPTIONS = [
  "Food & Dining",
  "Travel",
  "Shopping",
  "Education",
  "Entertainment",
  "Miscellaneous",
];

const ICONS = {
  "Food & Dining": Utensils,
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Education: BookOpen,
  Entertainment: Gamepad2,
  Miscellaneous: MoreHorizontal,
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="ba-modal-backdrop" onMouseDown={onClose}>
      <section
        className="ba-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ba-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="ba-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <div className="ba-modal-body">{children}</div>
      </section>
    </div>
  );
}

function BudgetForm({ initial, onSave, onClose, saving }) {
  const [cat, setCat] = useState(initial?.cat || CATEGORY_OPTIONS[0]);
  const [allocated, setAllocated] = useState(
    String(initial?.allocated ?? "")
  );
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!allocated || !Number.isFinite(Number(allocated)) || Number(allocated) <= 0) {
      setError("Enter a valid monthly limit greater than zero.");
      return;
    }

    if (
      !initial &&
      typeof initial === "undefined" &&
      false
    ) {
      return;
    }

    const result = await onSave({
      cat,
      allocated: Number(allocated),
      spent: Number(initial?.spent || 0),
      color: COLORS[cat] || "#2E93C7",
    });

    if (result?.success) {
      onClose();
    } else if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <Modal
      title={initial ? "Edit Budget Category" : "Add Budget Category"}
      onClose={onClose}
    >
      <form className="ba-form" onSubmit={submit}>
        <label>
          Category
          <select
            value={cat}
            onChange={(event) => setCat(event.target.value)}
            disabled={Boolean(initial) || saving}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Monthly limit (₹)
          <input
            type="number"
            min="1"
            step="0.01"
            value={allocated}
            onChange={(event) => setAllocated(event.target.value)}
            placeholder="e.g. 4000"
            required
            disabled={saving}
          />
        </label>

        <p className="ba-muted">
          Spending for this category is calculated from your saved expenses.
        </p>

        {error && (
          <p className="ba-form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="ba-primary-button"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : initial
              ? "Save Changes"
              : "Add Category"}
        </button>
      </form>
    </Modal>
  );
}

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [budgetRecords, expenseRecords] = await Promise.all([
        api.getBudgets(),
        api.getExpenses(),
      ]);

      if (!Array.isArray(budgetRecords) || !Array.isArray(expenseRecords)) {
        throw new Error("The server returned an unexpected budget or expense response.");
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const spendingByCategory = {};

      expenseRecords.forEach((expense) => {
        if (!expense.expense_date) return;

        const expenseDate = new Date(`${expense.expense_date}T00:00:00`);

        if (
          Number.isNaN(expenseDate.getTime()) ||
          expenseDate.getMonth() !== currentMonth ||
          expenseDate.getFullYear() !== currentYear
        ) {
          return;
        }

        const category = expense.category || "Miscellaneous";
        spendingByCategory[category] =
          (spendingByCategory[category] || 0) +
          Number(expense.amount || 0);
      });

      const monthlyRecords = budgetRecords.filter(
        (budget) => budget.period === "monthly"
      );

      const mappedBudgets = monthlyRecords.map((budget) => ({
        id: budget.id,
        cat: budget.category,
        allocated: Number(budget.amount || 0),
        spent: Number(spendingByCategory[budget.category] || 0),
        color: COLORS[budget.category] || "#2E93C7",
      }));

      setBudgets(mappedBudgets);

      const total = mappedBudgets.reduce(
        (sum, item) => sum + item.allocated,
        0
      );

      setMonthlyBudget(total);
    } catch (err) {
      setError(err.message || "Unable to load budget data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const totalAllocated = budgets.reduce(
    (sum, item) => sum + Number(item.allocated || 0),
    0
  );

  const totalSpent = budgets.reduce(
    (sum, item) => sum + Number(item.spent || 0),
    0
  );

  const remaining = Math.max(monthlyBudget - totalSpent, 0);
  const unallocated = Math.max(monthlyBudget - totalAllocated, 0);

  const allocatedPercent = monthlyBudget
    ? Math.min(Math.round((totalAllocated / monthlyBudget) * 100), 100)
    : 0;

  const spentPercent = monthlyBudget
    ? Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100)
    : 0;

  const overAllocated = totalAllocated > monthlyBudget;

  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  async function saveCategory(item) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (categoryToEdit) {
        await api.updateBudget(categoryToEdit.id, {
          category: item.cat,
          amount: item.allocated,
          period: "monthly",
        });

        setNotice("Budget category updated successfully.");
      } else {
        const duplicate = budgets.some(
          (budget) => budget.cat === item.cat
        );

        if (duplicate) {
          const message =
            "A budget already exists for this category. Edit the existing category instead.";
          setError(message);
          return { success: false, error: message };
        }

        await api.createBudget({
          category: item.cat,
          amount: item.allocated,
          period: "monthly",
        });

        setNotice("Budget category added successfully.");
      }

      setCategoryToEdit(null);
      setShowAdd(false);

      await loadBudgets();

      return { success: true };
    } catch (err) {
      const message =
        err.message || "Unable to save the budget category.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(item) {
    if (!item.id) {
      setError(
        "This budget has no database ID. Reload the page and try again."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete the ${item.cat} budget category?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.deleteBudget(item.id);
      setNotice("Budget category deleted successfully.");
      await loadBudgets();
    } catch (err) {
      setError(err.message || "Unable to delete the budget category.");
    }
  }

  const allocationData = useMemo(
    () => [
      ...budgets.map((item) => ({
        name: item.cat,
        value: Number(item.allocated || 0),
        color: item.color || COLORS[item.cat] || "#2E93C7",
      })),
      ...(unallocated > 0
        ? [{ name: "Unallocated", value: unallocated, color: "#E4EFF7" }]
        : []),
    ],
    [budgets, unallocated]
  );

  return (
    <div className="ba-page">
      {loading && (
        <p className="ba-muted" role="status">
          Loading budgets from the server...
        </p>
      )}

      {error && (
        <div className="ba-form-error" role="alert">
          <span>{error}</span>{" "}
          <button
            type="button"
            className="ba-secondary-button"
            onClick={loadBudgets}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {(showAdd || categoryToEdit) && (
        <BudgetForm
          key={categoryToEdit?.id || "new"}
          initial={categoryToEdit}
          onSave={saveCategory}
          onClose={() => {
            setShowAdd(false);
            setCategoryToEdit(null);
          }}
          saving={saving}
        />
      )}

      {notice && (
        <div className="ba-toast" role="status">
          {notice}
        </div>
      )}

      <div className="ba-page-heading">
        <div>
          <h1>Budget Planner</h1>
          <p>Plan, allocate and track your monthly spending</p>
        </div>

        <div className="ba-heading-actions">
          

          <button
            type="button"
            className="ba-primary-button ba-button-inline"
            onClick={() => {
              setError("");
              setCategoryToEdit(null);
              setShowAdd(true);
            }}
            disabled={loading || saving}
          >
            <Plus size={17} /> Add Category
          </button>
        </div>
      </div>

      <section className="ba-budget-hero">
        <div className="ba-hero-content">
          <div className="ba-hero-main">
            <div className="ba-month-label">
              <CalendarDays size={15} /> {monthLabel}
            </div>

            <h2>{money(monthlyBudget)}</h2>
            <p className="ba-hero-caption">Total monthly category limits</p>

            <div className="ba-hero-progress">
              <div className="ba-progress-label">
                <span>Allocated ({allocatedPercent}%)</span>
                <span>
                  {money(totalAllocated)} / {money(monthlyBudget)}
                </span>
              </div>

              <div className="ba-progress-track ba-progress-light">
                <span
                  style={{
                    width: `${allocatedPercent}%`,
                    background: overAllocated ? "#f87171" : "#93c5fd",
                  }}
                />
              </div>

              <div className="ba-progress-label">
                <span>Spent ({spentPercent}%)</span>
                <span>{money(totalSpent)} used</span>
              </div>

              <div className="ba-progress-track ba-progress-light">
                <span
                  style={{
                    width: `${spentPercent}%`,
                    background: spentPercent >= 90 ? "#f87171" : "#4ade80",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="ba-hero-stats">
            {[
              ["Monthly Budget", money(monthlyBudget), "Total category limits"],
              ["Allocated", money(totalAllocated), `${allocatedPercent}% of budget`],
              ["Spent", money(totalSpent), `${spentPercent}% utilized`],
              ["Remaining", money(remaining), "Available to spend"],
            ].map(([label, value, sub]) => (
              <div className="ba-hero-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>
        </div>

        {overAllocated && (
          <div className="ba-hero-alert">
            <AlertTriangle size={15} />
            Category allocations ({money(totalAllocated)}) exceed the monthly
            category total.
          </div>
        )}
      </section>

      <div className="ba-two-column">
        <section className="ba-card">
          <h2 className="ba-card-title">Budget Allocation</h2>

          <div className="ba-donut-layout">
            <div className="ba-donut">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={2}
                  >
                    {allocationData.map((item, index) => (
                      <Cell
                        key={`${item.name}-${index}`}
                        fill={item.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="ba-legend">
              {allocationData.map((item) => (
                <div className="ba-legend-row" key={item.name}>
                  <span className="ba-legend-name">
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <strong>{money(item.value)}</strong>
                </div>
              ))}

              {allocationData.length === 0 && (
                <p className="ba-muted">Add a category to see allocations.</p>
              )}
            </div>
          </div>
        </section>

        <section className="ba-card">
          <h2 className="ba-card-title">Category Utilization</h2>

          <div className="ba-utilization-list">
            {budgets
              .slice()
              .sort(
                (a, b) =>
                  (b.allocated ? b.spent / b.allocated : 0) -
                  (a.allocated ? a.spent / a.allocated : 0)
              )
              .map((item) => {
                const pct =
                  item.allocated > 0
                    ? Math.round((item.spent / item.allocated) * 100)
                    : 0;

                const color =
                  pct >= 100
                    ? "#e53e3e"
                    : pct >= 80
                      ? "#f59e0b"
                      : item.color || COLORS[item.cat];

                return (
                  <div className="ba-utilization-item" key={item.id}>
                    <div className="ba-utilization-label">
                      <span>{item.cat}</span>
                      <span>
                        {money(item.spent)} / {money(item.allocated)}{" "}
                        <b
                          className={
                            pct >= 100
                              ? "ba-pill-red"
                              : pct >= 80
                                ? "ba-pill-amber"
                                : "ba-pill-green"
                          }
                        >
                          {pct}%
                        </b>
                      </span>
                    </div>

                    <div className="ba-progress-track">
                      <span
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

            {!loading && budgets.length === 0 && (
              <p className="ba-muted">No monthly budgets to display yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="ba-category-section">
        <div className="ba-section-heading">
          <h2>Category Budgets</h2>
          <span>{budgets.length} categories</span>
        </div>

        {!loading && budgets.length === 0 ? (
          <div className="ba-card ba-empty-state">
            <p>No budget categories found in your account.</p>
            <button
              type="button"
              className="ba-primary-button ba-button-inline"
              onClick={() => {
                setError("");
                setCategoryToEdit(null);
                setShowAdd(true);
              }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        ) : (
          <div className="ba-category-grid">
            {budgets.map((item) => {
              const pct =
                item.allocated > 0
                  ? Math.round((item.spent / item.allocated) * 100)
                  : 0;

              const over = pct >= 100;
              const near = pct >= 80 && pct < 100;

              const statusColor = over
                ? "#e53e3e"
                : near
                  ? "#f59e0b"
                  : item.color || COLORS[item.cat] || "#2E93C7";

              const Icon = ICONS[item.cat] || MoreHorizontal;
              const left = Math.max(item.allocated - item.spent, 0);

              return (
                <article className="ba-card ba-category-card" key={item.id}>
                  <div className="ba-category-top">
                    <div className="ba-category-identity">
                      <div
                        className="ba-category-icon"
                        style={{
                          color: statusColor,
                          background: `${statusColor}18`,
                        }}
                      >
                        <Icon size={19} />
                      </div>

                      <div>
                        <h3>{item.cat}</h3>
                        <p>{money(item.allocated)} limit</p>
                      </div>
                    </div>

                    <div className="ba-category-actions">
                      <span
                        className={
                          over
                            ? "ba-pill-red"
                            : near
                              ? "ba-pill-amber"
                              : "ba-pill-green"
                        }
                      >
                        {over ? "Over" : near ? "Near" : "OK"}
                      </span>

                      <button
                        type="button"
                        className="ba-icon-button"
                        onClick={() => {
                          setError("");
                          setShowAdd(false);
                          setCategoryToEdit(item);
                        }}
                        aria-label={`Edit ${item.cat}`}
                        disabled={saving}
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        className="ba-icon-button ba-delete-button"
                        onClick={() => deleteCategory(item)}
                        aria-label={`Delete ${item.cat}`}
                        disabled={saving}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="ba-circle-progress"
                    style={{
                      "--progress": `${Math.min(pct, 100)}%`,
                      "--progress-color": statusColor,
                    }}
                  >
                    <div>
                      <strong>{pct}%</strong>
                    </div>
                  </div>

                  <div className="ba-category-metrics">
                    <div>
                      <span>Spent</span>
                      <strong>{money(item.spent)}</strong>
                    </div>

                    <div className="ba-progress-track">
                      <span
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: statusColor,
                        }}
                      />
                    </div>

                    <div>
                      <span>Remaining</span>
                      <strong
                        className={over ? "ba-text-red" : "ba-text-green"}
                      >
                        {money(left)}
                      </strong>
                    </div>
                  </div>

                  {(over || near) && (
                    <div
                      className={
                        over
                          ? "ba-category-alert ba-alert-red"
                          : "ba-category-alert ba-alert-amber"
                      }
                    >
                      <AlertTriangle size={13} />
                      {over
                        ? `Over by ${money(item.spent - item.allocated)}`
                        : `${money(left)} left — spend wisely`}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
