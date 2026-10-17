import { useEffect, useMemo, useState } from 'react';
import './ExpenseTracker.css';

const EXPENSE_CATEGORIES = [
  { value: 'Food', icon: '🍽️', color: '#34d399' },
  { value: 'Transport', icon: '🚗', color: '#60a5fa' },
  { value: 'Shopping', icon: '🛍️', color: '#fbbf24' },
  { value: 'Bills', icon: '💡', color: '#f87171' },
  { value: 'Health', icon: '🏥', color: '#a78bfa' },
  { value: 'Education', icon: '📚', color: '#38bdf8' },
  { value: 'Entertainment', icon: '🎬', color: '#fb7185' },
  { value: 'Other', icon: '💬', color: '#94a3b8' },
];

const API_URL = 'http://127.0.0.1:8000/expenses';

const emptyForm = {
  title: '',
  category: 'Food',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
  payment_method: 'Card',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getCategoryMeta(category) {
  return EXPENSE_CATEGORIES.find((item) => item.value === category) ?? EXPENSE_CATEGORIES[7];
}

function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const res = await fetch(`${API_URL}/`);
      if (!res.ok) throw new Error('Could not load expense records.');
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('The expense API returned an invalid response.');
      }
      setExpenses(data);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to fetch expenses.');
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const today = new Date();
    const recent = expenses.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === today.toDateString();
    });
    const average = expenses.length ? total / expenses.length : 0;
    const categoryTotals = expenses.reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      return map;
    }, {});
    const largest = expenses.reduce((max, item) => {
      if (Number(item.amount || 0) > Number(max.amount || 0)) {
        return item;
      }
      return max;
    }, { amount: 0 });

    return {
      total,
      average,
      todayTotal: recent.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      largest,
      categoryTotals,
    };
  }, [expenses]);

  const dailyHistory = useMemo(() => {
    const grouped = expenses.reduce((acc, item) => {
      const dateKey = item.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, items]) => ({
        date,
        total: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        items: items.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));
  }, [expenses]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !Number(form.amount)) {
      setStatus('Please enter a title and a valid amount.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      note: form.note.trim(),
      payment_method: form.payment_method,
    };

    try {
      const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;
      const res = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not save expense.');
      }

      setStatus(editingId ? 'Expense updated.' : 'Expense added.');
      setForm(emptyForm);
      setEditingId(null);
      await fetchExpenses();
    } catch (error) {
      setStatus(error.message || 'Unable to save expense.');
    }
  }

  async function handleEdit(expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      note: expense.note || '',
      payment_method: expense.payment_method || 'Card',
    });
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Delete failed.');
      }

      setStatus('Expense deleted.');
      await fetchExpenses();
    } catch (error) {
      setStatus(error.message || 'Unable to delete expense.');
    }
  }

  const categoryEntries = Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div>
          <p className="eyebrow">Budgeting</p>
          <h1>Expense Tracking System</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => {
          setEditingId(null);
          setForm(emptyForm);
          setStatus('');
        }}>
          + New Expense
        </button>
      </div>

      <div className="summary-grid">
        <div className="summary-card accent-green">
          <span>Total spend</span>
          <strong>{formatCurrency(summary.total)}</strong>
          <small>{expenses.length} recorded expenses</small>
        </div>
        <div className="summary-card accent-blue">
          <span>Average / expense</span>
          <strong>{formatCurrency(summary.average)}</strong>
          <small>Across all entries</small>
        </div>
        <div className="summary-card accent-purple">
          <span>Today</span>
          <strong>{formatCurrency(summary.todayTotal)}</strong>
          <small>Daily spending snapshot</small>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <h2>{editingId ? 'Edit expense' : 'Add expense'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="expense-form">
            <label>
              Expense title
              <input name="title" value={form.title} onChange={handleInputChange} placeholder="Groceries, travel, rent..." />
            </label>

            <div className="split-row">
              <label>
                Category
                <select name="category" value={form.category} onChange={handleInputChange}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>{category.value}</option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleInputChange} placeholder="0.00" />
              </label>
            </div>

            <div className="split-row">
              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={handleInputChange} />
              </label>

              <label>
                Payment type
                <select name="payment_method" value={form.payment_method} onChange={handleInputChange}>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </label>
            </div>

            <label>
              Notes
              <textarea name="note" value={form.note} onChange={handleInputChange} rows="3" placeholder="Optional notes" />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingId ? 'Save changes' : 'Add expense'}
              </button>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {status && <p className="form-status">{status}</p>}
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Category spend</h2>
          </div>

          {categoryEntries.length ? (
            <div className="category-list">
              {categoryEntries.map(([category, total]) => {
                const meta = getCategoryMeta(category);
                const percent = summary.total ? (total / summary.total) * 100 : 0;

                return (
                  <div key={category} className="category-item">
                    <div className="category-label-wrap">
                      <span className="category-badge" style={{ background: meta.color }}>{meta.icon}</span>
                      <span>{category}</span>
                    </div>
                    <div className="category-metric">
                      <strong>{formatCurrency(total)}</strong>
                      <small>{Math.round(percent)}%</small>
                    </div>
                    <div className="progress-bar">
                      <span style={{ width: `${percent}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No expense data yet. Add your first expense to get started.</p>
          )}
        </aside>
      </div>

      <section className="panel history-panel">
        <div className="panel-header">
          <h2>Daily transaction history</h2>
          {summary.largest.amount > 0 && (
            <span className="largest-tag">Largest: {summary.largest.title} — {formatCurrency(summary.largest.amount)}</span>
          )}
        </div>

        {loading ? (
          <p className="empty-state">Loading transactions...</p>
        ) : dailyHistory.length ? (
          <div className="history-list">
            {dailyHistory.map((entry) => (
              <div key={entry.date} className="history-day">
                <div className="history-date-row">
                  <strong>{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  <span>{formatCurrency(entry.total)}</span>
                </div>

                <div className="transaction-list">
                  {entry.items.map((item) => {
                    const meta = getCategoryMeta(item.category);
                    return (
                      <div key={item.id} className="transaction-item">
                        <div className="transaction-main">
                          <span className="category-badge small" style={{ background: meta.color }}>{meta.icon}</span>
                          <div>
                            <div className="transaction-title-row">
                              <h3>{item.title}</h3>
                              <span className="transaction-amount">-{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="transaction-meta">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{item.payment_method}</span>
                              {item.note && <><span>•</span><span>{item.note}</span></>}
                            </div>
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <button type="button" onClick={() => handleEdit(item)} className="icon-btn">Edit</button>
                          <button type="button" onClick={() => handleDelete(item.id)} className="icon-btn danger">Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No daily history available. Your transactions will appear here once added.</p>
        )}
      </section>
    </div>
  );
}

export default ExpenseTracker;
