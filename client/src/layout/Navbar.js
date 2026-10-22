
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  CalendarDays,
  Sun,
  Moon,
  Bell,
  UserRound,
} from "lucide-react";
import "./Navigation.css";

export default function Navbar({
  pageTitle = "Dashboard",
  user = { name: "User" },
  dark = false,
  onToggleTheme,
  onMenuClick,
  unreadCount = 0,
}) {
  const navigate = useNavigate();

  return (
    <header className="app-navbar">
      <button
        className="navbar-icon-button mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu size={21} />
      </button>

      {/* <div className="navbar-heading">
        <h1>{pageTitle}</h1>
      </div> */}

      <div className="navbar-search">
        <Search size={17} />
        <input
          type="search"
          placeholder="Search transactions, goals..."
          aria-label="Search"
        />
      </div>

      <div className="navbar-actions">
        <div className="navbar-date">
          <CalendarDays size={16} />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <button
          className="navbar-icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="navbar-icon-button notification-button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notification-dot" />
          )}
        </button>

        <button
          className="navbar-profile"
          onClick={() => navigate("/settings")}
          title={user.name || "Profile"}
          aria-label="Open profile"
        >
          {(user.name || "U")
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || <UserRound size={18} />}
        </button>
      </div>
    </header>
  );
}
