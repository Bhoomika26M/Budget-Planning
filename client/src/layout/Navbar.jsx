/*function Navbar() {
  return (
    <header className="navbar">

      <div className="navbar-title">
        <h1>Savings Goals</h1>
        <p>Work toward your financial goals</p>
      </div>

      <div className="navbar-actions">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        <button
          className="navbar-icon-button"
          title="Toggle dark mode"
        >
          ◔
        </button>

        <button
          className="navbar-icon-button"
          title="Notifications"
        >
          ♧
        </button>

        <button className="transaction-button">
          + Add Transaction
        </button>

      </div>

    </header>
  )
}

export default Navbar*/
import { useEffect, useState } from 'react'

function Navbar() {
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>Savings Goals</h1>
        <p>Work toward your financial goals</p>
      </div>

      <div className="navbar-actions">
        <div className="search-box">
          <span>⌕</span>
          <input type="text" placeholder="Search..." />
        </div>

        <button
          className="navbar-icon-button"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDarkMode(previous => !previous)}
        >
          {darkMode ? '☀' : '◔'}
        </button>

        <button
          className="navbar-icon-button"
          title="Notifications"
        >
          ♧
        </button>

        <button className="transaction-button">
          + Add Transaction
        </button>
      </div>
    </header>
  )
}

export default Navbar