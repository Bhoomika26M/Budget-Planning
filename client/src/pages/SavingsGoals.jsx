import { useEffect, useState } from 'react'
import './SavingsGoals.css'

const API_URL = 'http://127.0.0.1:8000/savings-goals'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="utility-icon">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="utility-icon">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="m15 9 5-5" />
      <path d="M16 4h4v4" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5Z" />
      <path d="M4 7h15" />
      <path d="M19 9h2v6h-2a3 3 0 0 1 0-6Z" />
      <circle cx="19" cy="12" r=".8" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="summary-icon">
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4" />
      <path d="M16 6h4v2a4 4 0 0 1-4 4" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
      <path d="M9 17h6" />
    </svg>
  )
}

function SavingsGoals() {
  const [showForm, setShowForm] = useState(false)
  /*const [darkMode, setDarkMode] = useState(false)*/

  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    savedAmount: '',
    targetDate: '',
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Failed to fetch savings goals')
      }

      const data = await response.json()
      setGoals(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError('')

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          target_amount: Number(formData.targetAmount),
          saved_amount: Number(formData.savedAmount || 0),
          target_date: formData.targetDate,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create savings goal')
      }

      const newGoal = await response.json()

      setGoals((currentGoals) => [...currentGoals, newGoal])

      setFormData({
        name: '',
        targetAmount: '',
        savedAmount: '',
        targetDate: '',
      })

      setShowForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const totalTarget = goals.reduce(
    (total, goal) => total + Number(goal.target_amount),
    0
  )

  const totalSaved = goals.reduce(
    (total, goal) => total + Number(goal.saved_amount),
    0
  )

  const completedGoals = goals.filter(
    (goal) => Number(goal.saved_amount) >= Number(goal.target_amount)
  ).length

  const achievedPercentage =
    totalTarget > 0
      ? Math.round((totalSaved / totalTarget) * 100)
      : 0

  return (
   /* <div className={`savings-page ${darkMode ? 'dark' : ''}`}>*/
   <div className="savings-page">

      {/* HEADER */}
      {/*<header className="top-header">

        <div className="page-title">
          <h1>Savings Goals</h1>
          <p>Work toward your financial goals</p>
        </div>'''

        <div className="header-actions">

          <div className="search-container">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search..."
            />
          </div>

          <button
            className="utility-button"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            <MoonIcon />
          </button>

          <button
            className="utility-button notification-button"
            title="Notifications"
          >
            <BellIcon />
            <span className="notification-dot"></span>
          </button>

          <button className="transaction-button">
            + Add Transaction
          </button>

        </div>
      </header>
*/}

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* SUMMARY CARDS */}
      <section className="summary-grid">

        <div className="summary-card">

          <div className="summary-icon-wrapper target">
            <TargetIcon />
          </div>

          <div>
            <p className="summary-label">Total Target</p>
            <h2>${totalTarget.toFixed(2)}</h2>
            <span>{goals.length} goals</span>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon-wrapper wallet">
            <WalletIcon />
          </div>

          <div>
            <p className="summary-label">Total Saved</p>
            <h2 className="green">${totalSaved.toFixed(2)}</h2>
            <span>{achievedPercentage}% achieved</span>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon-wrapper trophy">
            <TrophyIcon />
          </div>

          <div>
            <p className="summary-label">Completed</p>
            <h2 className="purple">{completedGoals}</h2>
            <span>of {goals.length} goals</span>
          </div>

        </div>

      </section>


      {/* SAVINGS GOALS */}
      <section className="goals-section">

        <div className="goals-header">

          <h2>My Savings Goals</h2>

          <button
            className="add-goal-button"
            onClick={() => setShowForm(true)}
          >
            + Add Goal
          </button>

        </div>


        {/* LOADING */}
        {loading && (
          <div className="empty-state">
            <h3>Loading savings goals...</h3>
          </div>
        )}


        {/* EMPTY STATE */}
        {!loading && goals.length === 0 && (

          <div className="empty-state">

            <div className="empty-icon">
              <TargetIcon />
            </div>

            <h3>No savings goals yet</h3>

            <p>
              Create your first savings goal to start tracking your progress.
            </p>

            <button
              className="create-goal-button"
              onClick={() => setShowForm(true)}
            >
              + Create Goal
            </button>

          </div>

        )}


        {/* GOALS */}
        {!loading && goals.length > 0 && (

          <div className="goals-list">

            {goals.map((goal) => {

              const target = Number(goal.target_amount)
              const saved = Number(goal.saved_amount)

              const progress =
                target > 0
                  ? Math.min((saved / target) * 100, 100)
                  : 0

              return (
                <div
                  className="summary-card"
                  key={goal.id}
                >
                  <div className="summary-icon-wrapper target">
                    <TargetIcon />
                  </div>

                  <div>
                    <h3>{goal.name}</h3>

                    <p>
                      ${saved.toFixed(2)} / ${target.toFixed(2)}
                    </p>

                    <div>
                      Progress: {Math.round(progress)}%
                    </div>

                    <span>
                      Target date: {goal.target_date}
                    </span>
                  </div>
                </div>
              )
            })}

          </div>

        )}

      </section>


      {/* ADD GOAL MODAL */}
      {showForm && (

        <div className="modal-overlay">

          <div className="goal-modal">

            <div className="modal-header">

              <h2>Add Savings Goal</h2>

              <button
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <label>Goal Name</label>

              <input
                type="text"
                name="name"
                placeholder="Example: Emergency Fund"
                value={formData.name}
                onChange={handleChange}
                required
              />


              <label>Target Amount</label>

              <input
                type="number"
                name="targetAmount"
                placeholder="1000"
                min="0"
                value={formData.targetAmount}
                onChange={handleChange}
                required
              />


              <label>Already Saved</label>

              <input
                type="number"
                name="savedAmount"
                placeholder="0"
                min="0"
                value={formData.savedAmount}
                onChange={handleChange}
              />


              <label>Target Date</label>

              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                required
              />


              <button
                type="submit"
                className="create-submit-button"
              >
                Create Goal
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default SavingsGoals