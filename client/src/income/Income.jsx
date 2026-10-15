import { useEffect, useState } from "react";
import {
  getIncome,
  addIncome,
  deleteIncome,
  getIncomeSources,
  addIncomeSource,
  deleteIncomeSource,
} from "./incomeService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Search,
  Plus,
  Moon,
  Bell,
  ChevronDown,
} from "lucide-react";

import "./Income.css";

function Income() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
   const [incomeSources, setIncomeSources] = useState([]);
const [showSourceForm, setShowSourceForm] = useState(false);
const [sourceFormData, setSourceFormData] = useState({
  name: "",
  amount: "",
  category: "",
  frequency: "Monthly",
});
const [savingSource, setSavingSource] = useState(false);
const [formData, setFormData] = useState({
  description: "",
  amount: "",
  date: "",
  category: "pocket-money",
});

const [saving, setSaving] = useState(false);

  


  const userId = 1;

 

 useEffect(() => {
  async function loadData() {
    try {
      setLoading(true);

      const [incomeData, sourceData] = await Promise.all([
        getIncome(userId),
        getIncomeSources(userId),
      ]);

      setIncome(incomeData);
      setIncomeSources(sourceData);
      setError("");
    } catch (err) {
      setError("Unable to load income data");
    } finally {
      setLoading(false);
    }
  }

  loadData();
}, []);

    

  const totalIncome = income.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

 const monthlyIncome = income.reduce((result, item) => {
  const monthKey = item.date.slice(0, 7);

  const existingMonth = result.find(
    (entry) => entry.key === monthKey
  );

  if (existingMonth) {
    existingMonth.amount += Number(item.amount);
  } else {
    const date = new Date(`${monthKey}-01`);

    result.push({
      key: monthKey,
      month: date.toLocaleString("en-IN", {
        month: "short",
      }),
      amount: Number(item.amount),
    });
  }

  return result;
}, []);

const categoryIncome = income.reduce((result, item) => {
  const existingCategory = result.find(
    (entry) => entry.category === item.category
  );

 

  if (existingCategory) {
    existingCategory.amount += Number(item.amount);
  } else {
    result.push({
      category: item.category,
      amount: Number(item.amount),
    });
    
  }

  return result;
}, []);


  if (loading) {
    return <p>Loading income...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }
const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]: value,
  }));
};
const handleSourceChange = (e) => {
  setSourceFormData({
    ...sourceFormData,
    [e.target.name]: e.target.value,
  });
};

const handleSubmit = async (event) => {
  event.preventDefault();

  if (
    !formData.description ||
    !formData.amount ||
    !formData.date ||
    !formData.category
  ) {
    setError("Please fill in all fields.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    const newIncome = await addIncome({
      user_id: userId,
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      category: formData.category,
    });

    setIncome((previous) => [newIncome, ...previous]);

    setFormData({
      description: "",
      amount: "",
      date: "",
      category: "pocket-money",
    });

    setShowForm(false);
  } catch (err) {
    setError("Unable to save income.");
  } finally {
    setSaving(false);
  }
};

const handleSourceSubmit = async (e) => {
  e.preventDefault();

  try {
    setSavingSource(true);

    const newSource = await addIncomeSource({
      user_id: userId,
      name: sourceFormData.name,
      amount: Number(sourceFormData.amount),
      category: sourceFormData.category,
      frequency: sourceFormData.frequency,
    });

    setIncomeSources((currentSources) => [
      newSource,
      ...currentSources,
    ]);

    setSourceFormData({
      name: "",
      amount: "",
      category: "",
      frequency: "Monthly",
    });

    setShowSourceForm(false);
  } catch (err) {
    setError("Unable to add income source");
  } finally {
    setSavingSource(false);
  }
};

const handleDelete = async (incomeId) => {
  try {
    await deleteIncome(incomeId, userId);

    setIncome((previous) =>
      previous.filter((item) => item.id !== incomeId)
    );
  } catch (err) {
    setError("Unable to delete income.");
  }
};

