import { useEffect, useState } from "react";

function MonthlyOverview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
        monthNumber: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    return months;
  };

  const months = getLastSixMonths();

  // Calculate income and expenses for each month
  const monthlyData = months.map((month) => {
    const monthTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      return (
        transactionDate.getMonth() === month.monthNumber &&
        transactionDate.getFullYear() === month.year
      );
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
        <p>Loading monthly data...</p>
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