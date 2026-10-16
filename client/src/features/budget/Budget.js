import React, { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Utensils, Plane, ShoppingBag, BookOpen, Gamepad2, MoreHorizontal,
  Wallet, CalendarDays, Plus, Edit2, Trash2, AlertTriangle, X,
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
const CATEGORY_OPTIONS = ["Food & Dining", "Travel", "Shopping", "Education", "Entertainment", "Miscellaneous"];
const ICONS = {
  "Food & Dining": Utensils, Food: Utensils, Travel: Plane, Shopping: ShoppingBag,
  Education: BookOpen, Entertainment: Gamepad2, Miscellaneous: MoreHorizontal,
};
const DEFAULT_BUDGETS = [
  { cat: "Food & Dining", allocated: 4000, spent: 3200, color: "#2E93C7" },
  { cat: "Travel", allocated: 2000, spent: 780, color: "#0D6D91" },
  { cat: "Shopping", allocated: 3000, spent: 2400, color: "#5FA7D2" },
  { cat: "Education", allocated: 2500, spent: 1200, color: "#8DBEE3" },
  { cat: "Entertainment", allocated: 1000, spent: 900, color: "#164A72" },
  { cat: "Miscellaneous", allocated: 1500, spent: 650, color: "#B9D2E7" },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
function saveBudgets(value) {
  try { localStorage.setItem("bb_budgets", JSON.stringify(value)); } catch {}
}
function saveMonthlyBudget(value) {
  try { localStorage.setItem("bb_monthly_budget", JSON.stringify(value)); } catch {}
}

function Modal({ title, onClose, children }) {
  return (
    <div className="ba-modal-backdrop" onMouseDown={onClose}>
      <section className="ba-modal" role="dialog" aria-modal="true" aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}>
        <header className="ba-modal-header">
          <h3>{title}</h3>
          <button className="ba-icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="ba-modal-body">{children}</div>
      </section>
    </div>
  );
}

function BudgetForm({ initial, onSave, onClose }) {
  const [cat, setCat] = useState(initial?.cat || CATEGORY_OPTIONS[0]);
  const [allocated, setAllocated] = useState(String(initial?.allocated ?? ""));
  const [spent, setSpent] = useState(String(initial?.spent ?? "0"));
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!allocated || Number(allocated) <= 0 || Number(spent) < 0) {
      setError("Enter a valid limit and amount spent.");
      return;
    }
    onSave({
      cat,
      allocated: Number(allocated),
      spent: Number(spent || 0),
      color: COLORS[cat] || "#2E93C7",
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit Budget Category" : "Add Budget Category"} onClose={onClose}>
      <form className="ba-form" onSubmit={submit}>
        <label>Category
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Monthly limit (₹)
          <input type="number" min="1" value={allocated} onChange={(e) => setAllocated(e.target.value)} placeholder="e.g. 4000" />
        </label>
        <label>Already spent (₹)
          <input type="number" min="0" value={spent} onChange={(e) => setSpent(e.target.value)} placeholder="0" />
        </label>
        {error && <p className="ba-form-error">{error}</p>}
        <button className="ba-primary-button" type="submit">{initial ? "Save Changes" : "Add Category"}</button>
      </form>
    </Modal>
  );
}

export default function Budget() {
  const [budgets, setBudgets] = useState(() => {
    const stored = readStorage("bb_budgets", null);
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_BUDGETS;
  });
  const [monthlyBudget, setMonthlyBudget] = useState(() => Number(readStorage("bb_monthly_budget", 25000)) || 25000);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState(String(monthlyBudget));
  const [notice, setNotice] = useState("");

  const totalAllocated = budgets.reduce((sum, item) => sum + Number(item.allocated || 0), 0);
  const totalSpent = budgets.reduce((sum, item) => sum + Number(item.spent || 0), 0);
  const remaining = Math.max(monthlyBudget - totalSpent, 0);
  const unallocated = Math.max(monthlyBudget - totalAllocated, 0);
  const allocatedPercent = monthlyBudget ? Math.min(Math.round(totalAllocated / monthlyBudget * 100), 100) : 0;
  const spentPercent = monthlyBudget ? Math.min(Math.round(totalSpent / monthlyBudget * 100), 100) : 0;
  const overAllocated = totalAllocated > monthlyBudget;
  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  function updateBudgets(next) {
    setBudgets(next);
    saveBudgets(next);
  }
  function saveCategory(item) {
    const next = budgets.some((budget) => budget.cat === (categoryToEdit?.cat || item.cat))
      ? budgets.map((budget) => budget.cat === (categoryToEdit?.cat || item.cat) ? item : budget)
      : [...budgets, item];
    updateBudgets(next);
    setCategoryToEdit(null);
    setShowAdd(false);
  }
  function deleteCategory(cat) {
    const next = budgets.filter((item) => item.cat !== cat);
    updateBudgets(next);
  }
  const allocationData = useMemo(() => [
    ...budgets.map((item) => ({ name: item.cat, value: Number(item.allocated || 0), color: item.color || COLORS[item.cat] || "#2E93C7" })),
    ...(unallocated > 0 ? [{ name: "Unallocated", value: unallocated, color: "#E4EFF7" }] : []),
  ], [budgets, unallocated]);

  return (
    <div className="ba-page">
      {(showAdd || categoryToEdit) && (
        <BudgetForm
          key={categoryToEdit?.cat || "new"}
          initial={categoryToEdit}
          onSave={saveCategory}
          onClose={() => { setShowAdd(false); setCategoryToEdit(null); }}
        />
      )}
      {showMonthly && (
        <Modal title="Set Monthly Budget" onClose={() => setShowMonthly(false)}>
          <form className="ba-form" onSubmit={(event) => {
            event.preventDefault();
            const value = Number(monthlyInput);
            if (value > 0) {
              setMonthlyBudget(value);
              saveMonthlyBudget(value);
              setShowMonthly(false);
            }
          }}>
            <p className="ba-muted">Set your total spending limit for <strong>{monthLabel}</strong>.</p>
            <label>Monthly budget (₹)
              <input type="number" min="1" value={monthlyInput} onChange={(e) => setMonthlyInput(e.target.value)} />
            </label>
            {Number(monthlyInput) < totalAllocated && (
              <p className="ba-warning-text"><AlertTriangle size={15} /> Category allocations currently total {money(totalAllocated)}.</p>
            )}
            <button className="ba-primary-button" type="submit">Save Budget</button>
          </form>
        </Modal>
      )}
      {notice && <div className="ba-toast" role="status">{notice}</div>}

      <div className="ba-page-heading">
        <div>
          <h1>Budget Planner</h1>
          <p>Plan, allocate and track your monthly spending</p>
        </div>
        <div className="ba-heading-actions">
          <button className="ba-secondary-button" onClick={() => { setMonthlyInput(String(monthlyBudget)); setShowMonthly(true); }}>
            <Wallet size={16} /> Set Budget
          </button>
          <button className="ba-primary-button ba-button-inline" onClick={() => setShowAdd(true)}>
            <Plus size={17} /> Add Category
          </button>
        </div>
      </div>

      <section className="ba-budget-hero">
        <div className="ba-hero-content">
          <div className="ba-hero-main">
            <div className="ba-month-label"><CalendarDays size={15} /> {monthLabel}</div>
            <h2>{money(monthlyBudget)}</h2>
            <p className="ba-hero-caption">Monthly budget</p>
            <div className="ba-hero-progress">
              <div className="ba-progress-label"><span>Allocated ({allocatedPercent}%)</span><span>{money(totalAllocated)} / {money(monthlyBudget)}</span></div>
              <div className="ba-progress-track ba-progress-light"><span style={{ width: `${allocatedPercent}%`, background: overAllocated ? "#f87171" : "#93c5fd" }} /></div>
              <div className="ba-progress-label"><span>Spent ({spentPercent}%)</span><span>{money(totalSpent)} used</span></div>
              <div className="ba-progress-track ba-progress-light"><span style={{ width: `${spentPercent}%`, background: spentPercent >= 90 ? "#f87171" : "#4ade80" }} /></div>
            </div>
          </div>
          <div className="ba-hero-stats">
            {[
              ["Monthly Budget", money(monthlyBudget), "Total limit"],
              ["Allocated", money(totalAllocated), `${allocatedPercent}% of budget`],
              ["Spent", money(totalSpent), `${spentPercent}% utilized`],
              ["Remaining", money(remaining), "Available to spend"],
            ].map(([label, value, sub]) => (
              <div className="ba-hero-stat" key={label}>
                <span>{label}</span><strong>{value}</strong><small>{sub}</small>
              </div>
            ))}
          </div>
        </div>
        {overAllocated && <div className="ba-hero-alert"><AlertTriangle size={15} /> Category allocations ({money(totalAllocated)}) exceed your monthly budget. Consider reducing limits or increasing budget.</div>}
      </section>

      <div className="ba-two-column">
        <section className="ba-card">
          <h2 className="ba-card-title">Budget Allocation</h2>
          <div className="ba-donut-layout">
            <div className="ba-donut">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={2}>
                    {allocationData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ba-legend">
              {allocationData.map((item) => (
                <div className="ba-legend-row" key={item.name}>
                  <span className="ba-legend-name"><i style={{ background: item.color }} />{item.name}</span>
                  <strong>{money(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ba-card">
          <h2 className="ba-card-title">Category Utilization</h2>
          <div className="ba-utilization-list">
            {[...budgets].sort((a, b) => (b.allocated ? b.spent / b.allocated : 0) - (a.allocated ? a.spent / a.allocated : 0)).map((item) => {
              const pct = item.allocated > 0 ? Math.round(item.spent / item.allocated * 100) : 0;
              const color = pct >= 100 ? "#e53e3e" : pct >= 80 ? "#f59e0b" : (item.color || COLORS[item.cat]);
              return (
                <div className="ba-utilization-item" key={item.cat}>
                  <div className="ba-utilization-label"><span>{item.cat}</span><span>{money(item.spent)} / {money(item.allocated)} <b className={pct >= 100 ? "ba-pill-red" : pct >= 80 ? "ba-pill-amber" : "ba-pill-green"}>{pct}%</b></span></div>
                  <div className="ba-progress-track"><span style={{ width: `${Math.min(pct, 100)}%`, background: color }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="ba-category-section">
        <div className="ba-section-heading"><h2>Category Budgets</h2><span>{budgets.length} categories</span></div>
        {budgets.length === 0 ? (
          <div className="ba-card ba-empty-state"><p>No budget categories yet.</p><button className="ba-primary-button ba-button-inline" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Category</button></div>
        ) : (
          <div className="ba-category-grid">
            {budgets.map((item) => {
              const pct = item.allocated > 0 ? Math.round(item.spent / item.allocated * 100) : 0;
              const over = pct >= 100;
              const near = pct >= 80 && pct < 100;
              const statusColor = over ? "#e53e3e" : near ? "#f59e0b" : (item.color || COLORS[item.cat] || "#2E93C7");
              const Icon = ICONS[item.cat] || MoreHorizontal;
              const left = Math.max(item.allocated - item.spent, 0);
              return (
                <article className="ba-card ba-category-card" key={item.cat}>
                  <div className="ba-category-top">
                    <div className="ba-category-identity">
                      <div className="ba-category-icon" style={{ color: statusColor, background: `${statusColor}18` }}><Icon size={19} /></div>
                      <div><h3>{item.cat}</h3><p>{money(item.allocated)} limit</p></div>
                    </div>
                    <div className="ba-category-actions">
                      <span className={over ? "ba-pill-red" : near ? "ba-pill-amber" : "ba-pill-green"}>{over ? "Over" : near ? "Near" : "OK"}</span>
                      <button className="ba-icon-button" onClick={() => setCategoryToEdit(item)} aria-label={`Edit ${item.cat}`}><Edit2 size={14} /></button>
                      <button className="ba-icon-button ba-delete-button" onClick={() => deleteCategory(item.cat)} aria-label={`Delete ${item.cat}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="ba-circle-progress" style={{ "--progress": `${Math.min(pct, 100)}%`, "--progress-color": statusColor }}>
                    <div><strong>{pct}%</strong></div>
                  </div>
                  <div className="ba-category-metrics">
                    <div><span>Spent</span><strong>{money(item.spent)}</strong></div>
                    <div className="ba-progress-track"><span style={{ width: `${Math.min(pct, 100)}%`, background: statusColor }} /></div>
                    <div><span>Remaining</span><strong className={over ? "ba-text-red" : "ba-text-green"}>{money(left)}</strong></div>
                  </div>
                  {(over || near) && <div className={over ? "ba-category-alert ba-alert-red" : "ba-category-alert ba-alert-amber"}><AlertTriangle size={13} />{over ? `Over by ${money(item.spent - item.allocated)}` : `${money(left)} left — spend wisely`}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
