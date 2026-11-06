import React, { useEffect, useState } from 'react'
import {
  AlertCircle, CalendarDays, CheckCircle2, Pencil, PieChart,
  Plus, RefreshCw, Trash2, Wallet, X
} from 'lucide-react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import './Budget.css'

const CATEGORIES = [
  'Overall',
  'Food',
  'Transportation',
  'Education',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Bills',
  'Others'
]

const currentMonth = new Date().toISOString().slice(0, 7)
const initialForm = {
  category: 'Overall',
  month: currentMonth,
  amount_limit: ''
}

export default function Budget() {
  const [budgets, setBudgets] = useState([])
  const [month, setMonth] = useState(currentMonth)
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [form, setForm] = useState(initialForm)

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  const money = (value) => `${symbols[currency] || '₹'}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

  const loadBudgets = async () => {
    setLoading(true)
    setError('')
    try {
      const [budgetResult, profileResult] = await Promise.all([
        api.get('/budgets', { params: { month } }),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setBudgets(budgetResult.data)
      setCurrency(profileResult.data?.currency || 'INR')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load budgets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets()
  }, [month])

  const openAdd = () => {
    setEditingBudget(null)
    setForm({ ...initialForm, month })
    setError('')
    setShowModal(true)
  }

  const openEdit = (budget) => {
    setEditingBudget(budget)
    setForm({
      category: budget.category,
      month: budget.month,
      amount_limit: String(budget.amount_limit)
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.category || !/^\\d{4}-(0[1-9]|1[0-2])$/.test(form.month)) {
      setError('Choose a valid category and month.')
      return
    }
    if (!Number(form.amount_limit) || Number(form.amount_limit) <= 0) {
      setError('Amount limit must be greater than zero.')
      return
    }

    setSaving(true)
    try {
      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, {
          amount_limit: Number(form.amount_limit)
        })
        setMessage('Budget updated successfully.')
      } else {
        await api.post('/budgets', {
          category: form.category,
          month: form.month,
          amount_limit: Number(form.amount_limit)
        })
        setMessage('Budget added successfully.')
        if (form.month !== month) setMonth(form.month)
      }
      setShowModal(false)
      await loadBudgets()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save budget.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (budget) => {
    if (!window.confirm(`Delete the ${budget.category} budget of ${money(budget.amount_limit)}?`)) return
    try {
      await api.delete(`/budgets/${budget.id}`)
      setMessage('Budget deleted successfully.')
      await loadBudgets()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to delete budget.')
    }
  }

  const totalAllocated = budgets.reduce((total, budget) => total + Number(budget.amount_limit || 0), 0)
  const totalSpent = budgets.reduce((total, budget) => total + Number(budget.total_spent || 0), 0)
  const remaining = Math.max(totalAllocated - totalSpent, 0)

  return (
    <AppLayout>
      <div className="budget-page">
        <div className="budget-heading">
          <div>
            <p className="budget-eyebrow">FINANCIAL MANAGEMENT</p>
            <h1>Budget Planning</h1>
            <p>Set monthly limits and stay in control of your spending.</p>
          </div>
          <button className="budget-primary-btn" type="button" onClick={openAdd}>
            <Plus size={18} /> Add Budget
          </button>
        </div>

        <div className="budget-toolbar">
          <label htmlFor="budget-month">
            <CalendarDays size={17} />
            Budget month
          </label>
          <input
            id="budget-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <button className="budget-refresh-btn" type="button" onClick={loadBudgets} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {message && (
          <div className="budget-message success">
            <CheckCircle2 size={18} /> {message}
            <button type="button" onClick={() => setMessage('')}><X size={16} /></button>
          </div>
        )}
        {error && !showModal && (
          <div className="budget-message error"><AlertCircle size={18} /> {error}</div>
        )}

        <section className="budget-stats">
          <article className="budget-stat-card">
            <div className="budget-stat-top"><span>Total Allocated</span><Wallet size={20} /></div>
            <h2>{money(totalAllocated)}</h2>
            <p>Budget for {month}</p>
          </article>
          <article className="budget-stat-card spent">
            <div className="budget-stat-top"><span>Total Spent</span><PieChart size={20} /></div>
            <h2>{money(totalSpent)}</h2>
            <p>{totalAllocated > 0 ? `${Math.min(totalSpent / totalAllocated * 100, 100).toFixed(1)}% of allocation` : 'No allocation yet'}</p>
          </article>
          <article className="budget-stat-card remaining">
            <div className="budget-stat-top"><span>Remaining</span><CalendarDays size={20} /></div>
            <h2>{money(remaining)}</h2>
            <p>{totalSpent > totalAllocated ? 'Budget allocation exceeded' : 'Available to spend'}</p>
          </article>
        </section>

        <section className="budget-list-card">
          <div className="budget-section-title">
            <div>
              <h2>Category Budgets</h2>
              <p>Track spending against each monthly allocation.</p>
            </div>
          </div>

          {loading ? (
            <div className="budget-loading"><RefreshCw size={24} className="spin" /> Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="budget-empty">
              <PieChart size={38} />
              <h3>No budgets for this month</h3>
              <p>Create an overall or category budget to start planning.</p>
              <button className="budget-primary-btn" type="button" onClick={openAdd}><Plus size={17} /> Add Budget</button>
            </div>
          ) : (
            <div className="budget-grid">
              {budgets.map((budget) => {
                const usage = Number(budget.usage_percentage || 0)
                const status = usage >= 100 ? 'exceeded' : usage >= 80 ? 'warning' : 'healthy'
                return (
                  <article className={`budget-card ${status}`} key={budget.id}>
                    <div className="budget-card-header">
                      <div>
                        <h3>{budget.category}</h3>
                        <span className={`budget-status ${status}`}>
                          {usage >= 100 ? 'Limit exceeded' : usage >= 80 ? 'Approaching limit' : 'On track'}
                        </span>
                      </div>
                      <div className="budget-actions">
                        <button className="budget-icon-btn edit" type="button" aria-label={`Edit ${budget.category}`} onClick={() => openEdit(budget)}>
                          <Pencil size={16} />
                        </button>
                        <button className="budget-icon-btn delete" type="button" aria-label={`Delete ${budget.category}`} onClick={() => handleDelete(budget)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="budget-amounts">
                      <strong>{money(budget.amount_limit)}</strong>
                      <span>{usage.toFixed(1)}% used</span>
                    </div>
                    <div className="budget-progress-track">
                      <div
                        className="budget-progress-fill"
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>
                    <div className="budget-card-footer">
                      <span>Spent <strong>{money(budget.total_spent)}</strong></span>
                      <span>Remaining <strong>{money(budget.remaining_amount)}</strong></span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="budget-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowModal(false)
        }}>
          <div className="budget-modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
            <div className="budget-modal-header">
              <h2 id="budget-modal-title">{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <button className="budget-icon-btn" type="button" aria-label="Close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="budget-message error"><AlertCircle size={18} /> {error}</div>}
              <div className="budget-form-grid">
                <label>
                  Category
                  <select value={form.category} disabled={Boolean(editingBudget)} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Month
                  <input type="month" value={form.month} disabled={Boolean(editingBudget)} onChange={(event) => setForm({ ...form, month: event.target.value })} />
                </label>
                <label className="budget-form-full">
                  Amount Limit
                  <input type="number" min="0.01" step="0.01" value={form.amount_limit} onChange={(event) => setForm({ ...form, amount_limit: event.target.value })} placeholder="0.00" />
                </label>
              </div>
              <div className="budget-modal-actions">
                <button className="budget-secondary-btn" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="budget-primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingBudget ? 'Save Changes' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
