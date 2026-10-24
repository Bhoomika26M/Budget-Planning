import { useEffect, useState } from "react";
import { Bell, ChevronDown, LogOut, Moon, Plus, Sun, UserRound } from "lucide-react";

function getCurrentTheme() {
  if (typeof document === "undefined") return "light";
  return (
    document.documentElement.dataset.theme ||
    localStorage.getItem("budgetbuddy-theme") ||
    "light"
  );
}

function Navbar({
  title,
  subtitle,
  actions,
  currentUser,
  onNavigate,
  onLogout,
  onAddTransaction,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme);

  const initials = currentUser?.name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Keep the theme icon in sync if the theme is changed elsewhere (e.g. Settings).
  useEffect(() => {
    const syncTheme = () => setTheme(getCurrentTheme());
    window.addEventListener("budgetbuddy-theme-change", syncTheme);
    return () => window.removeEventListener("budgetbuddy-theme-change", syncTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("budgetbuddy-theme", nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new Event("budgetbuddy-theme-change"));
  }

  return (
    <header className="app-navbar">
      <div className="app-navbar-heading">
        <h1 className="app-navbar-title">{title}</h1>
        {subtitle ? <p className="app-navbar-subtitle">{subtitle}</p> : null}
      </div>
      <div className="app-navbar-actions">
        {actions}

        {onAddTransaction ? (
          <button
            className="app-action-button app-add-transaction"
            type="button"
            onClick={onAddTransaction}
          >
            <Plus size={15} aria-hidden="true" />
            Add Transaction
          </button>
        ) : null}

        <button
          className="app-icon-button"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle dark mode"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="app-icon-button"
          type="button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => onNavigate("/notifications")}
        >
          <Bell size={18} />
        </button>

        <div className="app-account-menu">
          <button
            className="app-account-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <span className="app-account-avatar" aria-hidden="true">{initials || <UserRound size={18} />}</span>
            <span className="app-account-copy">
              <strong>{currentUser?.name}</strong>
              <small>{currentUser?.role}</small>
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          {profileMenuOpen && (
            <div className="app-account-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onNavigate("/profile");
                }}
              >
                <UserRound size={16} />
                Manage profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;