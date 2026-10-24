import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Target, PiggyBank, BarChart2, Edit2, Trash2, CalendarDays,
  TrendingUp, ChevronRight, X, AlertTriangle, CheckCircle2, ArrowUpRight,
  LockKeyhole, Trophy, Wallet
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { api } from "../services/api";
import "./Savings.css";

const BLUE = "#2E93C7";
const DEEP_BLUE = "#0D6D91";
const COLORS = ["#2E93C7", "#0D6D91", "#5FA7D2", "#22c55e", "#f59e0b", "#8b5cf6", "#e53e3e", "#ec4899"];
const EMOJIS = ["🎯", "💻", "✈️", "🛡️", "🏖️", "🎓", "🚗", "🏠", "📱", "💰"];

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

const clamp = (n, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));

const asNumber = (v) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

function normalizeGoal(item) {
  return {
    ...item,
    id: item.id ?? item.goal_id,
    title: item.title ?? item.name ?? item.goal_name ?? "Savings goal",
    emoji: item.emoji ?? "🎯",
    target: asNumber(
      item.target ?? item.target_amount ?? item.goal_amount
    ),
    saved: asNumber(
      item.saved ??
      item.saved_amount ??
      item.current_amount ??
      item.current_saved
    ),
    deadline:
      item.deadline ?? item.target_date ?? item.due_date ?? "",
    quote:
      item.quote ??
      item.note ??
      "Every small step brings you closer.",
    color: item.color ?? BLUE
  };
}

function normalizeContribution(item, goal) {
  return {
    ...item,
    id:
      item.id ??
      item.contribution_id ??
      `${item.goal_id}-${item.created_at}-${item.amount}`,
    goalId: item.goal_id ?? item.goalId ?? goal?.id,
    goalTitle:
      item.goal_title ??
      item.goalTitle ??
      goal?.title ??
      "Savings goal",
    goalEmoji:
      item.goal_emoji ??
      item.goalEmoji ??
      goal?.emoji ??
      "🎯",
    amount: asNumber(
      item.amount ?? item.contribution_amount
    ),
    dateIso:
      item.date ??
      item.created_at ??
      item.contributed_at ??
      ""
  };
}

