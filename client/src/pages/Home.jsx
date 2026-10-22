
import { useEffect, useState } from 'react'
import './Home.css'

const API_BASE = 'http://127.0.0.1:8000'

const transactions = [
  { icon: '🍔', name: 'Swiggy Order', category: 'Food', date: 'Today', amount: 450 },
  { icon: '💼', name: 'Salary Credit', category: 'Income', date: 'Jun 1', amount: 52000, income: true },
  { icon: '📺', name: 'Netflix', category: 'Bills', date: 'May 31', amount: 499 },
  { icon: '⛽', name: 'Petrol', category: 'Transport', date: 'May 30', amount: 2200 },
  { icon: '📦', name: 'Amazon', category: 'Shopping', date: 'May 28', amount: 1850 },
]

const months = [
  { name: 'Jan', income: 48, expense: 32 },
  { name: 'Feb', income: 48, expense: 36 },
  { name: 'Mar', income: 52, expense: 39 },
  { name: 'Apr', income: 48, expense: 34 },
  { name: 'May', income: 48, expense: 37 },
  { name: 'Jun', income: 58, expense: 39 },
]

const categories = [
  { name: 'Food', amount: 8000, color: '#2864ed' },
  { name: 'Transport', amount: 3500, color: '#16a34a' },
  { name: 'Shopping', amount: 6000, color: '#ff9900' },
  { name: 'Bills', amount: 5200, color: '#8b5cf6' },
  { name: 'Others', amount: 2000, color: '#ef4444' },
]

const menuItems = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Profile', icon: '♙' },
  { name: 'Expenses', icon: '↘' },
  { name: 'Income', icon: '↗' },
  { name: 'Budget Planning', icon: '▤' },
  { name: 'Savings Goals', icon: '◎' },
  { name: 'Analytics', icon: '▥' },
  { name: 'Notifications', icon: '♧' },
  { name: 'Reports', icon: '▧' },
  { name: 'Settings', icon: '⚙' },
]

function formatRupees(amount) {
  return `₹${Number(amount ?? 0).toLocaleString('en-IN')}`
}

