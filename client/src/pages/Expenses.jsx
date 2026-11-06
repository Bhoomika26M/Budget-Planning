import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, ArrowLeft, Plus, Search, Pencil, Trash2,
  Receipt, TrendingDown, CalendarDays, RefreshCw,
  AlertCircle, CheckCircle2, X,
  Utensils, Car, GraduationCap, ShoppingBag, Clapperboard, HeartPulse, ReceiptText
} from 'lucide-react'
import api from '../services/api'
import './Expenses.css'

const CATEGORY_ICONS = {
  Food: Utensils,
  Transportation: Car,
  Education: GraduationCap,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Healthcare: HeartPulse,
  Bills: ReceiptText,
  Others: Wallet
}

const CATEGORIES = [
  'Food', 'Transportation', 'Education', 'Shopping',
  'Entertainment', 'Healthcare', 'Bills', 'Others'
]

const PAYMENT_METHODS = [
  'Cash', 'Debit Card', 'Credit Card', 'UPI / Online', 'Bank Transfer'
]

const initialForm = {
  title: '',
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  payment_method: 'Cash',
  description: ''
}

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({
    total_amount: 0,
    monthly_amount: 0,
    count: 0,
    category_totals: {}
  })
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [order, setOrder] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const month = new Date().toISOString().slice(0, 7)

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  const money = (value) =>
    `${symbols[currency] || '₹'}${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`

  const loadExpenses = async () => {
    setLoading(true)
    setError('')

    try {
      const [expenseResult, summaryResult] = await Promise.all([
        api.get('/expenses', {
          params: {
            category: category || undefined,
            payment_method: paymentMethod || undefined,
            search: search.trim() || undefined,
            sort_by: sortBy,
            order
          }
        }),
        api.get('/expenses/summary', { params: { month } })
      ])

      setExpenses(expenseResult.data)
      setSummary(summaryResult.data)

      try {
        const profile = await api.get('/profile')
        setCurrency(profile.data?.currency || 'INR')
      } catch {
        setCurrency('INR')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load expenses. Please check your connection and login.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [category, paymentMethod, sortBy, order])

  const openAdd = () => {
    setEditingId(null)
    setForm({
      ...initialForm,
      date: new Date().toISOString().slice(0, 10)
    })
    setError('')
    setShowModal(true)
  }

  const openEdit = (expense) => {
    setEditingId(expense.id)
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      payment_method: expense.payment_method,
      description: expense.description || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.title.trim() || Number(form.amount) <= 0) {
      setError('Enter a valid title and an amount greater than zero.')
      return
    }

    setSaving(true)

    const payload = {
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount),
      description: form.description.trim() || null
    }

    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload)
        setMessage('Expense updated successfully.')
      } else {
        await api.post('/expenses', payload)
        setMessage('Expense added successfully.')
      }

      setShowModal(false)
      setForm(initialForm)
      await loadExpenses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save expense.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"?`)) return

    try {
      await api.delete(`/expenses/${expense.id}`)
      setMessage('Expense deleted successfully.')
      await loadExpenses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete expense.')
    }
  }

  const categories = Object.entries(summary.category_totals || {})
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="expenses-page">
      <header className="expenses-header">
        <Link to="/dashboard" className="expenses-brand">
          <span className="expenses-brand-icon"><Wallet size={22} /></span>
          BudgetBuddy
        </Link>
        <Link to="/dashboard" className="expenses-back">
          <ArrowLeft size={17} /> Dashboard
        </Link>
      </header>

      <main className="expenses-main">
        <div className="expenses-heading">
          <div>
            <p className="expenses-eyebrow">FINANCIAL MANAGEMENT</p>
            <h1>Expense Management</h1>
            <p>Track, organize and understand where your money goes.</p>
          </div>
          <button className="expenses-primary-btn" onClick={openAdd}>
            <Plus size={18} /> Add Expense
          </button>
        </div>

        {message && (
          <div className="expenses-message success">
            <CheckCircle2 size={18} /> {message}
            <button onClick={() => setMessage('')}><X size={16} /></button>
          </div>
        )}

        {error && !showModal && (
          <div className="expenses-message error">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <section className="expenses-stats">
          <article className="expenses-stat-card">
            <div className="expenses-stat-top">
              <span>Total Expenses</span>
              <TrendingDown size={20} />
            </div>
            <h2>{money(summary.total_amount)}</h2>
            <p>All recorded transactions</p>
          </article>

          <article className="expenses-stat-card">
            <div className="expenses-stat-top">
              <span>This Month</span>
              <CalendarDays size={20} />
            </div>
            <h2>{money(summary.monthly_amount)}</h2>
            <p>Expenses recorded this month</p>
          </article>

          <article className="expenses-stat-card">
            <div className="expenses-stat-top">
              <span>Transactions</span>
              <Receipt size={20} />
            </div>
            <h2>{summary.count || 0}</h2>
            <p>Total recorded transactions</p>
          </article>
        </section>

        <section className="expenses-category-card">
          <h2>Spending by Category</h2>
          <p>Your expense distribution for {month}</p>

          {categories.length === 0 ? (
            <p className="expenses-empty-small">No category spending recorded.</p>
          ) : (
            <div className="expenses-category-list">
              {categories.map(([name, amount]) => {
                const percentage = summary.monthly_amount > 0
                  ? amount / summary.monthly_amount * 100 : 0

                return (
                  <div className="expenses-category-item" key={name}>
                    <div className="expenses-category-info">
                      <strong>{name}</strong>
                      <span>{money(amount)}</span>
                    </div>
                    <div className="expenses-progress-track">
                      <div
                        className="expenses-progress-fill"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <small>{percentage.toFixed(1)}%</small>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="expenses-transactions-card">
          <div className="expenses-section-title">
            <div>
              <h2>Recent Transactions</h2>
              <p>Manage all your recorded expenses.</p>
            </div>
            <button className="expenses-refresh-btn" onClick={loadExpenses} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <form className="expenses-filters" onSubmit={(e) => {
            e.preventDefault()
            loadExpenses()
          }}>
            <div className="expenses-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(item => <option key={item}>{item}</option>)}
            </select>

            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">All Payment Methods</option>
              {PAYMENT_METHODS.map(item => <option key={item}>{item}</option>)}
            </select>

            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sort, direction] = e.target.value.split('-')
                setSortBy(sort)
                setOrder(direction)
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            <button className="expenses-filter-btn" type="submit">
              <Search size={16} /> Search
            </button>
          </form>

          {loading ? (
            <div className="expenses-loading">
              <RefreshCw size={24} /> Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="expenses-empty">
              <Receipt size={42} />
              <h3>No expenses found</h3>
              <p>Add your first expense or change your filters.</p>
              <button className="expenses-primary-btn" onClick={openAdd}>
                <Plus size={17} /> Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="expenses-table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>
                        <strong>{expense.title}</strong>
                        {expense.description && <small>{expense.description}</small>}
                      </td>
                      <td><span className="expenses-category-badge">{React.createElement(CATEGORY_ICONS[expense.category] || Wallet, { size: 15 })}{expense.category}</span></td>
                      <td>{expense.date}</td>
                      <td>{expense.payment_method}</td>
                      <td className="expenses-amount">{money(expense.amount)}</td>
                      <td>
                        <div className="expenses-actions">
                          <button className="expenses-icon-btn edit" onClick={() => openEdit(expense)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button className="expenses-icon-btn delete" onClick={() => handleDelete(expense)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div className="expenses-modal-overlay">
          <div className="expenses-modal">
            <div className="expenses-modal-header">
              <div>
                <p className="expenses-eyebrow">TRANSACTION DETAILS</p>
                <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
              </div>
              <button className="expenses-icon-btn" onClick={() => setShowModal(false)} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="expenses-message error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="expenses-form-grid">
                <label className="expenses-form-full">
                  Expense Title *
                  <input name="title" value={form.title} onChange={handleChange} maxLength={150} required placeholder="e.g. Grocery shopping" />
                </label>

                <label>
                  Amount ({currency}) *
                  <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required />
                </label>

                <label>
                  Date *
                  <input name="date" type="date" value={form.date} onChange={handleChange} required />
                </label>

                <label>
                  Category *
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  Payment Method *
                  <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                    {PAYMENT_METHODS.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label className="expenses-form-full">
                  Description
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional notes..." />
                </label>
              </div>

              <div className="expenses-modal-actions">
                <button type="button" className="expenses-cancel-btn" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="expenses-primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses


