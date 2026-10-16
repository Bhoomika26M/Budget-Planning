
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Wallet,
  Home,
  Receipt,
  DollarSign,
  PiggyBank,
  Target,
  ChartNoAxesCombined,
  FileText,
  Bell,
  UserRound,
  Settings,
  Users,
  CreditCard,
  Tags,
  Activity,
  ScrollText,
  Megaphone,
  MessageSquare,
  CircleAlert,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import "./Navigation.css";

const userNavItems = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Expenses", path: "/expenses", icon: Receipt },
  { label: "Income", path: "/income", icon: DollarSign },
  { label: "Budgets", path: "/budget", icon: PiggyBank },
  { label: "Savings Goals", path: "/savings", icon: Target },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Profile", path: "/profile", icon: UserRound },
  { label: "Settings", path: "/settings", icon: Settings },
];

const adminNavItems = [
  { label: "Dashboard", path: "/admin-dashboard", icon: Home },
  { label: "Users", path: "/admin-users", icon: Users },
  { label: "Subscriptions", path: "/admin-subscriptions", icon: CreditCard },
  { label: "Categories", path: "/admin-categories", icon: Tags },
  { label: "Platform Analytics", path: "/admin-analytics", icon: Activity },
  { label: "System Logs", path: "/admin-logs", icon: ScrollText },
  { label: "Announcements", path: "/admin-announcements", icon: Megaphone },
  { label: "Feedback", path: "/admin-feedback", icon: MessageSquare },
  { label: "Reported Issues", path: "/admin-issues", icon: CircleAlert },
  { label: "Permissions", path: "/admin-permissions", icon: ShieldCheck },
];

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({
  user = { name: "User", role: "Student" },
  isOpen = false,
  onClose,
  onLogout,
}) {
  const navigate = useNavigate();
  const isAdmin = user.role?.toLowerCase() === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`app-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wallet size={21} />
          </div>

          <span className="brand-name">BudgetBuddy</span>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          

          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="role-badge">
            {user.role || "Student"}
          </span>

          <div className="sidebar-user">
            <div className="user-avatar">
              {getInitials(user.name)}
            </div>

            <div className="sidebar-user-info">
              <p>{user.name}</p>
              <span>{user.email || "BudgetBuddy user"}</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
