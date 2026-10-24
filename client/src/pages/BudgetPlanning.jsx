import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import Icon from "../components/Icon";
import {
  createBudget,
  deleteBudget,
  getBudgetAlerts,
  getBudgets,
  updateBudget,
} from "./budgetService";
import "./BudgetPlanning.css";

const PRESET_CATEGORIES = [
  { name: "Food & Dining", icon: "🍽️", color: "#4F93A0" },
  { name: "Transportation", icon: "🚗", color: "#166879" },
  { name: "Education", icon: "📚", color: "#22C55E" },
  { name: "Groceries", icon: "🛒", color: "#86B4C1" },
  { name: "Entertainment", icon: "🎬", color: "#F4B400" },
  { name: "Shopping", icon: "🛍️", color: "#EF4444" },
  { name: "Health", icon: "💊", color: "#8B5CF6" },
  { name: "Utilities", icon: "💡", color: "#EC4899" },
  { name: "Rent", icon: "🏠", color: "#6B7280" },
];

const INITIAL_FORM = {
  name: "",
  budget: "",
  icon: "📦",
  color: "#4F93A0",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function hexWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `rgba(79, 147, 160, ${alpha})`;
  }
  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

async function requestBudgetData(token) {
  const [budgetData, alertData] = await Promise.all([
    getBudgets(token),
    getBudgetAlerts(token),
  ]);
  if (!Array.isArray(budgetData) || !Array.isArray(alertData)) {
    throw new Error("The budget service returned an invalid response.");
  }
  return { budgetData, alertData };
}

