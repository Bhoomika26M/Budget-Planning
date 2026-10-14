import { useState } from "react";

function AddTransactionModal({ onClose }) {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-09-03");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("Checking");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isExpense = type === "expense";

  const categories = [
    ["🍴", "Food & Dining"],
    ["🚗", "Transportation"],
    ["📚", "Education"],
    ["🛒", "Groceries"],
    ["🎮", "Entertainment"],
    ["🛍️", "Shopping"],
    ["💊", "Health"],
    ["💡", "Utilities"],
    ["🏠", "Rent"],
    ["📦", "Other"],
  ];

  const handleSubmit = async () => {
    setError("");

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    const transactionData = {
      type,
      description: description.trim(),
      amount: Number(amount),
      date,
      category,
      account,
    };

    try {
      setSaving(true);

      const response = await fetch(
        "http://127.0.0.1:8000/dashboard/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transactionData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add transaction.");
      }

      console.log("Transaction saved:", data);

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="transaction-modal-overlay">
      <div className="transaction-modal">

        <div className="transaction-modal-header">
          <h2>Add Transaction</h2>

          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="transaction-type">
          <button
            className={`type-btn ${
              isExpense ? "expense-active" : ""
            }`}
            onClick={() => setType("expense")}
            type="button"
          >
            − Expense
          </button>

          <button
            className={`type-btn ${
              !isExpense ? "income-active" : ""
            }`}
            onClick={() => setType("income")}
            type="button"
          >
            + Income
          </button>
        </div>

        <label>Description *</label>

        <input
          type="text"
          className="transaction-input full-width"
          placeholder="e.g. Coffee, Salary, Bus pass..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="transaction-row">

          <div className="transaction-field">
            <label>Amount (₹) *</label>

            <input
              type="number"
              className="transaction-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="transaction-field">
            <label>Date *</label>

            <input
              type="date"
              className="transaction-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

        </div>

        <label>Category *</label>

        <div className="category-list">
          {categories.map(([icon, name]) => (
            <button
              key={name}
              type="button"
              className={
                category === name ? "category-selected" : ""
              }
              onClick={() => setCategory(name)}
            >
              {icon} {name}
            </button>
          ))}
        </div>

        <label>Account</label>

        <select
          className="transaction-input full-width"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option>Checking</option>
          <option>Savings</option>
          <option>Cash</option>
        </select>

        {error && (
          <p className="transaction-error">
            {error}
          </p>
        )}

        <div className="transaction-modal-actions">

          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className={`add-expense-btn ${
              !isExpense ? "add-income-btn" : ""
            }`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isExpense
                ? "Add Expense"
                : "Add Income"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default AddTransactionModal;