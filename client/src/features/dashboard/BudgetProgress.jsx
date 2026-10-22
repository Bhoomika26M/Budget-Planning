import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const CATEGORY_STYLE = {
  Food: { icon: "🍴", color: "#34d399" },
  Transport: { icon: "🚗", color: "#60a5fa" },
  Bills: { icon: "💡", color: "#f87171" },
  Other: { icon: "📦", color: "#94a3b8" },
  "Food & Dining": { icon: "🍴", color: "#34d399" },
  Transportation: { icon: "🚗", color: "#60a5fa" },
  Education: { icon: "📚", color: "#38bdf8" },
  Groceries: { icon: "🛒", color: "#22c55e" },
  Entertainment: { icon: "🎮", color: "#fb7185" },
  Shopping: { icon: "🛍️", color: "#fbbf24" },
  Health: { icon: "💊", color: "#a78bfa" },
  Utilities: { icon: "💡", color: "#f87171" },
  Rent: { icon: "🏠", color: "#86b4c1" },
};

function BudgetProgress() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/dashboard/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load recorded expenses.");
        return response.json();
      })
      .then((data) => {
        if (active) {
          setTransactions(data.filter((item) => item.type === "expense"));
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const categoryTotals = transactions.reduce((totals, transaction) => {
    if (transaction.date.startsWith(monthKey)) {
      totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
    }
    return totals;
  }, {});
  const entries = Object.entries(categoryTotals).sort((first, second) => second[1] - first[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  const formatMoney = (amount) => `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <section className="budget-progress dashboard-panel">
      <div className="section-header">
        <div>
          <h2>Spending by Category</h2>
          <p>Share of your recorded expenses this month</p>
        </div>
      </div>

      {loading ? (
        <p role="status">Loading expense data...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : entries.length ? (
        <div className="budget-list">
          {entries.map(([category, amount]) => {
            const style = CATEGORY_STYLE[category] || { icon: "📦", color: "#94a3b8" };
            const percentage = total ? Math.round((amount / total) * 100) : 0;
            return (
              <div className="budget-item" key={category}>
                <div className="budget-item-top">
                  <div className="budget-category">
                    <span className="budget-icon">{style.icon}</span>
                    <div>
                      <strong>{category}</strong>
                      <span>{formatMoney(amount)} of {formatMoney(total)}</span>
                    </div>
                  </div>
                  <span className="budget-percentage">{percentage}%</span>
                </div>
                <div className="budget-bar">
                  <div
                    className="budget-bar-fill"
                    style={{ width: `${percentage}%`, backgroundColor: style.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No expenses recorded for this month.</p>
      )}
    </section>
  );
}

export default BudgetProgress;
