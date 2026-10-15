import { useEffect, useState } from "react";

function BudgetProgress() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Budget limits for each category
  const budgets = [
    {
      category: "Food & Dining",
      limit: 200,
      icon: "🍴",
    },
    {
      category: "Entertainment",
      limit: 60,
      icon: "🎮",
    },
    {
      category: "Transportation",
      limit: 80,
      icon: "🚗",
    },
  ];

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
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Calculate spending for a category
  const getCategorySpending = (category) => {
    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);

        return (
          transaction.type === "expense" &&
          transaction.category === category &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );
  };

  const formatMoney = (amount) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <section className="budget-progress dashboard-panel">
      <div className="section-header">
        <div>
          <h2>Budget Progress</h2>
          <p>Track your spending against your budgets</p>
        </div>

        <button className="view-all-btn">
          View all →
        </button>
      </div>

      {loading ? (
        <p>Loading budget data...</p>
      ) : (
        <div className="budget-list">
          {budgets.map((budget) => {
            const spent = getCategorySpending(
              budget.category
            );

            const percentage =
              budget.limit > 0
                ? Math.round(
                    (spent / budget.limit) * 100
                  )
                : 0;

            const progressWidth = Math.min(
              percentage,
              100
            );

            return (
              <div
                className="budget-item"
                key={budget.category}
              >
                <div className="budget-item-top">
                  <div className="budget-category">
                    <span className="budget-icon">
                      {budget.icon}
                    </span>

                    <div>
                      <strong>
                        {budget.category}
                      </strong>

                      <span>
                        {formatMoney(spent)} of{" "}
                        {formatMoney(budget.limit)}
                      </span>
                    </div>
                  </div>

                  <span className="budget-percentage">
                    {percentage}%
                  </span>
                </div>

                <div className="budget-bar">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${progressWidth}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default BudgetProgress;