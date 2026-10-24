import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  updateSavingsGoalProgress,
} from "./savingsGoalsService";
import "./SavingsGoals.css";

const EMPTY_FORM = {
  name: "",
  target_amount: "",
  saved_amount: "0",
  target_date: "",
};

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="m15 9 5-5" />
      <path d="M16 4h4v4" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5Z" />
      <path d="M4 7h15" />
      <path d="M19 9h2v6h-2a3 3 0 0 1 0-6Z" />
      <circle cx="19" cy="12" r=".8" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon" aria-hidden="true">
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4" />
      <path d="M16 6h4v2a4 4 0 0 1-4 4" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
      <path d="M9 17h6" />
    </svg>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function SavingsGoals() {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [formMode, setFormMode] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    let active = true;
    getSavingsGoals(token)
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The savings goal service returned an invalid response.");
        }
        if (active) {
          setGoals(data);
          setLoadError("");
        }
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError.message || "Unable to load savings goals.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, reloadKey]);

  const summary = useMemo(() => {
    const target = goals.reduce((total, goal) => total + Number(goal.target_amount), 0);
    const saved = goals.reduce((total, goal) => total + Number(goal.saved_amount), 0);
    return {
      target,
      saved,
      completed: goals.filter(
        (goal) => Number(goal.saved_amount) >= Number(goal.target_amount),
      ).length,
      progress: target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0,
    };
  }, [goals]);

  function openCreateForm() {
    setFormData(EMPTY_FORM);
    setActiveGoal(null);
    setFormMode("create");
    setError("");
    setStatus("");
  }

  function openProgressForm(goal) {
    setFormData({
      ...EMPTY_FORM,
      saved_amount: String(goal.saved_amount),
    });
    setActiveGoal(goal);
    setFormMode("progress");
    setError("");
    setStatus("");
  }

  function closeForm() {
    if (!saving) {
      setFormMode(null);
      setActiveGoal(null);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    const amount = Number(formData.target_amount);
    const saved = Number(formData.saved_amount || 0);
    if (formMode === "create" && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Enter a target amount greater than zero.");
      return;
    }
    if (!Number.isFinite(saved) || saved < 0) {
      setError("Saved amount must be zero or more.");
      return;
    }
    if (formMode === "create" && saved > amount) {
      setError("Already saved cannot be greater than the target amount.");
      return;
    }
    if (formMode === "progress" && activeGoal && saved > Number(activeGoal.target_amount)) {
      setError("Saved amount cannot be greater than the target amount.");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        const goal = await createSavingsGoal(token, {
          name: formData.name.trim(),
          target_amount: amount,
          saved_amount: saved,
          target_date: formData.target_date,
        });
        setGoals((current) => [...current, goal].sort(
          (first, second) => first.target_date.localeCompare(second.target_date),
        ));
        setLoadError("");
        setStatus("Savings goal created.");
      } else if (activeGoal) {
        const goal = await updateSavingsGoalProgress(
          token,
          activeGoal.id,
          saved,
        );
        setGoals((current) => current.map((item) => item.id === goal.id ? goal : item));
        setStatus("Savings progress updated.");
      }
      setFormMode(null);
      setActiveGoal(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to save savings goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goal) {
    if (!window.confirm(`Delete the savings goal "${goal.name}"?`)) return;
    setError("");
    setStatus("");
    try {
      await deleteSavingsGoal(token, goal.id);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      setStatus("Savings goal deleted.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete savings goal.");
    }
  }

  return (
    <div className="savings-page">
      {error && <div className="error-message" role="alert">{error}</div>}
      {status && <p className="savings-status" role="status">{status}</p>}

      <section className="summary-grid" aria-label="Savings goal summary">
        <div className="summary-card">
          <div className="summary-icon-wrapper target"><TargetIcon /></div>
          <div>
            <p className="summary-label">Total Target</p>
            <h2>{loading ? "…" : formatCurrency(summary.target)}</h2>
            <span>{goals.length} goals</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-wrapper wallet"><WalletIcon /></div>
          <div>
            <p className="summary-label">Total Saved</p>
            <h2 className="green">{loading ? "…" : formatCurrency(summary.saved)}</h2>
            <span>{summary.progress}% of total target</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-wrapper trophy"><TrophyIcon /></div>
          <div>
            <p className="summary-label">Completed</p>
            <h2 className="purple">{loading ? "…" : summary.completed}</h2>
            <span>of {goals.length} goals</span>
          </div>
        </div>
      </section>

      <section className="goals-section">
        <div className="goals-header">
          <div>
            <h2>My Savings Goals</h2>
            <p>Set a target, then update your saved progress.</p>
          </div>
          <button className="add-goal-button" type="button" onClick={openCreateForm}>
            + Add Goal
          </button>
        </div>

        {loading ? (
          <div className="empty-state" role="status"><h3>Loading savings goals…</h3></div>
        ) : loadError ? (
          <div className="empty-state" role="alert">
            <h3>Unable to load savings goals</h3>
            <p>{loadError}</p>
            <button
              className="create-goal-button"
              type="button"
              onClick={() => {
                setLoading(true);
                setReloadKey((current) => current + 1);
              }}
            >
              Retry
            </button>
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><TargetIcon /></div>
            <h3>No savings goals yet</h3>
            <p>Create your first savings goal to start tracking your progress.</p>
            <button className="create-goal-button" type="button" onClick={openCreateForm}>
              + Create Goal
            </button>
          </div>
        ) : (
          <div className="goals-list">
            {goals.map((goal) => {
              const target = Number(goal.target_amount);
              const saved = Number(goal.saved_amount);
              const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
              const complete = saved >= target;
              return (
                <article className="summary-card savings-goal-card" key={goal.id}>
                  <div className="summary-icon-wrapper target"><TargetIcon /></div>
                  <div className="savings-goal-details">
                    <h3>{goal.name}</h3>
                    <p>{formatCurrency(saved)} saved of {formatCurrency(target)}</p>
                    <div
                      className="savings-goal-progress"
                      role="progressbar"
                      aria-label={`${goal.name} progress`}
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <span>
                      {complete ? "Goal completed" : `${Math.round(progress)}% complete`}
                      {" · "}Target date: {goal.target_date}
                    </span>
                    <div className="savings-goal-actions">
                      {!complete && (
                        <button type="button" onClick={() => openProgressForm(goal)}>
                          Update saved amount
                        </button>
                      )}
                      <button
                        className="savings-goal-delete"
                        type="button"
                        onClick={() => handleDelete(goal)}
                      >
                        Delete goal
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formMode && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <section className="goal-modal" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
            <div className="modal-header">
              <h2 id="goal-modal-title">
                {formMode === "create" ? "Add Savings Goal" : `Update ${activeGoal?.name}`}
              </h2>
              <button
                className="close-button"
                type="button"
                aria-label="Close dialog"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formMode === "create" ? (
                <>
                  <label htmlFor="goal-name">Goal name</label>
                  <input
                    id="goal-name"
                    name="name"
                    type="text"
                    maxLength="120"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Example: Emergency fund"
                    required
                  />
                  <label htmlFor="goal-target">Target amount (INR)</label>
                  <input
                    id="goal-target"
                    name="target_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="goal-saved">Already saved (INR)</label>
                  <input
                    id="goal-saved"
                    name="saved_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.saved_amount}
                    onChange={handleChange}
                  />
                  <label htmlFor="goal-date">Target date</label>
                  <input
                    id="goal-date"
                    name="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={handleChange}
                    required
                  />
                </>
              ) : (
                <>
                  <p>
                    Current progress: {formatCurrency(activeGoal?.saved_amount)} of{" "}
                    {formatCurrency(activeGoal?.target_amount)}
                  </p>
                  <label htmlFor="goal-saved">Total saved so far (INR)</label>
                  <input
                    id="goal-saved"
                    name="saved_amount"
                    type="number"
                    min="0"
                    max={activeGoal?.target_amount}
                    step="0.01"
                    value={formData.saved_amount}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
              <button type="submit" className="create-submit-button" disabled={saving}>
                {saving ? "Saving…" : formMode === "create" ? "Create Goal" : "Save Progress"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;
