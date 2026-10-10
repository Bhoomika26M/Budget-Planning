import { useEffect, useState } from "react";

function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/transactions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        return response.json();
      })
      .then((data) => {
        setTransactions(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getIcon = (category) => {
    const icons = {
      "Food & Dining": "🍴",
      Transportation: "🚗",
      Education: "📚",
      Groceries: "🛒",
      Entertainment: "🎮",
      Shopping: "🛍️",
      Health: "💊",
      Utilities: "💡",
      Rent: "🏠",
      Other: "📦",
    };

    return icons[category] || "💰";
  };

  return (
    <section className="recent-transactions dashboard-panel">
      <div className="section-header">
        <h2>Recent Transactions</h2>

        <button className="view-all-btn">
          View all →
        </button>
      </div>

      <div className="transaction-list">

        {loading && (
          <p>Loading transactions...</p>
        )}

        {!loading && error && (
          <p>{error}</p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p>No transactions yet.</p>
        )}

        {!loading &&
          !error &&
          transactions.map((transaction) => (
            <div
              className="transaction-item"
              key={transaction.id}
            >
              <div className="transaction-icon">
                {getIcon(transaction.category)}
              </div>

              <div className="transaction-details">
                <strong>
                  {transaction.description}
                </strong>

                <span>
                  {transaction.category} · {transaction.date}
                </span>
              </div>

              <div
                className={`transaction-amount ${transaction.type}`}
              >
                {transaction.type === "income" ? "+" : "-"}₹
                {Number(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export default RecentTransactions;