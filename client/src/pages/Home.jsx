
import './Home.css'

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
  { name: 'Food', amount: '₹8,000', color: '#2864ed' },
  { name: 'Transport', amount: '₹3,500', color: '#16a34a' },
  { name: 'Shopping', amount: '₹6,000', color: '#ff9900' },
  { name: 'Bills', amount: '₹5,200', color: '#8b5cf6' },
  { name: 'Others', amount: '₹2,000', color: '#ef4444' },
]

function Home() {
  return (
    <div className="budget-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Student! Here's your financial overview.</p>
        </div>

        <div className="student-profile">
          <button className="icon-button" aria-label="Toggle theme">☾</button>
          <button className="icon-button notification" aria-label="Notifications">
            ♧<span>2</span>
          </button>
          <div className="avatar">SU</div>
          <strong>Student</strong>
        </div>
      </header>

      <section className="summary-cards">
        <article className="summary-card blue-card">
          <div className="card-label">Total Budget <span>₹</span></div>
          <h2>₹65,000</h2>
          <p>This Month</p>
        </article>

        <article className="summary-card green-card">
          <div className="card-label">Total Spend <span>↘</span></div>
          <h2>₹38,760</h2>
          <p>59.6% of budget</p>
        </article>

        <article className="summary-card purple-card">
          <div className="card-label">Remaining Budget <span>▣</span></div>
          <h2>₹26,240</h2>
          <p>40.4% remaining</p>
        </article>

        <article className="summary-card yellow-card">
          <div className="card-label">Budget Alert <span>⚠</span></div>
          <h2>2 Alerts</h2>
          <p>View alerts →</p>
        </article>
      </section>

      <section className="dashboard-charts">
        <article className="dashboard-panel income-panel">
          <div className="panel-heading">
            <h3>Income vs Expenses</h3>
            <span>Last 6 months</span>
          </div>

          <div className="bar-chart">
            <div className="chart-labels">
              <span>₹60k</span>
              <span>₹45k</span>
              <span>₹30k</span>
              <span>₹15k</span>
              <span>₹0k</span>
            </div>

            <div className="bar-chart-content">
              {months.map((month) => (
                <div className="month-column" key={month.name}>
                  <div className="bars">
                    <div
                      className="income-bar"
                      style={{ height: `${month.income * 2.1}px` }}
                      title={`Income: ₹${month.income},000`}
                    />
                    <div
                      className="expense-bar"
                      style={{ height: `${month.expense * 2.1}px` }}
                      title={`Expenses: ₹${month.expense},000`}
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

          <div className="donut-chart" aria-label="Spending by category chart">
            <div className="donut-hole" />
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <div className="category-row" key={category.name}>
                <span className="category-name">
                  <i style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
                <strong>{category.amount}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panel transactions-panel">
        <div className="panel-heading">
          <h3>Recent Transactions</h3>
          <button className="view-all">View All →</button>
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
                {transaction.income ? '+' : ''}₹{transaction.amount.toLocaleString('en-IN')}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
