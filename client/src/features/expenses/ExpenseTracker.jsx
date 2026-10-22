import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from './expenseService';
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

function getLocalDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

const emptyForm = {
  title: '',
  category: 'Food',
  amount: '',
  date: getLocalDate(),
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
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getExpenses(token)
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data)) {
          throw new Error('The expense service returned an invalid response.');
        }
        setExpenses(data);
        setStatus('');
      }).catch((error) => {
        if (active) setStatus(error.message || 'Unable to fetch expenses.');
      }).finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function refreshExpenses() {
    try {
      const data = await getExpenses(token);
      if (!Array.isArray(data)) {
        throw new Error('The expense service returned an invalid response.');
      }
      setExpenses(data);
    } catch (error) {
      setStatus(error.message || 'Unable to fetch expenses.');
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
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setStatus('Please enter a title and a valid amount.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount,
      date: form.date,
      note: form.note.trim(),
      payment_method: form.payment_method,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateExpense(token, editingId, payload);
      } else {
        await createExpense(token, payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refreshExpenses();
      setStatus(editingId ? 'Expense updated.' : 'Expense added.');
    } catch (error) {
      setStatus(error.message || 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(expense) {
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
      await deleteExpense(token, id);
      await refreshExpenses();
      setStatus('Expense deleted.');
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
              <input name="title" value={form.title} onChange={handleInputChange} placeholder="Groceries, travel, rent..." maxLength="150" required />
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
                <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleInputChange} placeholder="0.00" required />
              </label>
            </div>

            <div className="split-row">
              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={handleInputChange} required />
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
              <textarea name="note" value={form.note} onChange={handleInputChange} rows="3" maxLength="255" placeholder="Optional notes" />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add expense'}
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
