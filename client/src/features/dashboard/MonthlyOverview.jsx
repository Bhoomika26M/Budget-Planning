import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function MonthlyOverview() {
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
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The transaction service returned an invalid response.");
        }
        if (active) {
          setTransactions(data);
          setError("");
        }
      })
      .catch((error) => {
        if (active) setError(error.message || "Unable to load monthly data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Get the last 6 months
  const getLastSixMonths = () => {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      months.push({
        month: date.toLocaleString("en-US", {
          month: "short",
        }),
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      });
    }

    return months;
  };

  const months = getLastSixMonths();

  // Calculate income and expenses for each month
  const monthlyData = months.map((month) => {
    const monthTransactions = transactions.filter((transaction) => {
      return transaction.date.startsWith(month.key);
    });

    const income = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    const expense = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    return {
      month: month.month,
      income,
      expense,
    };
  });

  // Find the highest value for chart scaling
  const highestValue = Math.max(
    ...monthlyData.flatMap((item) => [
      item.income,
      item.expense,
    ]),
    100
  );

  // Round max value up for cleaner chart
  const maxValue =
    Math.ceil(highestValue / 100) * 100;

  return (
    <div className="monthly-overview dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Monthly Overview</h2>
          <p>Income vs Expenses — last 6 months</p>
        </div>
      </div>

      {loading ? (
        <p role="status">Loading monthly data...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="chart">
            <div className="chart-y-axis">
              <span>₹{maxValue}</span>
              <span>₹{Math.round(maxValue * 0.75)}</span>
              <span>₹{Math.round(maxValue * 0.5)}</span>
              <span>₹{Math.round(maxValue * 0.25)}</span>
              <span>₹0</span>
            </div>

            <div className="chart-area">
              <div className="chart-grid">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="bars">
                {monthlyData.map((item) => (
                  <div
                    className="month-group"
                    key={item.month}
                  >
                    <div className="bar-container">
                      <div
                        className="income-bar"
                        style={{
                          height: `${
                            (item.income / maxValue) * 100
                          }%`,
                        }}
                        title={`Income: ₹${item.income.toFixed(2)}`}
                      />

                      <div
                        className="expense-bar"
                        style={{
                          height: `${
                            (item.expense / maxValue) * 100
                          }%`,
                        }}
                        title={`Expenses: ₹${item.expense.toFixed(2)}`}
                      />
                    </div>

                    <span className="month-label">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-income" />
              Income
            </span>

            <span>
              <i className="legend-expense" />
              Expenses
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyOverview;