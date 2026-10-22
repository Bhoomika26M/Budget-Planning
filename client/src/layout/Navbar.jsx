import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

function Navbar({ title, subtitle, actions, currentUser, onNavigate, onLogout }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const initials = currentUser?.name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="app-navbar">
      <div className="app-navbar-heading">
        <h1 className="app-navbar-title">{title}</h1>
        {subtitle ? <p className="app-navbar-subtitle">{subtitle}</p> : null}
      </div>
      <div className="app-navbar-actions">
        {actions}
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
