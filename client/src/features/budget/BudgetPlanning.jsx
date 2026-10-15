import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import {
  createBudget,
  deleteBudget,
  getBudgetAlerts,
  getBudgets,
} from './budgetService.js'

const PRESET_CATS = [
  { name: 'Food & Dining', icon: '🍽️', color: '#4F93A0' },
  { name: 'Transportation', icon: '🚗', color: '#166879' },
  { name: 'Education', icon: '📚', color: '#22C55E' },
  { name: 'Groceries', icon: '🛒', color: '#86B4C1' },
  { name: 'Entertainment', icon: '🎬', color: '#F4B400' },
  { name: 'Shopping', icon: '🛍️', color: '#EF4444' },
  { name: 'Health', icon: '💊', color: '#8B5CF6' },
  { name: 'Utilities', icon: '💡', color: '#EC4899' },
  { name: 'Rent', icon: '🏠', color: '#6B7280' },
]

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatBudget(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`
}

function hexWithAlpha(hex, alpha) {
  const clean = hex.replace('#', '')

  if (clean.length !== 6) {
    return `rgba(79,147,160,${alpha})`
  }

  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)

  return `rgba(${r},${g},${b},${alpha})`
}

export default function BudgetPlanning() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)

  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#4F93A0')
  const [usePreset, setUsePreset] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])

  const loadBudgets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [budgetData, alertData] = await Promise.all([
        getBudgets(),
        getBudgetAlerts(),
      ])

      setCategories(budgetData)
      setAlerts(alertData)
    } catch (requestError) {
      setError(requestError.message || 'Failed to load budgets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  const totalBudget = useMemo(
    () =>
      categories.reduce(
        (sum, category) => sum + Number(category.budget),
        0,
      ),
    [categories],
  )

  const totalSpent = useMemo(
    () =>
      categories.reduce(
        (sum, category) => sum + Number(category.spent),
        0,
      ),
    [categories],
  )

  const remaining = totalBudget - totalSpent

  const remainingPercent =
    totalBudget > 0
      ? Math.round((remaining / totalBudget) * 100)
      : 0

  const resetForm = () => {
    setName('')
    setBudget('')
    setIcon('📦')
    setColor('#4F93A0')
    setUsePreset(null)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    resetForm()
  }

  const handleAdd = async (event) => {
    event.preventDefault()

    const numericBudget = Number(budget)

    if (
      !name.trim() ||
      !Number.isFinite(numericBudget) ||
      numericBudget <= 0
    ) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await createBudget({
        name: name.trim(),
        budget: numericBudget,
        icon: icon.trim() || '📦',
        color,
      })

      setShowModal(false)
      resetForm()

      await loadBudgets()
    } catch (requestError) {
      setError(requestError.message || 'Failed to create budget.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setError('')

    try {
      await deleteBudget(id)
      await loadBudgets()
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete budget.')
    }
  }

  const selectPreset = (preset) => {
    setUsePreset(preset.name)
    setName(preset.name)
    setIcon(preset.icon)
    setColor(preset.color)
  }

  return (
    <main className="budget-page">
      <div className="budget-content">
        {error && (
          <div className="budget-error" role="alert">
            <span>{error}</span>

            <button type="button" onClick={loadBudgets}>
              Retry
            </button>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="budget-alerts" role="alert">
            <Icon name="bell" size={16} />

            <div>
              {alerts.map((alert) => (
                <div key={alert.id}>
                  <strong>{alert.name}</strong>: {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <section
          className="budget-summary-grid"
          aria-label="Budget summary"
        >
          <div className="solid-card summary-card">
            <div className="summary-label">
              Total Budget
            </div>

            <div className="summary-value teal">
              {formatMoney(totalBudget)}
            </div>

            <div className="summary-sub">
              {categories.length} categories
            </div>
          </div>

          <div className="solid-card summary-card">
            <div className="summary-label">
              Total Spent
            </div>

            <div className="summary-value red">
              {formatMoney(totalSpent)}
            </div>

            <div className="summary-sub">
              Across all budgets
            </div>
          </div>

          <div className="solid-card summary-card">
            <div className="summary-label">
              Remaining
            </div>

            <div className="summary-value green">
              {formatMoney(remaining)}
            </div>

            <div className="summary-sub">
              {remainingPercent}% of budget left
            </div>
          </div>
        </section>

        <section className="solid-card budget-categories-card">
          <div className="budget-categories-heading">
            <div className="budget-section-title">
              Budget Categories
            </div>

            <button
              className="add-budget-button"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <Icon name="plus" size={14} />
              Add Budget
            </button>
          </div>

          {loading ? (
            <div className="budget-state">
              Loading budgets...
            </div>
          ) : categories.length === 0 ? (
            <div className="budget-state">
              <div className="empty-icon">
                📊
              </div>

              <div className="empty-title">
                No budgets created
              </div>

              <div>
                Add budget categories to track how you
                spend against your limits.
              </div>
            </div>
          ) : (
            <div className="budget-category-list">
              {categories.map((category) => {
                const categoryBudget = Number(category.budget)
                const spent = Number(category.spent)

                const rawPercent =
                  categoryBudget > 0
                    ? (spent / categoryBudget) * 100
                    : 0

                const percent = Math.min(
                  100,
                  Math.max(0, rawPercent),
                )

                const barColor =
                  rawPercent >= 90
                    ? '#EF4444'
                    : rawPercent >= 70
                      ? '#F4B400'
                      : '#22C55E'

                return (
                  <article
                    className="budget-category"
                    key={category.id}
                    style={{
                      borderColor: hexWithAlpha(
                        category.color,
                        0.16,
                      ),
                    }}
                  >
                    <div className="category-topline">
                      <div className="category-identity">
                        <div
                          className="category-icon"
                          style={{
                            background: hexWithAlpha(
                              category.color,
                              0.09,
                            ),
                          }}
                        >
                          {category.icon}
                        </div>

                        <div>
                          <div className="category-name">
                            {category.name}
                          </div>

                          <div className="category-budget">
                            Budget: {formatBudget(categoryBudget)}
                          </div>
                        </div>
                      </div>

                      <div className="category-spent-wrap">
                        <div className="category-spent">
                          <div
                            className="spent-value"
                            style={{ color: barColor }}
                          >
                            {formatMoney(spent)}
                          </div>

                          <div className="used-percent">
                            {Math.max(
                              0,
                              rawPercent,
                            ).toFixed(0)}
                            % used
                          </div>
                        </div>

                        <button
                          className="delete-budget-button"
                          type="button"
                          title={`Delete ${category.name}`}
                          aria-label={`Delete ${category.name}`}
                          onClick={() =>
                            handleDelete(category.id)
                          }
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percent}%`,
                          background: barColor,
                        }}
                      />
                    </div>

                    <div className="category-footer">
                      <span>
                        Spent {formatMoney(spent)}
                      </span>

                      <span>
                        Remaining{' '}
                        {formatMoney(
                          categoryBudget - spent,
                        )}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="budget-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-heading">
              <h2>Add Budget Category</h2>

              <button
                type="button"
                className="close-modal"
                onClick={closeModal}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="quick-select-label">
                Quick Select
              </div>

              <div className="preset-list">
                {PRESET_CATS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={`preset-button ${
                      usePreset === preset.name
                        ? 'selected'
                        : ''
                    }`}
                    style={
                      usePreset === preset.name
                        ? {
                            color: preset.color,
                            borderColor: preset.color,
                            background:
                              hexWithAlpha(
                                preset.color,
                                0.09,
                              ),
                          }
                        : undefined
                    }
                    onClick={() =>
                      selectPreset(preset)
                    }
                  >
                    {preset.icon} {preset.name}
                  </button>
                ))}
              </div>

              <div className="budget-form-fields">
                <label>
                  <span>Category Name *</span>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="e.g. Food & Dining"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  <span>
                    Monthly Budget ($) *
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={budget}
                    onChange={(event) =>
                      setBudget(event.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </label>

                <div className="form-two-columns">
                  <label>
                    <span>Icon (emoji)</span>

                    <input
                      value={icon}
                      onChange={(event) =>
                        setIcon(event.target.value)
                      }
                      placeholder="📦"
                      maxLength={8}
                    />
                  </label>

                  <label>
                    <span>Color</span>

                    <input
                      className="color-input"
                      type="color"
                      value={color}
                      onChange={(event) =>
                        setColor(event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="confirm-button"
                  disabled={
                    saving ||
                    !name.trim() ||
                    !budget ||
                    Number(budget) <= 0
                  }
                >
                  {saving
                    ? 'Adding...'
                    : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}