import React, { useEffect, useState } from 'react'
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Coins,
  Goal, Landmark, Pencil, Plus, RefreshCw, Target, Trash2, X
} from 'lucide-react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import './Savings.css'

const CATEGORIES = [
  'Emergency Fund', 'Education', 'Travel', 'Laptop',
  'Phone', 'Vehicle', 'Home', 'Investments', 'Other'
]

const initialGoalForm = {
  title: '',
  target_amount: '',
  target_date: '',
  category: 'Emergency Fund',
  initial_deposit: ''
}

const initialContributionForm = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  notes: ''
}

export default function Savings() {
  const { role } = useAuth()
  const [goals, setGoals] = useState([])
  const [currency, setCurrency] = useState('INR')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [goalForm, setGoalForm] = useState(initialGoalForm)
  const [contributionGoal, setContributionGoal] = useState(null)
  const [contributionForm, setContributionForm] = useState(initialContributionForm)
  const [expandedGoal, setExpandedGoal] = useState(null)

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  const money = (value) => `${symbols[currency] || '₹'}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

  const loadGoals = async () => {
    setLoading(true)
    setError('')
    try {
      const [goalsResult, profileResult] = await Promise.all([
        api.get('/savings'),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setGoals(goalsResult.data || [])
      setCurrency(profileResult.data?.currency || 'INR')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load savings goals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [statusFilter])

  const activeGoals = goals.filter((goal) => goal.status !== 'completed')
  const completedGoals = goals.filter((goal) => goal.status === 'completed')
  const visibleGoals = statusFilter === 'all'
    ? goals
    : goals.filter((goal) => statusFilter === 'completed' ? goal.status === 'completed' : goal.status !== 'completed')
  const totalSaved = goals.reduce((total, goal) => total + Number(goal.saved_amount || 0), 0)
  const totalTarget = goals.reduce((total, goal) => total + Number(goal.target_amount || 0), 0)
  const totalRemaining = Math.max(totalTarget - totalSaved, 0)
  const overallProgress = totalTarget > 0 ? Math.min(totalSaved / totalTarget * 100, 100) : 0
  const isStudent = role === 'student'
  const activeLimitReached = isStudent && activeGoals.length >= 3

  const openAddGoal = () => {
    if (activeLimitReached) return
    setEditingGoal(null)
    setGoalForm(initialGoalForm)
    setError('')
    setShowGoalModal(true)
  }

  const openEditGoal = (goal) => {
    setEditingGoal(goal)
    setGoalForm({
      title: goal.title,
      target_amount: String(goal.target_amount),
      target_date: goal.target_date || '',
      category: goal.category || 'Other',
      initial_deposit: ''
    })
    setError('')
    setShowGoalModal(true)
  }

  const handleGoalSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!goalForm.title.trim()) {
      setError('Enter a goal title.')
      return
    }
    if (!Number(goalForm.target_amount) || Number(goalForm.target_amount) <= 0) {
      setError('Target amount must be greater than zero.')
      return
    }
    if (!editingGoal && Number(goalForm.initial_deposit || 0) < 0) {
      setError('Initial deposit cannot be negative.')
      return
    }

    setSaving(true)
    try {
      if (editingGoal) {
        await api.put(`/savings/${editingGoal.id}`, {
          title: goalForm.title.trim(),
          target_amount: Number(goalForm.target_amount),
          target_date: goalForm.target_date || null,
          category: goalForm.category
        })
        setMessage('Savings goal updated successfully.')
      } else {
        await api.post('/savings', {
          title: goalForm.title.trim(),
          target_amount: Number(goalForm.target_amount),
          target_date: goalForm.target_date || null,
          category: goalForm.category,
          initial_deposit: Number(goalForm.initial_deposit || 0)
        })
        setMessage('Savings goal created successfully.')
      }
      setShowGoalModal(false)
      await loadGoals()
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(Array.isArray(detail) ? detail[0]?.msg || 'Unable to save savings goal.' : detail || 'Unable to save savings goal.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete the savings goal "${goal.title}"?`)) return
    try {
      await api.delete(`/savings/${goal.id}`)
      setMessage('Savings goal deleted successfully.')
      await loadGoals()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to delete savings goal.')
    }
  }

  const openContribution = (goal) => {
    setContributionGoal(goal)
    setContributionForm(initialContributionForm)
    setError('')
  }

  const handleContributionSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!Number(contributionForm.amount) || Number(contributionForm.amount) <= 0) {
      setError('Contribution amount must be greater than zero.')
      return
    }
    if (!contributionForm.date) {
      setError('Choose a contribution date.')
      return
    }

    setSaving(true)
    try {
      await api.post(`/savings/${contributionGoal.id}/contribute`, {
        amount: Number(contributionForm.amount),
        date: contributionForm.date,
        notes: contributionForm.notes.trim() || null
      })
      setMessage('Contribution added successfully.')
      setContributionGoal(null)
      await loadGoals()
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(Array.isArray(detail) ? detail[0]?.msg || 'Unable to add contribution.' : detail || 'Unable to add contribution.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="savings-page">
        <div className="savings-heading">
          <div>
            <p className="savings-eyebrow">FINANCIAL MANAGEMENT</p>
            <h1>Savings Goals</h1>
            <p>Turn your targets into achievable milestones.</p>
          </div>
          <button className="savings-primary-btn" type="button" onClick={openAddGoal} disabled={activeLimitReached}>
            <Plus size={18} /> Add Goal
          </button>
        </div>

        {isStudent && activeLimitReached && (
          <div className="savings-limit-message">
            <AlertCircle size={18} />
            <span>Student accounts can keep 3 active savings goals. Complete a goal or upgrade to Premium to add another.</span>
          </div>
        )}

        {message && (
          <div className="savings-message success">
            <CheckCircle2 size={18} /> {message}
            <button type="button" onClick={() => setMessage('')}><X size={16} /></button>
          </div>
        )}
        {error && !showGoalModal && !contributionGoal && (
          <div className="savings-message error"><AlertCircle size={18} /> {error}</div>
        )}

        <section className="savings-overview">
          <article className="savings-stat-card">
            <div><span>Total Saved</span><Coins size={19} /></div>
            <h2>{money(totalSaved)}</h2>
            <p>Across all goals</p>
          </article>
          <article className="savings-stat-card">
            <div><span>Total Target</span><Target size={19} /></div>
            <h2>{money(totalTarget)}</h2>
            <p>{goals.length} savings {goals.length === 1 ? 'goal' : 'goals'}</p>
          </article>
          <article className="savings-stat-card">
            <div><span>Remaining</span><Landmark size={19} /></div>
            <h2>{money(totalRemaining)}</h2>
            <p>Still to save</p>
          </article>
          <article className="savings-stat-card">
            <div><span>Goal Status</span><Goal size={19} /></div>
            <h2>{activeGoals.length} active</h2>
            <p>{completedGoals.length} completed</p>
          </article>
        </section>

        <section className="savings-progress-card">
          <div>
            <strong>Overall savings progress</strong>
            <span>{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="savings-progress-track">
            <div className="savings-progress-fill" style={{ width: `${overallProgress}%` }} />
          </div>
        </section>

        <section className="savings-list-card">
          <div className="savings-section-header">
            <div>
              <h2>Your Goals</h2>
              <p>Review progress and add contributions.</p>
            </div>
            <div className="savings-filter" aria-label="Filter goals">
              <button className={statusFilter === 'all' ? 'active' : ''} type="button" onClick={() => setStatusFilter('all')}>All</button>
              <button className={statusFilter === 'in_progress' ? 'active' : ''} type="button" onClick={() => setStatusFilter('in_progress')}>Active</button>
              <button className={statusFilter === 'completed' ? 'active' : ''} type="button" onClick={() => setStatusFilter('completed')}>Completed</button>
            </div>
          </div>

          {loading ? (
            <div className="savings-loading"><RefreshCw size={24} className="spin" /> Loading savings goals...</div>
          ) : visibleGoals.length === 0 ? (
            <div className="savings-empty">
              <Target size={40} />
              <h3>No savings goals yet</h3>
              <p>Create your first goal and start building toward it.</p>
              <button className="savings-primary-btn" type="button" onClick={openAddGoal} disabled={activeLimitReached}>
                <Plus size={17} /> Create Goal
              </button>
            </div>
          ) : (
            <div className="savings-grid">
              {visibleGoals.map((goal) => {
                const reached = Number(goal.saved_amount || 0) >= Number(goal.target_amount || 0)
                const completed = goal.status === 'completed' || reached
                const percentage = Math.min(Number(goal.completion_percentage || (Number(goal.target_amount) ? Number(goal.saved_amount) / Number(goal.target_amount) * 100 : 0)), 100)
                const expanded = expandedGoal === goal.id
                const contributions = [...(goal.contributions || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))
                return (
                  <article className={`savings-goal-card ${completed ? 'completed' : ''}`} key={goal.id}>
                    <div className="savings-goal-header">
                      <div>
                        <span className="savings-category">{goal.category || 'Other'}</span>
                        <h3>{goal.title}</h3>
                      </div>
                      <div className="savings-actions">
                        <button className="savings-icon-btn edit" type="button" aria-label={`Edit ${goal.title}`} onClick={() => openEditGoal(goal)}>
                          <Pencil size={16} />
                        </button>
                        <button className="savings-icon-btn delete" type="button" aria-label={`Delete ${goal.title}`} onClick={() => handleDelete(goal)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {completed ? (
                      <div className="savings-completed"><CheckCircle2 size={16} /> Goal completed</div>
                    ) : goal.target_date ? (
                      <p className="savings-target-date">Target date: {new Date(`${goal.target_date}T00:00:00`).toLocaleDateString()}</p>
                    ) : null}

                    <div className="savings-amounts">
                      <strong>{money(goal.saved_amount)}</strong>
                      <span>of {money(goal.target_amount)}</span>
                    </div>
                    <div className="savings-progress-track">
                      <div className="savings-progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="savings-goal-footer">
                      <span><strong>{percentage.toFixed(1)}%</strong> complete</span>
                      <span>Remaining <strong>{money(goal.remaining_amount ?? Math.max(Number(goal.target_amount) - Number(goal.saved_amount), 0))}</strong></span>
                    </div>

                    {!completed && (
                      <button className="savings-contribute-btn" type="button" onClick={() => openContribution(goal)}>
                        <Plus size={16} /> Add Contribution
                      </button>
                    )}

                    <button className="savings-history-toggle" type="button" onClick={() => setExpandedGoal(expanded ? null : goal.id)}>
                      Contribution history ({contributions.length})
                      {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>
                    {expanded && (
                      <div className="savings-history">
                        {contributions.length === 0 ? (
                          <p>No contributions yet.</p>
                        ) : contributions.map((contribution) => (
                          <div className="savings-contribution" key={contribution.id}>
                            <div>
                              <strong>{money(contribution.amount)}</strong>
                              <span>{contribution.notes || 'Contribution'}</span>
                            </div>
                            <time>{contribution.date}</time>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showGoalModal && (
        <div className="savings-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowGoalModal(false)
        }}>
          <div className="savings-modal" role="dialog" aria-modal="true" aria-labelledby="savings-goal-modal-title">
            <div className="savings-modal-header">
              <h2 id="savings-goal-modal-title">{editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}</h2>
              <button className="savings-icon-btn" type="button" aria-label="Close" onClick={() => setShowGoalModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleGoalSubmit}>
              {error && <div className="savings-message error"><AlertCircle size={18} /> {error}</div>}
              <div className="savings-form-grid">
                <label className="savings-form-full">
                  Goal Title
                  <input value={goalForm.title} onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })} placeholder="e.g. Emergency fund" />
                </label>
                <label>
                  Target Amount
                  <input type="number" min="0.01" step="0.01" value={goalForm.target_amount} onChange={(event) => setGoalForm({ ...goalForm, target_amount: event.target.value })} placeholder="0.00" />
                </label>
                <label>
                  Target Date
                  <input type="date" value={goalForm.target_date} onChange={(event) => setGoalForm({ ...goalForm, target_date: event.target.value })} />
                </label>
                <label>
                  Category
                  <select value={goalForm.category} onChange={(event) => setGoalForm({ ...goalForm, category: event.target.value })}>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                {!editingGoal && (
                  <label>
                    Initial Deposit <span>(optional)</span>
                    <input type="number" min="0" step="0.01" value={goalForm.initial_deposit} onChange={(event) => setGoalForm({ ...goalForm, initial_deposit: event.target.value })} placeholder="0.00" />
                  </label>
                )}
              </div>
              <div className="savings-modal-actions">
                <button className="savings-secondary-btn" type="button" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button className="savings-primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contributionGoal && (
        <div className="savings-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setContributionGoal(null)
        }}>
          <div className="savings-modal" role="dialog" aria-modal="true" aria-labelledby="contribution-modal-title">
            <div className="savings-modal-header">
              <h2 id="contribution-modal-title">Add Contribution</h2>
              <button className="savings-icon-btn" type="button" aria-label="Close" onClick={() => setContributionGoal(null)}><X size={18} /></button>
            </div>
            <p className="savings-contribution-goal">{contributionGoal.title}</p>
            <form onSubmit={handleContributionSubmit}>
              {error && <div className="savings-message error"><AlertCircle size={18} /> {error}</div>}
              <div className="savings-form-grid">
                <label>
                  Amount
                  <input type="number" min="0.01" step="0.01" value={contributionForm.amount} onChange={(event) => setContributionForm({ ...contributionForm, amount: event.target.value })} placeholder="0.00" />
                </label>
                <label>
                  Date
                  <input type="date" value={contributionForm.date} onChange={(event) => setContributionForm({ ...contributionForm, date: event.target.value })} />
                </label>
                <label className="savings-form-full">
                  Notes <span>(optional)</span>
                  <input value={contributionForm.notes} onChange={(event) => setContributionForm({ ...contributionForm, notes: event.target.value })} placeholder="Monthly savings contribution" />
                </label>
              </div>
              <div className="savings-modal-actions">
                <button className="savings-secondary-btn" type="button" onClick={() => setContributionGoal(null)}>Cancel</button>
                <button className="savings-primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
