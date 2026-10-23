import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function SummaryCards() {
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
        if (active) setError(error.message || "Unable to load financial data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Transactions from the current month
  const monthlyTransactions = transactions.filter((transaction) => {
    return transaction.date.startsWith(currentMonthKey);
  });

  // Calculate income
  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  // Calculate expenses
  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  // Current balance
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const currentBalance = totalIncome - totalExpenses;

  // Savings rate
  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  // Format money
  const formatMoney = (amount) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const summaryData = [
    {
      title: "Current Balance",
      value: error ? "Unavailable" : loading ? "..." : formatMoney(currentBalance),
      subtitle: error
        ? "Unable to load financial data"
        : loading
          ? "Loading..."
        : `${savingsRate.toFixed(1)}% savings rate`,
      type: "balance",
      icon: "▣",
    },
    {
      title: "Income (Month)",
      value: error ? "Unavailable" : loading ? "..." : formatMoney(monthlyIncome),
      subtitle: monthName,
      type: "income",
      icon: "↗",
    },
    {
      title: "Expenses (Month)",
      value: error ? "Unavailable" : loading ? "..." : formatMoney(monthlyExpenses),
      subtitle: error
        ? "Unable to load financial data"
        : loading
          ? "Loading..."
          : `${monthlyTransactions.filter(
            (transaction) => transaction.type === "expense"
          ).length} transactions`,
      type: "expense",
      icon: "↘",
    },
    {
      title: "Savings Goals",
      value: "—",
      subtitle: "Goal tracking is not connected",
      type: "savings",
      icon: "◎",
    },
  ];

  return (
    <section className="summary-cards">
      {error && <p role="alert">{error}</p>}
      {summaryData.map((card) => (
        <div
          className={`summary-card ${card.type}`}
          key={card.title}
        >
          <div className="summary-card-top">
            <span className="summary-title">
              {card.title}
            </span>

            <span className="summary-icon">
              {card.icon}
            </span>
          </div>

          <div className="summary-value">
            {card.value}
          </div>

          <div className="summary-subtitle">
            {card.subtitle}
          </div>
        </div>
      ))}
    </section>
  );
}

export default SummaryCards;