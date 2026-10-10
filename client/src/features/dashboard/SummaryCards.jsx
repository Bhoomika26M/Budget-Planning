import { useEffect, useState } from "react";

function SummaryCards() {
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

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Transactions from the current month
  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
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
      value: loading ? "..." : formatMoney(currentBalance),
      subtitle: loading
        ? "Loading..."
        : `${savingsRate.toFixed(1)}% savings rate`,
      type: "balance",
      icon: "▣",
    },
    {
      title: "Income (Month)",
      value: loading ? "..." : formatMoney(monthlyIncome),
      subtitle: monthName,
      type: "income",
      icon: "↗",
    },
    {
      title: "Expenses (Month)",
      value: loading ? "..." : formatMoney(monthlyExpenses),
      subtitle: loading
        ? "Loading..."
        : `${monthlyTransactions.filter(
            (transaction) => transaction.type === "expense"
          ).length} transactions`,
      type: "expense",
      icon: "↘",
    },
    {
      title: "Savings Goals",
      value: "2",
      subtitle: "0 completed",
      type: "savings",
      icon: "◎",
    },
  ];

  return (
    <section className="summary-cards">
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