function formatContributionDate(value) {
  if (!value) return "Recently";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });

  if (sameDay) return `Today • ${time}`;

  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday • ${time}`;
  }

  return `${d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  })} • ${time}`;
}

function isOverdue(deadline) {
  if (!deadline) return false;

  const parsed = new Date(deadline);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getTime() < Date.now();
  }

  const m = String(deadline).match(/^([A-Za-z]{3})\s+(\d{4})$/);

  if (!m) return false;

  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  if (months[m[1]] === undefined) return false;

  return new Date(
    Number(m[2]),
    months[m[1]] + 1,
    0,
    23,
    59,
    59
  ) < new Date();
}

function daysLeft(deadline) {
  if (!deadline) return null;

  const m = String(deadline).match(/^([A-Za-z]{3})\s+(\d{4})$/);

  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  let due;

  if (m && months[m[1]] !== undefined) {
    due = new Date(
      Number(m[2]),
      months[m[1]] + 1,
      0,
      23,
      59,
      59
    );
  } else {
    due = new Date(deadline);
  }

  if (Number.isNaN(due.getTime())) return null;

  return Math.ceil(
    (due.getTime() - Date.now()) / 86400000
  );
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="sav-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`sav-modal${wide ? " sav-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="sav-modal-header">
          <div>
            <h2>{title}</h2>
            <p>Make your next money milestone happen.</p>
          </div>

          <button
            type="button"
            className="sav-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

function GoalModal({ initial, onClose, onSave, saving }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "🎯");
  const [target, setTarget] = useState(
    initial ? String(initial.target) : ""
  );
  const [saved, setSaved] = useState(
    initial ? String(initial.saved) : "0"
  );
  const [deadline, setDeadline] = useState(
    initial?.deadline || ""
  );
  const [quote, setQuote] = useState(
    initial?.quote || ""
  );
  const [color, setColor] = useState(
    initial?.color || BLUE
  );
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    if (!title.trim()) {
      return setError("Please enter a goal name.");
    }

    if (asNumber(target) <= 0) {
      return setError(
        "Target amount must be greater than zero."
      );
    }

    if (
      asNumber(saved) < 0 ||
      asNumber(saved) > asNumber(target)
    ) {
      return setError(
        "Saved amount must be between zero and the target."
      );
    }

    setError("");

    await onSave({
      ...initial,
      title: title.trim(),
      name: title.trim(),
      emoji,
      target: asNumber(target),
      saved: asNumber(saved),
      deadline,
      quote: quote.trim() ||
        "Every small step brings you closer.",
      color
    });
  }

  return (
    <Modal
      title={
        initial
          ? "Edit savings goal"
          : "Create a savings goal"
      }
      onClose={onClose}
    >
      <form className="sav-form" onSubmit={submit}>
        {error && (
          <div className="sav-inline-error">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        <div className="sav-form-row">
          <label className="sav-field sav-emoji-field">
            <span>Icon</span>
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            >
              {EMOJIS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label className="sav-field sav-grow">
            <span>Goal name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laptop Fund"
              maxLength={80}
            />
          </label>
        </div>

        <label className="sav-field">
          <span>Target amount (₹)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="80000"
            required
          />
        </label>

        <label className="sav-field">
          <span>Already saved (₹)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
            placeholder="0"
          />
        </label>

        {asNumber(target) > 0 && (
          <div className="sav-preview">
            <div>
              <span>Progress preview</span>
              <strong>
                {Math.round(
                  clamp(
                    asNumber(saved) /
                    asNumber(target) * 100
                  )
                )}%
              </strong>
            </div>

            <div className="sav-progress">
              <span
                style={{
                  width: `${
                    clamp(
                      asNumber(saved) /
                      asNumber(target) * 100
                    )
                  }%`,
                  background: color
                }}
              />
            </div>
          </div>
        )}

        <label className="sav-field">
          <span>Target date</span>
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="e.g. Dec 2026"
          />
        </label>

        <label className="sav-field">
          <span>Motivational note</span>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="A little reminder to keep going"
            maxLength={140}
          />
        </label>

        <div className="sav-field">
          <span>Goal colour</span>

          <div className="sav-color-options">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select ${c}`}
                className={color === c ? "selected" : ""}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <footer className="sav-modal-actions">
          <button
            type="button"
            className="sav-button sav-button-light"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="sav-button sav-button-primary"
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : initial
                ? "Save changes"
                : <><Plus size={16} /> Create goal</>
            }
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function ContributionModal({
  goal,
  onClose,
  onSave,
  saving
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    const value = asNumber(amount);

    if (value <= 0) {
      return setError(
        "Enter an amount greater than zero."
      );
    }

    setError("");
    await onSave(value);
  }

  return (
    <Modal
      title={`Add to ${goal.title}`}
      onClose={onClose}
    >
      <form className="sav-form" onSubmit={submit}>
        <div className="sav-contribute-summary">
          <span className="sav-goal-emoji">
            {goal.emoji}
          </span>

          <div>
            <strong>{money(goal.saved)} saved</strong>
            <span>of {money(goal.target)} target</span>
          </div>
        </div>

        {error && (
          <div className="sav-inline-error">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        <label className="sav-field">
          <span>Contribution amount (₹)</span>
          <input
            autoFocus
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            required
          />
        </label>

        <div className="sav-quick-amounts">
          {[100, 250, 500, 1000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
            >
              {money(n)}
            </button>
          ))}
        </div>

        <footer className="sav-modal-actions">
          <button
            type="button"
            className="sav-button sav-button-light"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="sav-button sav-button-primary"
            disabled={saving}
          >
            {saving
              ? "Adding…"
              : <><Plus size={16} /> Add savings</>
            }
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function ConfirmDelete({
  goal,
  onClose,
  onConfirm,
  saving
}) {
  return (
    <Modal
      title="Delete this goal?"
      onClose={onClose}
    >
      <div className="sav-delete-body">
        <div className="sav-delete-icon">
          <Trash2 size={22} />
        </div>

        <p>
          Are you sure you want to delete{" "}
          <strong>{goal.title}</strong>? This action cannot
          be undone.
        </p>

        <div className="sav-modal-actions">
          <button
            className="sav-button sav-button-light"
            onClick={onClose}
          >
            Keep goal
          </button>

          <button
            className="sav-button sav-button-danger"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? "Deleting…" : "Delete goal"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Savings() {
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [deleteGoal, setDeleteGoal] = useState(null);
  const [sortKey, setSortKey] = useState("deadline");
  const [sortDir, setSortDir] = useState("asc");
  const [showAll, setShowAll] = useState(false);

  const loadData = useCallback(async () => {
    setError("");

    try {
      const result = await api.getSavingsGoals();

      const rawGoals = Array.isArray(result)
        ? result
        : (
            result?.goals ||
            result?.items ||
            result?.data ||
            []
          );

      const normalized = rawGoals.map(normalizeGoal);

      setGoals(normalized);

      const all = await Promise.all(
        normalized.map(async (g) => {
          try {
            const r =
              await api.getSavingsContributions(g.id);

            const list = Array.isArray(r)
              ? r
              : (
                  r?.contributions ||
                  r?.items ||
                  r?.data ||
                  []
                );

            return list.map((c) =>
              normalizeContribution(c, g)
            );
          } catch (_) {
            return [];
          }
        })
      );

      setContributions(
        all.flat().sort(
          (a, b) =>
            new Date(b.dateIso || 0) -
            new Date(a.dateIso || 0)
        )
      );
    } catch (e) {
      setError(
        e?.message ||
        "Could not load savings from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGoals = useMemo(() => {
    const active = goals.filter(
      (g) => g.saved < g.target
    );

    const val = (g) => {
      if (sortKey === "target") return g.target;
      if (sortKey === "saved") return g.saved;

      if (sortKey === "remaining") {
        return Math.max(0, g.target - g.saved);
      }

      if (sortKey === "progress") {
        return g.target > 0
          ? g.saved / g.target
          : 0;
      }

      const d = daysLeft(g.deadline);

      return d === null
        ? Number.MAX_SAFE_INTEGER
        : d;
    };

    return [...active].sort(
      (a, b) =>
        (val(a) - val(b)) *
        (sortDir === "asc" ? 1 : -1)
    );
  }, [goals, sortKey, sortDir]);

  const completedGoals = useMemo(
    () => goals.filter(
      (g) => g.saved >= g.target && g.target > 0
    ),
    [goals]
  );

  const totalSaved = goals.reduce(
    (sum, g) => sum + g.saved,
    0
  );

  const totalTarget = goals.reduce(
    (sum, g) => sum + g.target,
    0
  );

  const overall = totalTarget
    ? Math.round(totalSaved / totalTarget * 100)
    : 0;

  const chartData = useMemo(() => {
    const map = new Map();

    contributions.forEach((c) => {
      const d = new Date(c.dateIso);

      if (Number.isNaN(d.getTime())) return;

      const key =
        `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;

      map.set(
        key,
        (map.get(key) || 0) + c.amount
      );
    });

    let running = 0;

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => {
        running += amount;

        const [year, month] = key.split("-");

        return {
          month: new Date(
            Number(year),
            Number(month) - 1,
            1
          ).toLocaleDateString("en-IN", {
            month: "short"
          }),
          amount: running
        };
      });
  }, [contributions]);

  const recent = useMemo(
    () => [...contributions].sort(
      (a, b) =>
        new Date(b.dateIso || 0) -
        new Date(a.dateIso || 0)
    ),
    [contributions]
  );

  async function saveGoal(payload) {
    setSaving(true);
    setError("");

    try {
      const body = {
        name: payload.title,
        title: payload.title,
        target_amount: payload.target,
        target: payload.target,
        saved_amount: payload.saved,
        saved: payload.saved,
        deadline: payload.deadline || null,
        note: payload.quote,
        color: payload.color,
        emoji: payload.emoji
      };

      if (payload.id != null) {
        await api.updateSavingsGoal(
          payload.id,
          body
        );
      } else {
        await api.createSavingsGoal(body);
      }

      setModal(null);

      setNotice(
        payload.id != null
          ? "Savings goal updated."
          : "Savings goal created."
      );

      await loadData();
    } catch (e) {
      setError(
        e?.message || "Could not save the goal."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addContribution(amount) {
    setSaving(true);
    setError("");

    try {
      await api.addSavingsContribution(
        contributeGoal.id,
        { amount }
      );

      setContributeGoal(null);

      setNotice(
        `Added ${money(amount)} to ${contributeGoal.title}.`
      );

      await loadData();
    } catch (e) {
      setError(
        e?.message ||
        "Could not add savings. Check the backend contribution endpoint."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal() {
    setSaving(true);
    setError("");

    try {
      await api.deleteSavingsGoal(deleteGoal.id);

      setDeleteGoal(null);
      setNotice("Savings goal deleted.");

      await loadData();
    } catch (e) {
      setError(
        e?.message || "Could not delete the goal."
      );
    } finally {
      setSaving(false);
    }
  }

  const SORTS = [
    { key: "deadline", label: "Target date" },
    { key: "target", label: "Total amount" },
    { key: "saved", label: "Amount saved" },
    { key: "remaining", label: "Remaining" },
    { key: "progress", label: "% progress" }
  ];

  return (
    <main className="sav-page">
      <div className="sav-heading">
        <div>
          <div className="sav-eyebrow">
            <span />
            YOUR FINANCIAL FUTURE
          </div>

          <h1>Savings Goals</h1>

          <p>
            Work towards your financial dreams, one step
            at a time.
          </p>
        </div>

        <button
          className="sav-button sav-button-primary sav-new-goal"
          onClick={() => setModal({ mode: "add" })}
        >
          <Plus size={17} />
          New Goal
        </button>
      </div>

      {error && (
        <div className="sav-alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="sav-success-alert">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="sav-stats-grid">
        <article className="sav-stat-card">
          <div className="sav-stat-icon sav-stat-blue">
            <PiggyBank size={22} />
          </div>

          <div className="sav-stat-copy">
            <span>Total Saved</span>
            <strong>{money(totalSaved)}</strong>
            <small>Across all your goals</small>
          </div>

          <span className="sav-stat-watermark">₹</span>
        </article>

        <article className="sav-stat-card">
          <div className="sav-stat-icon sav-stat-deep">
            <Target size={22} />
          </div>

          <div className="sav-stat-copy">
            <span>Target Amount</span>
            <strong>{money(totalTarget)}</strong>
            <small>
              {goals.length}{" "}
              {goals.length === 1 ? "goal" : "goals"} in
              your plan
            </small>
          </div>

          <span className="sav-stat-watermark">
            <Target size={42} />
          </span>
        </article>

        <article className="sav-stat-card">
          <div className="sav-stat-icon sav-stat-light">
            <BarChart2 size={22} />
          </div>

          <div className="sav-stat-copy">
            <span>Overall Progress</span>
            <strong>{overall}%</strong>

            <div className="sav-mini-progress">
              <span
                style={{
                  width: `${clamp(overall)}%`
                }}
              />
            </div>
          </div>

          <span className="sav-stat-watermark">
            <TrendingUp size={42} />
          </span>
        </article>
      </section>

      <section className="sav-section">
        <div className="sav-section-heading">
          <div>
            <h2>Your goals</h2>
            <p>
              Keep your priorities in sight and your
              progress moving.
            </p>
          </div>

          <span className="sav-count">
            {activeGoals.length} active
          </span>
        </div>

        {activeGoals.length > 1 && (
          <div className="sav-sort-row">
            <span>Sort by</span>

            {SORTS.map((s) => (
              <button
                key={s.key}
                className={
                  sortKey === s.key ? "active" : ""
                }
                onClick={() => {
                  if (sortKey === s.key) {
                    setSortDir(
                      sortDir === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setSortKey(s.key);
                    setSortDir("asc");
                  }
                }}
              >
                {s.label}

                {sortKey === s.key ? (
                  <span>
                    {sortDir === "asc" ? " ↑" : " ↓"}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="sav-loading">
            <span className="sav-spinner" />
            Loading your savings goals…
          </div>
        ) : activeGoals.length ? (
          <div className="sav-goal-grid">
            {activeGoals.map((g) => {
              const pct = g.target > 0
                ? clamp(
                    Math.round(
                      g.saved / g.target * 100
                    )
                  )
                : 0;

              const left = daysLeft(g.deadline);
              const overdue = isOverdue(g.deadline);

              return (
                <article
                  className="sav-goal-card"
                  key={g.id}
                >
                  <div
                    className="sav-goal-card-glow"
                    style={{ background: g.color }}
                  />

                  <div className="sav-goal-top">
                    <div className="sav-goal-identity">
                      <span
                        className="sav-goal-emoji"
                        style={{
                          background: `${g.color}18`,
                          borderColor: `${g.color}40`
                        }}
                      >
                        {g.emoji}
                      </span>

                      <div>
                        <h3>{g.title}</h3>
                        <p>
                          Target date: {g.deadline || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="sav-goal-actions">
                      <button
                        className="sav-icon-button"
                        title="Edit goal"
                        onClick={() => setModal(g)}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        className="sav-icon-button sav-delete-icon"
                        title="Delete goal"
                        onClick={() => setDeleteGoal(g)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="sav-circle-wrap">
                    <svg
                      viewBox="0 0 100 100"
                      className="sav-circle"
                    >
                      <circle
                        className="sav-circle-track"
                        cx="50"
                        cy="50"
                        r="41"
                      />

                      <circle
                        className="sav-circle-value"
                        cx="50"
                        cy="50"
                        r="41"
                        style={{
                          stroke: g.color,
                          strokeDasharray:
                            `${pct * 2.576} 257.6`
                        }}
                      />
                    </svg>

                    <div className="sav-circle-label">
                      <strong>{pct}%</strong>
                      <span>completed</span>
                    </div>
                  </div>

                  <div className="sav-goal-amounts">
                    <div>
                      <span>Saved so far</span>
                      <strong>{money(g.saved)}</strong>
                    </div>

                    <div className="sav-amount-target">
                      <span>Goal target</span>
                      <strong>{money(g.target)}</strong>
                    </div>
                  </div>

                  <div className="sav-progress">
                    <span
                      style={{
                        width: `${pct}%`,
                        background:
                          `linear-gradient(90deg, ${g.color}, ${DEEP_BLUE})`
                      }}
                    />
                  </div>

                  <div className="sav-goal-remaining">
                    <span>
                      {money(
                        Math.max(0, g.target - g.saved)
                      )} left to go
                    </span>
                    <strong>{pct}%</strong>
                  </div>

                  {g.deadline && (
                    <div
                      className={`sav-deadline ${
                        overdue
                          ? "overdue"
                          : left !== null && left <= 30
                            ? "soon"
                            : ""
                      }`}
                    >
                      <CalendarDays size={14} />

                      {overdue
                        ? "Deadline passed"
                        : left === null
                          ? `Due ${g.deadline}`
                          : `${left} days remaining`}
                    </div>
                  )}

                  <p className="sav-goal-quote">
                    “{g.quote}”
                  </p>

                  <button
                    className="sav-button sav-button-primary sav-add-savings"
                    onClick={() => setContributeGoal(g)}
                  >
                    <Plus size={16} />
                    Add Savings
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="sav-empty">
            <div className="sav-empty-icon">
              <Target size={26} />
            </div>

            <h3>No active savings goals yet</h3>

            <p>
              Create your first goal and start building
              towards something meaningful.
            </p>

            <button
              className="sav-button sav-button-primary"
              onClick={() => setModal({ mode: "add" })}
            >
              <Plus size={16} />
              Create your first goal
            </button>
          </div>
        )}
      </section>

      <section className="sav-lower-grid">
        <article className="sav-panel sav-contributions-panel">
          <div className="sav-panel-heading">
            <div className="sav-panel-title-icon">
              <TrendingUp size={17} />
            </div>

            <div>
              <h2>Recent Contributions</h2>
              <p>Every deposit gets you closer.</p>
            </div>

            <button
              className="sav-text-button"
              onClick={() => setShowAll(true)}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          {loading ? (
            <div className="sav-muted-state">
              Loading contributions…
            </div>
          ) : recent.length ? (
            <div className="sav-contribution-list">
              {(showAll ? recent : recent.slice(0, 4)).map(
                (c) => (
                  <div
                    className="sav-contribution-row"
                    key={c.id}
                  >
                    <span className="sav-contribution-emoji">
                      {c.goalEmoji}
                    </span>

                    <div className="sav-contribution-details">
                      <strong>{c.goalTitle}</strong>
                      <span>
                        {formatContributionDate(c.dateIso)}
                      </span>
                    </div>

                    <span className="sav-contribution-amount">
                      +{money(c.amount)}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="sav-muted-state">
              No contributions yet. Add savings to a goal
              to see them here.
            </div>
          )}
        </article>

        <article className="sav-panel sav-chart-panel">
          <div className="sav-panel-heading">
            <div className="sav-panel-title-icon">
              <BarChart2 size={17} />
            </div>

            <div>
              <h2>Savings Growth</h2>
              <p>Your contributions over time</p>
            </div>
          </div>

          {chartData.length > 1 ? (
            <div className="sav-chart">
              <ResponsiveContainer
                width="100%"
                height={230}
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 8,
                    left: 0,
                    bottom: 0
                  }}
                >
                  <defs>
                    <linearGradient
                      id="savGrowthFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={BLUE}
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor={BLUE}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e8f0f6"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8193a3",
                      fontSize: 11
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8193a3",
                      fontSize: 11
                    }}
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `₹${Math.round(v / 1000)}k`
                        : `₹${v}`
                    }
                    width={45}
                  />

                  <Tooltip
                    formatter={(v) => [
                      money(v),
                      "Contributed to date"
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e4edf4",
                      boxShadow: "0 8px 24px #183b5312"
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={BLUE}
                    strokeWidth={2.5}
                    fill="url(#savGrowthFill)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 0
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sav-chart-empty">
              <div>
                <TrendingUp size={24} />
                <p>
                  Your growth chart will appear as you
                  add contributions across dates.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      {completedGoals.length > 0 && (
        <section className="sav-section sav-completed-section">
          <div className="sav-section-heading">
            <div>
              <h2>
                <CheckCircle2 size={20} />
                Completed Goals
              </h2>
              <p>
                You did it — celebrate the progress you made.
              </p>
            </div>

            <span className="sav-completed-count">
              {completedGoals.length} achieved
            </span>
          </div>

          <div className="sav-goal-grid">
            {completedGoals.map((g) => (
              <article
                className="sav-goal-card sav-completed-card"
                key={g.id}
              >
                <div className="sav-completed-strip" />

                <div className="sav-goal-top">
                  <div className="sav-goal-identity">
                    <span className="sav-goal-emoji">
                      {g.emoji}
                    </span>

                    <div>
                      <h3>{g.title}</h3>
                      <p>
                        Target: {g.deadline || "Reached"}
                      </p>
                    </div>
                  </div>

                  <span className="sav-done-pill">
                    <CheckCircle2 size={13} />
                    Done
                  </span>
                </div>

                <div className="sav-progress">
                  <span style={{ width: "100%" }} />
                </div>

                <div className="sav-goal-remaining">
                  <span>Saved {money(g.saved)}</span>
                  <strong>100%</strong>
                </div>

                <p className="sav-goal-quote">
                  “{g.quote}”
                </p>

                <button
                  className="sav-completed-remove"
                  onClick={() => setDeleteGoal(g)}
                >
                  <Trash2 size={13} />
                  Remove goal
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {modal && (
        <GoalModal
          initial={modal.mode === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveGoal}
          saving={saving}
        />
      )}

      {contributeGoal && (
        <ContributionModal
          goal={contributeGoal}
          onClose={() => setContributeGoal(null)}
          onSave={addContribution}
          saving={saving}
        />
      )}

      {deleteGoal && (
        <ConfirmDelete
          goal={deleteGoal}
          onClose={() => setDeleteGoal(null)}
          onConfirm={removeGoal}
          saving={saving}
        />
      )}

      {showAll && (
        <Modal
          title="All contributions"
          onClose={() => setShowAll(false)}
          wide
        >
          <div className="sav-all-contributions">
            {recent.map((c) => (
              <div
                className="sav-contribution-row"
                key={c.id}
              >
                <span className="sav-contribution-emoji">
                  {c.goalEmoji}
                </span>

                <div className="sav-contribution-details">
                  <strong>{c.goalTitle}</strong>
                  <span>
                    {formatContributionDate(c.dateIso)}
                  </span>
                </div>

                <span className="sav-contribution-amount">
                  +{money(c.amount)}
                </span>
              </div>
            ))}

            {!recent.length && (
              <div className="sav-muted-state">
                No contributions recorded yet.
              </div>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}