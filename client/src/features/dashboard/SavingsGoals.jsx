import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { getSavingsGoals } from "../../pages/savingsGoalsService";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function SavingsGoals({ onNavigate }) {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSavingsGoals(token)
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error("The savings goal service returned an invalid response.");
        }
        if (active) setGoals(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load savings goals.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="savings-goals-card">
      <div className="savings-goals-header">
        <div>
          <h2>Savings Goals</h2>
          <p>Your saved progress across personal goals</p>
        </div>
        <button className="view-all-btn" type="button" onClick={() => onNavigate("/savings-goals")}>
          View all
        </button>
      </div>

      {loading ? (
        <p className="dashboard-goals-message" role="status">Loading savings goals…</p>
      ) : error ? (
        <p className="dashboard-goals-message" role="alert">{error}</p>
      ) : goals.length === 0 ? (
        <p className="dashboard-goals-message">
          No savings goals yet.{" "}
          <button type="button" onClick={() => onNavigate("/savings-goals")}>Create one</button>
        </p>
      ) : (
        <div className="savings-goals-list">
          {goals.slice(0, 3).map((goal) => {
            const target = Number(goal.target_amount);
            const saved = Number(goal.saved_amount);
            const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
            return (
              <article className="savings-goal" key={goal.id}>
                <div className="goal-top">
                  <div className="goal-info">
                    <span className="goal-icon" aria-hidden="true">◎</span>
                    <div>
                      <h3>{goal.name}</h3>
                      <span>Target date: {goal.target_date}</span>
                    </div>
                  </div>
                  <span className="goal-percentage">{Math.round(progress)}%</span>
                </div>
                <div
                  className="goal-progress"
                  role="progressbar"
                  aria-label={`${goal.name} progress`}
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="goal-bottom">
                  <span>{formatCurrency(saved)} saved</span>
                  <span>{formatCurrency(target)} target</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default SavingsGoals;
