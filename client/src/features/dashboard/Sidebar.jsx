function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">₿</div>

        <div>
          <h2>BudgetBuddy</h2>
          <span>Student Finance</span>
        </div>
      </div>

      <nav className="sidebar-nav">

        <p className="nav-title">OVERVIEW</p>

       <a href="/" className="nav-item active">
          <span>▦</span>
             Dashboard
       </a>

        <p className="nav-title">FINANCE</p>

        <a href="#" className="nav-item">
          <span>↔</span>
          Transactions
        </a>

        <a href="#" className="nav-item">
          <span>⌁</span>
          Income
        </a>

        <a href="#" className="nav-item">
          <span>⌁</span>
          Expenses
        </a>

        <p className="nav-title">PLANNING</p>

        <a href="#" className="nav-item">
          <span>▣</span>
          Budget Planning
        </a>

        <a href="#" className="nav-item">
          <span>◎</span>
          Savings Goals
        </a>

        <p className="nav-title">INSIGHTS</p>

        <a href="#" className="nav-item">
          <span>▥</span>
          Analytics
        </a>

        <a href="#" className="nav-item">
          <span>▤</span>
          Reports
        </a>

        <p className="nav-title">ACCOUNT</p>

        <a href="#" className="nav-item">
          <span>♧</span>
          Notifications
        </a>

        <a href="#" className="nav-item">
          <span>♙</span>
          Profile
        </a>

        <a href="#" className="nav-item">
          <span>⚙</span>
          Settings
        </a>

      </nav>

      <div className="sidebar-bottom">
        <button className="upgrade-btn">
          👑 Upgrade to Premium
          <small>AI insights + analytics</small>
        </button>

        <div className="user-info">
          <div className="user-avatar">C</div>

          <div>
            <strong>chandana</strong>
            <small>chandana@gmail.com</small>
          </div>
          <button
            className="logout-btn"
         onClick={() => console.log("Logout clicked")}
         title="Logout"
         >
         ↪
       </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