const handleSourceDelete = async (sourceId) => {
  try {
    await deleteIncomeSource(sourceId, userId);

    setIncomeSources((currentSources) =>
      currentSources.filter((source) => source.id !== sourceId)
    );
  } catch (err) {
    setError("Unable to delete income source.");
  }
};

return (
  <div className={`income-page ${darkMode ? "dark-mode" : ""}`}>

    {/* Header */}
    <div className="income-header">
  <div className="income-title">
    <h1>Income</h1>
    <p>Track your earnings, Gouri 👋</p>
  </div>

  <div className="income-header-actions">

    <div className="income-search">
      <Search size={18} />
      <input
        type="text"
        placeholder="Search..."
      />
    </div>

    <button
  className="header-add-transaction"
  onClick={() => setShowForm(true)}
>
  <Plus size={17} />
  Add Transaction
</button>

    <button
  className="header-icon-button"
  title="Night light"
  onClick={() => setDarkMode(!darkMode)}
>
  <Moon size={19} />
</button>

    <button
      className="header-icon-button notification-button"
      title="Notifications"
    >
      <Bell size={19} />
      <span className="notification-dot"></span>
    </button>

    <div className="profile-wrapper">
  <button
    className="header-profile"
    onClick={() => setShowProfileMenu(!showProfileMenu)}
  >
    <span className="profile-avatar">G</span>
    <span>Gouri</span>
    <ChevronDown size={15} />
  </button>

  {showProfileMenu && (
    <div className="profile-menu">
      <button>Profile</button>
      <button>Settings</button>
      <button className="logout-button">Log out</button>
    </div>
  )}
</div>

  </div>
</div>

    {/* Add Income Form */}
    {showForm && (
  <div className="income-modal-overlay">
    <div className="income-modal">

      <div className="income-modal-header">
        <div>
          <h2>Record Income</h2>
          <p>Add a new income transaction</p>
        </div>

        <button
          type="button"
          className="modal-close-button"
          onClick={() => setShowForm(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Monthly Pocket Money"
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Category</label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="scholarship">
                Scholarship / Grant
              </option>

              <option value="pocket-money">
                Pocket Money
              </option>

              <option value="part-time">
                Part-time Job
              </option>

              <option value="freelancing">
                Freelancing
              </option>

              <option value="tutoring">
                Tutoring
              </option>

              <option value="student-loan">
                Student Loan
              </option>

              <option value="investments">
                Investments
              </option>

              <option value="gifts">
                Gifts / Rewards
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div className="form-actions">

            <button
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Income"}
            </button>

          </div>

             </form>

    </div>
  </div>
)}

    {/* Statistics */}
    <div className="income-stats">

      <div className="income-stat-card">
        <p className="stat-label">Total Income</p>

        <h2>
          ₹{totalIncome.toLocaleString("en-IN")}
        </h2>
      </div>

      <div className="income-stat-card">
  <p className="stat-label">Income Sources</p>

  <h2>
    {incomeSources.length}
  </h2>
</div>

      <div className="income-stat-card">
        <p className="stat-label">Latest Income</p>

        <h2>
          ₹
          {income.length > 0
            ? Number(income[0].amount).toLocaleString("en-IN")
            : "0"}
        </h2>
      </div>

    </div>
  <div className="income-charts-grid">

  {/* Monthly Income Trend */}
  <div className="income-chart-card">
    <h2>Monthly Income Trend</h2>

    {monthlyIncome.length === 0 ? (
      <p>No income data available yet.</p>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={monthlyIncome}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#0F6574"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>

  {/* Income by Category */}
  <div className="income-chart-card">
    <h2>Income by Category</h2>

    {categoryIncome.length === 0 ? (
      <p>No category data available yet.</p>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={categoryIncome}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {categoryIncome.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={[
                  "#4F93A0",
                  "#22C55E",
                  "#166879",
                  "#8B5CF6",
                  "#F4B400",
                  "#86B4C1",
                  "#EF4444",
                  "#EC4899",
                  "#6B7280",
                ][index % 9]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>

</div>
    
{/* Income Sources */}
<div className="income-sources">
  <div className="section-header">
    <div>
      <h2>Income Sources</h2>
      <p>Regular income sources and their amounts</p>
    </div>

    <div className="income-source-actions">
  <button
    className="record-income-button"
    onClick={() => setShowForm(true)}
  >
    + Record Income
  </button>

  <button
    className="add-source-button"
    onClick={() => setShowSourceForm(true)}
  >
    + Add Source
  </button>
</div>
  </div>

  {incomeSources.length === 0 ? (
    <div className="empty-source-state">
      <p>No income sources added yet.</p>
      <button
        className="add-source-button"
        onClick={() => setShowSourceForm(true)}
      >
        + Add Your First Source
      </button>
    </div>
  ) : (
    <div className="income-source-grid">
      {incomeSources.map((source) => (
        <div className="income-source-card" key={source.id}>
          <div className="source-icon">💡</div>

          <div className="source-info">
            <p className="source-name">{source.name}</p>

            <p className="source-label">
              {source.category
                .split("-")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ")}
              {" · "}
              {source.frequency}
            </p>

            <p className="source-amount">
              ₹{Number(source.amount).toLocaleString("en-IN")}
            </p>
          </div>

          <button
            className="delete-source-button"
            onClick={() => handleSourceDelete(source.id)}
            title="Delete income source"
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  )}

  {showSourceForm && (
    <div className="income-modal-overlay">
      <div className="income-modal">
        <div className="income-modal-header">
          <div>
            <h2>Add Income Source</h2>
            <p>Add a regular source of income</p>
          </div>

          <button
            className="modal-close-button"
            onClick={() => setShowSourceForm(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSourceSubmit}>
          <div className="form-group">
            <label>Source Name</label>
            <input
              type="text"
              name="name"
              value={sourceFormData.name}
              onChange={handleSourceChange}
              placeholder="e.g. Monthly Scholarship"
              required
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={sourceFormData.amount}
              onChange={handleSourceChange}
              placeholder="e.g. 500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={sourceFormData.category}
                onChange={handleSourceChange}
                required
              >
                <option value="">Select category</option>
                <option value="scholarship">Scholarship / Grant</option>
                <option value="pocket-money">Pocket Money</option>
                <option value="part-time">Part-time Job</option>
                <option value="freelancing">Freelancing</option>
                <option value="tutoring">Tutoring</option>
                <option value="student-loan">Student Loan</option>
                <option value="investments">Investments</option>
                <option value="gifts">Gifts / Rewards</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <select
                name="frequency"
                value={sourceFormData.frequency}
                onChange={handleSourceChange}
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Yearly">Yearly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>

          <div className="income-modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowSourceForm(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-income-button"
              disabled={savingSource}
            >
              {savingSource ? "Saving..." : "Add Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

    {/* Income Records */}
    <div className="income-records">

      <h2>Income Records</h2>

      {income.length === 0 ? (
        <p>No income recorded yet.</p>
      ) : (
        income.map((item) => (

          <div
            className="income-record"
            key={item.id}
          >

            <div>

              <p className="income-description">
                {item.description}
              </p>

              <p className="income-category">
                {item.category}
              </p>

              <p className="income-date">
                {item.date}
              </p>

            </div>

            <div className="income-record-actions">
  <p className="income-amount">
    ₹{Number(item.amount).toLocaleString("en-IN")}
  </p>

  <button
    className="delete-income-button"
    onClick={() => handleDelete(item.id)}
  >
    Delete
  </button>
</div>

          </div>

        ))
      )}

    </div>

  </div>
);
}

export default Income;