const navigationGroups = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "▦", href: "/" }],
  },
  {
    label: "Finance",
    items: [
      { id: "transactions", label: "Transactions", icon: "↔" },
      { id: "income", label: "Income", icon: "↗" },
      { id: "expenses", label: "Expenses", icon: "⌁", href: "/expenses" },
    ],
  },
  {
    label: "Planning",
    items: [
      { id: "budgets", label: "Budget Planning", icon: "▣", href: "/budgets" },
      { id: "savings", label: "Savings Goals", icon: "◎" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "analytics", label: "Analytics", icon: "▥" },
      { id: "reports", label: "Reports", icon: "▤" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "notifications", label: "Notifications", icon: "♧" },
      { id: "profile", label: "Profile", icon: "♙" },
      { id: "settings", label: "Settings", icon: "⚙", href: "/settings" },
    ],
  },
];

function Sidebar({ activeItem, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <a className="brand-block" href="/" onClick={(event) => onNavigate(event, "/")}>
        <span className="brand-mark" aria-hidden="true">B</span>
        <span className="brand-copy">
          <span className="brand-name">BudgetBuddy</span>
          <span className="brand-subtitle">Student Finance</span>
        </span>
      </a>

      <nav className="app-nav" aria-label="Main navigation">
        {navigationGroups.map((group) => (
          <section className="app-nav-group" key={group.label} aria-label={group.label}>
            <h2 className="app-nav-group-title">{group.label}</h2>
            {group.items.map((item) => (
              item.href ? (
                <a
                  className={`app-nav-link${activeItem === item.id ? " active" : ""}`}
                  href={item.href}
                  key={item.id}
                  aria-current={activeItem === item.id ? "page" : undefined}
                  onClick={(event) => onNavigate(event, item.href)}
                >
                  <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ) : (
                <span className="app-nav-link unavailable" key={item.id} aria-disabled="true">
                  <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              )
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
