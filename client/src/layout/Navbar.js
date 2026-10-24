import React, { useEffect, useState } from "react";
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

const UNREAD_COUNT_KEY = "budgetbuddy_unread_notification_count";
const UNREAD_COUNT_EVENT = "budgetbuddy:unread-count";

export default function Navbar({
  pageTitle = "Dashboard",
  user = { name: "User" },
  dark = false,
  onToggleTheme,
  onMenuClick,
}) {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      return Math.max(
        0,
        Number(localStorage.getItem(UNREAD_COUNT_KEY)) || 0
      );
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleUnreadCount = (event) => {
      const count = Math.max(0, Number(event.detail) || 0);
      setUnreadCount(count);
    };

    const handleStorage = (event) => {
      if (event.key === UNREAD_COUNT_KEY) {
        setUnreadCount(Math.max(0, Number(event.newValue) || 0));
      }
    };

    window.addEventListener(UNREAD_COUNT_EVENT, handleUnreadCount);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(UNREAD_COUNT_EVENT, handleUnreadCount);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const safeUnreadCount = Math.max(0, Number(unreadCount) || 0);

  return (
    <header className="app-navbar">
      <button
        type="button"
        className="navbar-icon-button mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu size={21} />
      </button>

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
          type="button"
          className="navbar-icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className="navbar-icon-button notification-button"
          onClick={() => navigate("/notifications")}
          aria-label={
            safeUnreadCount > 0
              ? `Notifications, ${safeUnreadCount} unread`
              : "Notifications"
          }
          title="Notifications"
        >
          <Bell size={18} />

          {safeUnreadCount > 0 && (
            <span className="notification-dot">
              {safeUnreadCount > 99 ? "99+" : safeUnreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
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