function BudgetPlanning() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedPreset, setSelectedPreset] = useState("");

  const loadBudgets = useCallback(async () => {
    try {
      const { budgetData, alertData } = await requestBudgetData(token);
      setCategories(budgetData);
      setAlerts(alertData);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load budgets.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    requestBudgetData(token)
      .then(({ budgetData, alertData }) => {
        if (active) {
          setCategories(budgetData);
          setAlerts(alertData);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load budgets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const totals = useMemo(() => {
    const budget = categories.reduce((sum, category) => sum + Number(category.budget), 0);
    const spent = categories.reduce((sum, category) => sum + Number(category.spent), 0);
    return { budget, spent, remaining: budget - spent };
  }, [categories]);

  const remainingPercent = totals.budget > 0
    ? Math.round((totals.remaining / totals.budget) * 100)
    : 0;

  function openCreateModal() {
    setEditingBudget(null);
    setForm(INITIAL_FORM);
    setSelectedPreset("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(category) {
    setEditingBudget(category);
    setForm({
      name: category.name,
      budget: String(category.budget),
      icon: category.icon,
      color: category.color,
    });
    setSelectedPreset("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingBudget(null);
    setForm(INITIAL_FORM);
    setSelectedPreset("");
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectPreset(preset) {
    setSelectedPreset(preset.name);
    setForm((current) => ({
      ...current,
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const numericBudget = Number(form.budget);
    if (!form.name.trim() || !Number.isFinite(numericBudget) || numericBudget <= 0) {
      setError("Enter a category name and a monthly budget greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        budget: numericBudget,
        icon: form.icon.trim() || "📦",
        color: form.color,
      };
      if (editingBudget) {
        await updateBudget(token, editingBudget.id, payload);
      } else {
        await createBudget(token, payload);
      }
      setShowModal(false);
      setEditingBudget(null);
      setForm(INITIAL_FORM);
      setSelectedPreset("");
      await loadBudgets();
    } catch (requestError) {
      setError(requestError.message || "Unable to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete the ${category.name} budget?`)) return;
    setError("");
    try {
      await deleteBudget(token, category.id);
      await loadBudgets();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete budget.");
    }
  }

  return (
    <main className="budget-page">
      <div className="budget-content">
        {error && (
          <div className="budget-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadBudgets();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {alerts.length > 0 && !loading && (
          <div className="budget-alerts" role="status">
            <Icon name="bell" size={17} />
            <div>
              {alerts.map((alert) => (
                <div key={alert.id}>
                  <strong>{alert.name}</strong>: {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="budget-summary-grid" aria-label="Budget summary">
          <article className="solid-card summary-card">
            <div className="summary-label">Total Monthly Budget</div>
            <div className="summary-value teal">{formatMoney(totals.budget)}</div>
            <div className="summary-sub">{categories.length} categories</div>
          </article>
          <article className="solid-card summary-card">
            <div className="summary-label">Spent This Month</div>
            <div className="summary-value red">{formatMoney(totals.spent)}</div>
            <div className="summary-sub">Across budgeted categories</div>
          </article>
          <article className="solid-card summary-card">
            <div className="summary-label">Remaining</div>
            <div className={`summary-value ${totals.remaining < 0 ? "red" : "green"}`}>
              {formatMoney(totals.remaining)}
            </div>
            <div className="summary-sub">{remainingPercent}% of budget remaining</div>
          </article>
        </section>

        <section className="solid-card budget-categories-card">
          <div className="budget-categories-heading">
            <div>
              <h2 className="budget-section-title">Monthly Budget Categories</h2>
              <p>Category limits compared with this month’s recorded expenses.</p>
            </div>
            <button className="add-budget-button" type="button" onClick={openCreateModal}>
              <Icon name="plus" size={15} />
              Add Budget
            </button>
          </div>

          {loading ? (
            <div className="budget-state" role="status">Loading budgets…</div>
          ) : categories.length === 0 ? (
            <div className="budget-state">
              <div className="empty-icon" aria-hidden="true">📊</div>
              <h3>No budgets created</h3>
              <p>Add a category budget to compare your monthly expenses with a limit.</p>
              <button className="add-budget-button" type="button" onClick={openCreateModal}>
                <Icon name="plus" size={15} />
                Create a Budget
              </button>
            </div>
          ) : (
            <div className="budget-category-list">
              {categories.map((category) => {
                const budget = Number(category.budget);
                const spent = Number(category.spent);
                const rawPercent = budget > 0 ? (spent / budget) * 100 : 0;
                const percent = Math.min(100, Math.max(0, rawPercent));
                const barColor = rawPercent >= 90
                  ? "#EF4444"
                  : rawPercent >= 70
                    ? "#F4B400"
                    : "#22C55E";
                return (
                  <article
                    className="budget-category"
                    key={category.id}
                    style={{ borderColor: hexWithAlpha(category.color, 0.25) }}
                  >
                    <div className="category-topline">
                      <div className="category-identity">
                        <div
                          className="category-icon"
                          style={{ background: hexWithAlpha(category.color, 0.12) }}
                          aria-hidden="true"
                        >
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="category-name">{category.name}</h3>
                          <p className="category-budget">Budget: {formatMoney(budget)}</p>
                        </div>
                      </div>
                      <div className="category-controls">
                        <div className="category-spent">
                          <strong style={{ color: barColor }}>{formatMoney(spent)}</strong>
                          <span>{rawPercent.toFixed(0)}% used</span>
                        </div>
                        <button
                          className="category-action"
                          type="button"
                          aria-label={`Edit ${category.name} budget`}
                          onClick={() => openEditModal(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-budget-button"
                          type="button"
                          aria-label={`Delete ${category.name} budget`}
                          onClick={() => handleDelete(category)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={`${category.name} budget usage`}
                      aria-valuenow={Math.min(100, Math.max(0, Math.round(rawPercent)))}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${percent}%`, background: barColor }}
                      />
                    </div>
                    <div className="category-footer">
                      <span>Spent {formatMoney(spent)}</span>
                      <span>Remaining {formatMoney(budget - spent)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
          >
            <div className="modal-heading">
              <h2 id="budget-modal-title">
                {editingBudget ? "Edit Budget Category" : "Add Budget Category"}
              </h2>
              <button
                type="button"
                className="close-modal"
                aria-label="Close dialog"
                onClick={closeModal}
                disabled={saving}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingBudget && (
                <>
                  <div className="quick-select-label">Quick Select</div>
                  <div className="preset-list">
                    {PRESET_CATEGORIES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`preset-button${selectedPreset === preset.name ? " selected" : ""}`}
                        style={selectedPreset === preset.name
                          ? {
                              color: preset.color,
                              borderColor: preset.color,
                              background: hexWithAlpha(preset.color, 0.1),
                            }
                          : undefined}
                        onClick={() => selectPreset(preset)}
                      >
                        {preset.icon} {preset.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="budget-form-fields">
                <label>
                  <span>Category name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="e.g. Food & Dining"
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  <span>Monthly budget (INR)</span>
                  <input
                    name="budget"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.budget}
                    onChange={handleFieldChange}
                    placeholder="0.00"
                    required
                  />
                </label>
                <div className="form-two-columns">
                  <label>
                    <span>Icon (emoji)</span>
                    <input
                      name="icon"
                      value={form.icon}
                      onChange={handleFieldChange}
                      maxLength={8}
                    />
                  </label>
                  <label>
                    <span>Color</span>
                    <input
                      className="color-input"
                      name="color"
                      type="color"
                      value={form.color}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-button"
                  disabled={saving || !form.name.trim() || !form.budget || Number(form.budget) <= 0}
                >
                  {saving ? "Saving…" : editingBudget ? "Save Changes" : "Add Budget"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default BudgetPlanning;
