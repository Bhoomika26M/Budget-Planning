import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Bell, ChartNoAxesCombined, FileText, Goal, LayoutDashboard, LogOut, PieChart, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './AppLayout.css'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/budget', label: 'Budget Planning', icon: PieChart },
  { path: '/savings', label: 'Savings Goals', icon: Goal },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['premium', 'admin'] },
  { path: '/notifications', label: 'Notifications', icon: Bell },
]

export default function AppLayout({ children }) {
  const { user, logout, role } = useAuth()
  const location = useLocation()

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link to="/dashboard" className="app-brand">
          <span className="app-brand-icon"><Wallet size={22} /></span>
          <span>BudgetBuddy</span>
        </Link>

        <nav className="app-nav" aria-label="Primary navigation">
          {NAV_ITEMS.filter(({ roles }) => !roles || roles.includes(role)).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`app-nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <button className="app-logout" type="button" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div className="app-topbar-title">
            <BarChart3 size={18} />
            <span>Financial workspace</span>
          </div>
          <div className="app-user">
            <span className="app-user-avatar">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
            <span>{user?.full_name || user?.email}</span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}

