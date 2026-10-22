
import React, { useEffect, useMemo, useState } from "react";
import "./Savings.css";

const STORAGE_KEY = "budget_planning_savings_v1";

const COLORS = [
  "#2E93C7",
  "#20A779",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#EC4899",
];

const INITIAL_GOALS = [
  {
    id: 1,
    name: "Emergency Fund",
    target: 50000,
    saved: 18000,
    deadline: "2027-03-31",
    color: "#2E93C7",
    note: "Build a safety net for unexpected expenses.",
  },
  {
    id: 2,
    name: "New Laptop",
    target: 75000,
    saved: 30000,
    deadline: "2027-01-31",
    color: "#20A779",
    note: "Save for a laptop upgrade.",
  },
  {
    id: 3,
    name: "Dream Vacation",
    target: 40000,
    saved: 10000,
    deadline: "2027-06-30",
    color: "#8B5CF6",
    note: "Plan a relaxing trip.",
  },
];

const EMPTY_FORM = {
  name: "",
  target: "",
  saved: "",
  deadline: "",
  color: COLORS[0],
  note: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getProgress = (goal) => {
  if (!goal.target || goal.target <= 0) return 0;

  return Math.min(
    100,
    Math.round((goal.saved / goal.target) * 100)
  );
};

function Savings() {
  const [goals, setGoals] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const totals = useMemo(() => {
    const target = goals.reduce(
      (sum, goal) => sum + Number(goal.target || 0),
      0
    );

    const saved = goals.reduce(
      (sum, goal) => sum + Number(goal.saved || 0),
      0
    );

    const remaining = Math.max(0, target - saved);

    return {
      target,
      saved,
      remaining,
      progress: target > 0
        ? Math.min(100, Math.round((saved / target) * 100))
        : 0,
      completed: goals.filter(
        (goal) => Number(goal.saved) >= Number(goal.target)
      ).length,
    };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesSearch = goal.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const progress = getProgress(goal);

      const matchesFilter =
        filter === "all" ||
        (filter === "in-progress" &&
          progress > 0 &&
          progress < 100) ||
        (filter === "not-started" && progress === 0) ||
        (filter === "completed" && progress === 100);

      return matchesSearch && matchesFilter;
    });
  }, [goals, search, filter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (goal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      target: String(goal.target),
      saved: String(goal.saved),
      deadline: goal.deadline || "",
      color: goal.color || COLORS[0],
      note: goal.note || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const target = Number(form.target);
    const saved = Number(form.saved || 0);

    if (!name || !Number.isFinite(target) || target <= 0) {
      alert("Enter a goal name and a valid target amount.");
      return;
    }

    if (!Number.isFinite(saved) || saved < 0) {
      alert("Saved amount cannot be negative.");
      return;
    }

    if (saved > target) {
      alert("Saved amount cannot exceed the target amount.");
      return;
    }

    const goalData = {
      name,
      target,
      saved,
      deadline: form.deadline,
      color: form.color,
      note: form.note.trim(),
    };

    if (editingId !== null) {
      setGoals((previous) =>
        previous.map((goal) =>
          goal.id === editingId
            ? { ...goal, ...goalData }
            : goal
        )
      );
    } else {
      setGoals((previous) => [
        ...previous,
        { id: Date.now(), ...goalData },
      ]);
    }

    closeForm();
  };

  const deleteGoal = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (!confirmed) return;

    setGoals((previous) =>
      previous.filter((goal) => goal.id !== id)
    );
  };

  const openDeposit = (goal) => {
    setDepositGoal(goal);
    setDepositAmount("");
  };

  const closeDeposit = () => {
    setDepositGoal(null);
    setDepositAmount("");
  };

  const addDeposit = (event) => {
    event.preventDefault();

    const amount = Number(depositAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a deposit amount greater than zero.");
      return;
    }

    const goal = goals.find(
      (item) => item.id === depositGoal.id
    );

    if (!goal) {
      closeDeposit();
      return;
    }

    if (amount + Number(goal.saved) > Number(goal.target)) {
      alert(
        `You can add up to ${formatCurrency(
          goal.target - goal.saved
        )} to this goal.`
      );
      return;
    }

    setGoals((previous) =>
      previous.map((item) =>
        item.id === depositGoal.id
          ? { ...item, saved: Number(item.saved) + amount }
          : item
      )
    );

    closeDeposit();
  };

  const getStatus = (goal) => {
    const progress = getProgress(goal);

    if (progress === 100) return "Completed";
    if (progress === 0) return "Not started";
    return "In progress";
  };

  return (
    <main className="savings-page">
      <header className="savings-header">
        <div>
          <p className="savings-eyebrow">FINANCIAL PLANNING</p>
          <h1>Savings</h1>
          <p className="savings-subtitle">
            Set savings targets, track your progress, and work
            towards your financial goals.
          </p>
        </div>

        <button
          type="button"
          className="savings-primary-btn"
          onClick={openCreateForm}
        >
          <span aria-hidden="true">+</span> New savings goal
        </button>
      </header>

      <section className="savings-summary-grid">
        <article className="savings-summary-card">
          <div className="savings-summary-top">
            <span className="savings-summary-icon blue">₹</span>
            <span className="savings-summary-label">
              Total saved
            </span>
          </div>
          <h2>{formatCurrency(totals.saved)}</h2>
          <p>Across all your savings goals</p>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-top">
            <span className="savings-summary-icon green">◎</span>
            <span className="savings-summary-label">
              Target amount
            </span>
          </div>
          <h2>{formatCurrency(totals.target)}</h2>
          <p>{goals.length} savings goals</p>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-top">
            <span className="savings-summary-icon orange">↗</span>
            <span className="savings-summary-label">
              Remaining amount
            </span>
          </div>
          <h2>{formatCurrency(totals.remaining)}</h2>
          <p>Amount left to reach your targets</p>
        </article>

        <article className="savings-summary-card">
          <div className="savings-summary-top">
            <span className="savings-summary-icon purple">✓</span>
            <span className="savings-summary-label">
              Goals completed
            </span>
          </div>
          <h2>
            {totals.completed}
            <span className="savings-total-small">
              {" "}/ {goals.length}
            </span>
          </h2>
          <p>Keep up the good work!</p>
        </article>
      </section>

      <section className="savings-overview-card">
        <div className="savings-overview-heading">
          <div>
            <h2>Overall savings progress</h2>
            <p>Your progress towards all savings targets</p>
          </div>
          <strong>{totals.progress}%</strong>
        </div>

        <div
          className="savings-progress-track savings-overall-track"
          role="progressbar"
          aria-label="Overall savings progress"
          aria-valuenow={totals.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="savings-progress-fill"
            style={{ width: `${totals.progress}%` }}
          />
        </div>

        <div className="savings-overview-footer">
          <span>{formatCurrency(totals.saved)} saved</span>
          <span>{formatCurrency(totals.target)} target</span>
        </div>
      </section>

      <section className="savings-goals-section">
        <div className="savings-section-heading">
          <div>
            <h2>Your savings goals</h2>
            <p>Manage your goals and track every contribution.</p>
          </div>
          <span className="savings-goal-count">
            {goals.length} {goals.length === 1 ? "goal" : "goals"}
          </span>
        </div>

        <div className="savings-toolbar">
          <div className="savings-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search savings goals..."
              aria-label="Search savings goals"
            />
          </div>

          <select
            className="savings-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter savings goals"
          >
            <option value="all">All goals</option>
            <option value="in-progress">In progress</option>
            <option value="not-started">Not started</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="savings-empty-state">
            <div className="savings-empty-icon">◎</div>
            <h3>No savings goals found</h3>
            <p>
              {goals.length === 0
                ? "Create your first savings goal to get started."
                : "Try another search term or filter."}
            </p>
            {goals.length === 0 && (
              <button
                type="button"
                className="savings-primary-btn"
                onClick={openCreateForm}
              >
                Create a goal
              </button>
            )}
          </div>
        ) : (
          <div className="savings-goals-grid">
            {filteredGoals.map((goal) => {
              const progress = getProgress(goal);
              const remaining = Math.max(
                0,
                Number(goal.target) - Number(goal.saved)
              );

              return (
                <article
                  className="savings-goal-card"
                  key={goal.id}
                >
                  <div
                    className="savings-goal-accent"
                    style={{ backgroundColor: goal.color }}
                  />

                  <div className="savings-goal-card-content">
                    <div className="savings-goal-card-top">
                      <div
                        className="savings-goal-symbol"
                        style={{
                          color: goal.color,
                          backgroundColor: `${goal.color}18`,
                        }}
                      >
                        ◎
                      </div>

                      <div className="savings-goal-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(goal)}
                          aria-label={`Edit ${goal.name}`}
                          title="Edit goal"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          aria-label={`Delete ${goal.name}`}
                          title="Delete goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="savings-goal-title-row">
                      <h3>{goal.name}</h3>
                      <span
                        className={`savings-status ${
                          progress === 100
                            ? "completed"
                            : progress === 0
                              ? "not-started"
                              : "in-progress"
                        }`}
                      >
                        {getStatus(goal)}
                      </span>
                    </div>

                    {goal.note && (
                      <p className="savings-goal-note">
                        {goal.note}
                      </p>
                    )}

                    <div className="savings-goal-amounts">
                      <div>
                        <span>Amount saved</span>
                        <strong>
                          {formatCurrency(goal.saved)}
                        </strong>
                      </div>
                      <div className="savings-amount-target">
                        <span>Target</span>
                        <strong>
                          {formatCurrency(goal.target)}
                        </strong>
                      </div>
                    </div>

                    <div
                      className="savings-progress-track"
                      role="progressbar"
                      aria-label={`${goal.name} progress`}
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="savings-progress-fill"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    <div className="savings-goal-progress-footer">
                      <strong>{progress}% complete</strong>
                      <span>
                        {remaining > 0
                          ? `${formatCurrency(remaining)} left`
                          : "Target reached!"}
                      </span>
                    </div>

                    <div className="savings-goal-bottom">
                      <span>
                        {goal.deadline
                          ? `Target date: ${new Date(
                              `${goal.deadline}T00:00:00`
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "No target date"}
                      </span>

                      <button
                        type="button"
                        className="savings-deposit-btn"
                        onClick={() => openDeposit(goal)}
                        disabled={progress === 100}
                      >
                        + Add savings
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="savings-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="savings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-form-title"
          >
            <div className="savings-modal-header">
              <div>
                <p className="savings-eyebrow">SAVINGS PLANNER</p>
                <h2 id="savings-form-title">
                  {editingId !== null
                    ? "Edit savings goal"
                    : "Create savings goal"}
                </h2>
              </div>
              <button
                type="button"
                className="savings-modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <label className="savings-form-field">
                Goal name *
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Emergency fund"
                  required
                  maxLength={80}
                />
              </label>

              <div className="savings-form-row">
                <label className="savings-form-field">
                  Target amount (₹) *
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.target}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        target: event.target.value,
                      }))
                    }
                    placeholder="50000"
                    required
                  />
                </label>

                <label className="savings-form-field">
                  Already saved (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.saved}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        saved: event.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </label>
              </div>

              <label className="savings-form-field">
                Target date
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      deadline: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="savings-form-field">
                Description
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      note: event.target.value,
                    }))
                  }
                  placeholder="What are you saving for?"
                  rows={3}
                  maxLength={250}
                />
              </label>

              <div className="savings-form-field">
                <span className="savings-field-label">
                  Goal color
                </span>
                <div className="savings-color-options">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`savings-color-option ${
                        form.color === color ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          color,
                        }))
                      }
                      aria-label={`Choose color ${color}`}
                      aria-pressed={form.color === color}
                    />
                  ))}
                </div>
              </div>

              <div className="savings-modal-actions">
                <button
                  type="button"
                  className="savings-secondary-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="savings-primary-btn"
                >
                  {editingId !== null
                    ? "Save changes"
                    : "Create goal"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {depositGoal && (
        <div
          className="savings-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeposit();
          }}
        >
          <section
            className="savings-modal savings-deposit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="savings-deposit-title"
          >
            <div className="savings-modal-header">
              <div>
                <p className="savings-eyebrow">ADD CONTRIBUTION</p>
                <h2 id="savings-deposit-title">Add savings</h2>
              </div>
              <button
                type="button"
                className="savings-modal-close"
                onClick={closeDeposit}
                aria-label="Close deposit form"
              >
                ×
              </button>
            </div>

            <p className="savings-deposit-description">
              Add money to <strong>{depositGoal.name}</strong>.
            </p>

            <div className="savings-deposit-balance">
              <span>Current savings</span>
              <strong>
                {formatCurrency(depositGoal.saved)}
              </strong>
              <span>Target: {formatCurrency(depositGoal.target)}</span>
            </div>

            <form onSubmit={addDeposit}>
              <label className="savings-form-field">
                Deposit amount (₹) *
                <input
                  type="number"
                  min="0.01"
                  max={depositGoal.target - depositGoal.saved}
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) =>
                    setDepositAmount(event.target.value)
                  }
                  placeholder="Enter amount"
                  required
                  autoFocus
                />
              </label>

              <p className="savings-deposit-hint">
                Remaining to save:{" "}
                {formatCurrency(
                  depositGoal.target - depositGoal.saved
                )}
              </p>

              <div className="savings-modal-actions">
                <button
                  type="button"
                  className="savings-secondary-btn"
                  onClick={closeDeposit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="savings-primary-btn"
                >
                  Add deposit
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Savings;
