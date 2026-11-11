import React, { useEffect, useState } from 'react'
import {
  AlertCircle, CalendarDays, CheckCircle2, DollarSign, Pencil,
  Plus, RefreshCw, Search, Trash2, TrendingUp, Wallet, X
} from 'lucide-react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import './Income.css'

const SOURCES = [
  'Salary',
  'Pocket Money',
  'Scholarship',
  'Freelancing',
  'Business',
  'Other Income'
]

const initialForm = {
  source: 'Salary',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: ''
}

export default function Income() {
  const [income, setIncome] = useState([])
  const [summary, setSummary] = useState({
    total_amount: 0,
    this_month_total: 0,
    source_totals: {},
    count: 0,
    growth_percentage: 0
  })
  const [currency, setCurrency] = useState('INR')
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  const money = (value) => `${symbols[currency] || '₹'}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

  const loadIncome = async () => {
    setLoading(true)
    setError('')
    try {
      const [incomeResult, summaryResult, profileResult] = await Promise.all([
        api.get('/income', {
          params: {
            source: source || undefined,
            search: search.trim() || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            limit: 500
          }
        }),
        api.get('/income/summary'),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setIncome(incomeResult.data)
      setSummary(summaryResult.data)
      setCurrency(profileResult.data?.currency || 'INR')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load income records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncome()
  }, [source, startDate, endDate])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...initialForm, date: new Date().toISOString().slice(0, 10) })
    setError('')
    setShowModal(true)
  }

  const openEdit = (record) => {
    setEditingId(record.id)
    setForm({
      source: record.source,
      amount: String(record.amount),
      date: record.date,
      description: record.description || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.source || Number(form.amount) <= 0 || !form.date) {
      setError('Select a source and enter a valid date and amount greater than zero.')
      return
    }

    setSaving(true)
    const payload = {
      source: form.source,
      amount: Number(form.amount),
      date: form.date,
      description: form.description.trim() || null
    }

    try {
      if (editingId) {
        await api.put(`/income/${editingId}`, payload)
        setMessage('Income updated successfully.')
      } else {
        await api.post('/income', payload)
        setMessage('Income added successfully.')
      }
      setShowModal(false)
      await loadIncome()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save income.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete ${record.source} income of ${money(record.amount)}?`)) return
    try {
      await api.delete(`/income/${record.id}`)
      setMessage('Income deleted successfully.')
      await loadIncome()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to delete income.')
    }
  }

  const sourceTotals = Object.entries(summary.source_totals || {})
    .sort((a, b) => b[1] - a[1])

  return (
    <AppLayout>
      <div className="income-page">
        <div className="income-heading">
          <div>
            <p className="income-eyebrow">FINANCIAL MANAGEMENT</p>
            <h1>Income Management</h1>
            <p>Track, organize and understand every source of income.</p>
          </div>
          <button className="income-primary-btn" type="button" onClick={openAdd}>
            <Plus size={18} /> Add Income
          </button>
        </div>

        {message && (
          <div className="income-message success">
            <CheckCircle2 size={18} /> {message}
            <button type="button" onClick={() => setMessage('')}><X size={16} /></button>
          </div>
        )}
        {error && !showModal && (
          <div className="income-message error"><AlertCircle size={18} /> {error}</div>
        )}

        <section className="income-stats">
          <article className="income-stat-card">
            <div className="income-stat-top"><span>Total Income</span><DollarSign size={20} /></div>
            <h2>{money(summary.total_amount)}</h2>
            <p>{summary.count || 0} recorded transactions</p>
          </article>
          <article className="income-stat-card">
            <div className="income-stat-top"><span>This Month</span><CalendarDays size={20} /></div>
            <h2>{money(summary.this_month_total)}</h2>
            <p>{Number(summary.growth_percentage || 0) >= 0 ? '+' : ''}{summary.growth_percentage || 0}% vs last month</p>
          </article>
          <article className="income-stat-card">
            <div className="income-stat-top"><span>Income Sources</span><TrendingUp size={20} /></div>
            <h2>{sourceTotals.length}</h2>
            <p>Sources used this month</p>
          </article>
        </section>

        <section className="income-sources-card">
          <h2>Income by Source</h2>
          <p>Your income distribution for this month.</p>
          {sourceTotals.length === 0 ? (
            <p className="income-empty-small">No income recorded this month.</p>
          ) : (
            <div className="income-source-list">
              {sourceTotals.map(([name, amount]) => (
                <div className="income-source-item" key={name}>
                  <div className="income-source-info"><strong>{name}</strong><span>{money(amount)}</span></div>
                  <div className="income-progress-track">
                    <div
                      className="income-progress-fill"
                      style={{ width: `${summary.this_month_total > 0 ? amount / summary.this_month_total * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="income-history-card">
          <div className="income-section-title">
            <div><h2>Income History</h2><p>Review and manage your income records.</p></div>
            <button className="income-refresh-btn" type="button" onClick={loadIncome} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          <form
            className="income-filters"
            onSubmit={(event) => {
              event.preventDefault()
              loadIncome()
            }}
          >
            <div className="income-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search income..." />
            </div>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">All Sources</option>
              {SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="date" aria-label="Start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <input type="date" aria-label="End date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
            <button className="income-filter-btn" type="submit">Apply</button>
          </form>

          {loading ? (
            <div className="income-loading"><RefreshCw size={24} className="spin" /> Loading income...</div>
          ) : income.length === 0 ? (
            <div className="income-empty">
              <Wallet size={38} />
              <h3>No income found</h3>
              <p>Adjust the filters or add your first income record.</p>
              <button className="income-primary-btn" type="button" onClick={openAdd}><Plus size={17} /> Add Income</button>
            </div>
          ) : (
            <div className="income-table-wrapper">
              <table className="income-table">
                <thead><tr><th>Source</th><th>Date</th><th>Notes</th><th>Amount</th><th>Actions</th></tr></thead>
                <tbody>
                  {income.map((record) => (
                    <tr key={record.id}>
                      <td><span className="income-source-badge">{record.source}</span></td>
                      <td>{new Date(`${record.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{record.description || '—'}</td>
                      <td className="income-amount">+{money(record.amount)}</td>
                      <td>
                        <div className="income-actions">
                          <button className="income-icon-btn edit" type="button" aria-label={`Edit ${record.source}`} onClick={() => openEdit(record)}><Pencil size={16} /></button>
                          <button className="income-icon-btn delete" type="button" aria-label={`Delete ${record.source}`} onClick={() => handleDelete(record)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="income-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowModal(false)
        }}>
          <div className="income-modal" role="dialog" aria-modal="true" aria-labelledby="income-modal-title">
            <div className="income-modal-header">
              <h2 id="income-modal-title">{editingId ? 'Edit Income' : 'Add Income'}</h2>
              <button className="income-icon-btn" type="button" aria-label="Close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="income-message error"><AlertCircle size={18} /> {error}</div>}
              <div className="income-form-grid">
                <label>Income Source
                  <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
                    {SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>Amount
                  <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" />
                </label>
                <label className="income-form-full">Date
                  <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </label>
                <label className="income-form-full">Description
                  <textarea rows="3" maxLength="500" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Optional note" />
                </label>
              </div>
              <div className="income-modal-actions">
                <button className="income-secondary-btn" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="income-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Income'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