function StudentDashboard({ data }) {
  const budget = data.total_budget
  const spend = data.total_spend
  const remaining = data.remaining_budget
  const spentPercent = budget > 0 ? (spend / budget) * 100 : 0
  const remainingPercent = budget > 0 ? (remaining / budget) * 100 : 0

  return (
    <>
      <section className="summary-cards">
        <article className="summary-card blue-card">
          <div className="card-label">Total Budget <span>₹</span></div>
          <h2>{formatRupees(budget)}</h2>
          <p>This Month</p>
        </article>

        <article className="summary-card green-card">
          <div className="card-label">Total Spend <span>↘</span></div>
          <h2>{formatRupees(spend)}</h2>
          <p>{spentPercent.toFixed(1)}% of budget</p>
        </article>

        <article className="summary-card purple-card">
          <div className="card-label">Remaining Budget <span>▣</span></div>
          <h2>{formatRupees(remaining)}</h2>
          <p>{remainingPercent.toFixed(1)}% remaining</p>
        </article>

        <article className="summary-card yellow-card">
          <div className="card-label">Budget Alerts <span>⚠</span></div>
          <h2>{spentPercent >= 80 ? 'Warning' : '2 Alerts'}</h2>
          <p>Review your spending</p>
        </article>
      </section>

      <section className="dashboard-charts">
        <article className="dashboard-panel income-panel">
          <div className="panel-heading">
            <h3>Income vs Expenses</h3>
            <span>Last 6 months · Sample data</span>
          </div>

          <div className="bar-chart">
            <div className="chart-labels">
              <span>₹60k</span><span>₹45k</span><span>₹30k</span>
              <span>₹15k</span><span>₹0k</span>
            </div>

            <div className="bar-chart-content">
              {months.map((month) => (
                <div className="month-column" key={month.name}>
                  <div className="bars">
                    <div
                      className="income-bar"
                      style={{ height: `${month.income * 2.1}px` }}
                      title={`Income ₹${month.income},000`}
                    />
                    <div
                      className="expense-bar"
                      style={{ height: `${month.expense * 2.1}px` }}
                      title={`Expenses ₹${month.expense},000`}
                    />
                  </div>
                  <span>{month.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-legend">
            <span><i className="legend-income" /> Income</span>
            <span><i className="legend-expense" /> Expenses</span>
          </div>
        </article>

        <article className="dashboard-panel spending-panel">
          <h3>Spending by Category</h3>
          <div className="donut-chart" role="img" aria-label="Sample spending by category chart">
            <div className="donut-hole" />
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <div className="category-row" key={category.name}>
                <span className="category-name">
                  <i style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
                <strong>{formatRupees(category.amount)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panel transactions-panel">
        <div className="panel-heading">
          <h3>Recent Transactions</h3>
          <span>Sample data</span>
        </div>

        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div className="transaction-row" key={transaction.name}>
              <div className="transaction-icon">{transaction.icon}</div>
              <div className="transaction-details">
                <strong>{transaction.name}</strong>
                <span>{transaction.category}</span>
              </div>
              <span className="transaction-date">{transaction.date}</span>
              <strong className={transaction.income ? 'income-amount' : 'transaction-amount'}>
                {transaction.income ? '+' : '-'}{formatRupees(transaction.amount)}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function AdminDashboard({ data }) {
  return (
    <>
      <section className="summary-cards">
        <article className="summary-card blue-card">
          <div className="card-label">Total Users</div>
          <h2>{data.total_users}</h2>
          <p>Sample server data</p>
        </article>

        <article className="summary-card green-card">
          <div className="card-label">Student Accounts</div>
          <h2>{data.student_accounts}</h2>
          <p>Sample server data</p>
        </article>

        <article className="summary-card purple-card">
          <div className="card-label">Premium Users</div>
          <h2>{data.premium_accounts}</h2>
          <p>Sample server data</p>
        </article>

        <article className="summary-card yellow-card">
          <div className="card-label">Platform Status</div>
          <h2>Active</h2>
          <p>API connected</p>
        </article>
      </section>

      <section className="dashboard-panel">
        <h3>Platform Overview</h3>
        <p>Review user accounts, platform activity, and reports.</p>
        <p>The user counts currently come from sample API responses.</p>
      </section>
    </>
  )
}

function PremiumDashboard({ data }) {
  return (
    <>
      <section className="summary-cards">
        <article className="summary-card blue-card">
          <div className="card-label">Total Budget</div>
          <h2>{formatRupees(data.total_budget)}</h2>
          <p>This month</p>
        </article>

        <article className="summary-card green-card">
          <div className="card-label">Total Spend</div>
          <h2>{formatRupees(data.total_spend)}</h2>
          <p>
            {data.total_budget > 0
              ? `${((data.total_spend / data.total_budget) * 100).toFixed(1)}% of budget`
              : 'No budget set'}
          </p>
        </article>

        <article className="summary-card purple-card">
          <div className="card-label">Savings Goal</div>
          <h2>₹15,000</h2>
          <p>Sample goal</p>
        </article>

        <article className="summary-card yellow-card">
          <div className="card-label">Remaining Budget</div>
          <h2>{formatRupees(data.remaining_budget)}</h2>
          <p>From server data</p>
        </article>
      </section>

      <section className="dashboard-panel">
        <h3>Premium Financial Insights</h3>
        <p>Advanced spending analysis, savings progress, and detailed reports.</p>
        <p>Personalized insights will be added when real financial data is connected.</p>
      </section>
    </>
  )
}

function Home({ role = 'Student' }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false

    const endpoint =
      role === 'Admin'
        ? `${API_BASE}/api/dashboard/admin`
        : role === 'Premium User'
          ? `${API_BASE}/api/dashboard/premium`
          : `${API_BASE}/api/dashboard/student`

    setDashboardData(null)
    setApiError('')

    fetch(endpoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setDashboardData(data)
      })
      .catch(() => {
        if (!cancelled) {
          setApiError(
            'Could not connect to the server. Make sure FastAPI is running at http://127.0.0.1:8000.'
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [role])

  const roleTitle =
    role === 'Admin'
      ? 'Admin Dashboard'
      : role === 'Premium User'
        ? 'Premium User Dashboard'
        : 'Student Dashboard'

  function renderDashboard() {
    if (apiError) {
      return (
        <section className="dashboard-panel">
          <h3>Connection Error</h3>
          <p>{apiError}</p>
          <button type="button" className="view-all" onClick={() => setDashboardData(null)}>
            Retry by switching dashboard role
          </button>
        </section>
      )
    }

    if (!dashboardData) {
      return (
        <section className="dashboard-panel">
          <p>Loading dashboard data...</p>
        </section>
      )
    }

    if (role === 'Admin') return <AdminDashboard data={dashboardData} />
    if (role === 'Premium User') return <PremiumDashboard data={dashboardData} />
    return <StudentDashboard data={dashboardData} />
  }

  return (
    <div className={`budget-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">B</div>
          <div>
            <h2>BudgetBuddy</h2>
            <span>PERSONAL FINANCE</span>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`sidebar-link ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-link-text">{item.name}</span>
              {item.name === 'Reports' && <span className="sidebar-badge">PRO</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-help-icon">?</div>
          <div>
            <strong>Need help?</strong>
            <span>Contact support</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{activeMenu === 'Dashboard' ? roleTitle : activeMenu}</h1>
            <p>
              {activeMenu === 'Dashboard'
                ? `Welcome back! Here's your ${role === 'Admin' ? 'platform' : 'financial'} overview.`
                : `Manage your ${activeMenu.toLowerCase()} information.`}
            </p>
          </div>

          <div className="student-profile">
            <button
              type="button"
              className="icon-button"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to night mode'}
              title="Toggle night mode"
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? '☀' : '☾'}
            </button>

            <div className="notification-wrapper">
              <button
                type="button"
                className="icon-button notification"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClick={() => {
                  setShowNotifications((current) => !current)
                  setShowProfile(false)
                }}
              >
                ♧<span>2</span>
              </button>

              {showNotifications && (
                <div className="floating-panel">
                  <h3>Notifications</h3>
                  <p>⚠ Review your monthly budget.</p>
                  <p>◎ Remember to review your savings goal.</p>
                  <button type="button" onClick={() => setShowNotifications(false)}>
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="notification-wrapper">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => {
                  setShowProfile((current) => !current)
                  setShowNotifications(false)
                }}
                aria-expanded={showProfile}
              >
                <span className="avatar">
                  {role === 'Admin' ? 'AD' : role === 'Premium User' ? 'PR' : 'ST'}
                </span>
                <strong>{role}</strong>
                <span>⌄</span>
              </button>

              {showProfile && (
                <div className="floating-panel profile-panel">
                  <h3>{role}</h3>
                  <p>Dashboard role preview</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu('Profile')
                      setShowProfile(false)
                    }}
                  >
                    View Profile
                  </button>
                  <button type="button" onClick={() => setShowProfile(false)}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeMenu === 'Dashboard' ? (
          renderDashboard()
        ) : (
          <section className="dashboard-panel">
            <h3>{activeMenu}</h3>
            {activeMenu === 'Notifications' ? (
              <>
                <p>Your current sample notifications:</p>
                <p>⚠ Review your monthly budget.</p>
                <p>◎ Remember to review your savings goal.</p>
              </>
            ) : (
              <p>
                This section is a placeholder for the {activeMenu.toLowerCase()} module.
                It can be connected to the team's implementation later.
              </p>
            )}

            <button
              type="button"
              className="view-all"
              onClick={() => setActiveMenu('Dashboard')}
            >
              ← Back to Dashboard
            </button>
          </section>
        )}

        <div className="dashboard-bottom">
          BudgetBuddy · Manage your money wisely
        </div>
      </main>
    </div>
  )
}

export default Home

