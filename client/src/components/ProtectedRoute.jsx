/**
 * Protected Route Component.
 * Enforces authentication, first-time setup completion, and role-based permissions.
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, RefreshCw } from 'lucide-react'

export const ProtectedRoute = ({
  children,
  requireSetup = true,
  allowedRoles = null,
}) => {
  const { isAuthenticated, isSetupCompleted, loading, role, logout } = useAuth()
  const location = useLocation()

  // Display clean loader while verifying session token
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        gap: '1rem',
      }}>
        <RefreshCw size={36} color="var(--primary-navy)" className="spin" />
        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
          Verifying BudgetBuddy session...
        </p>
      </div>
    )
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but first-time setup not completed yet -> redirect to onboarding
  if (requireSetup && !isSetupCompleted && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  // Completed setup but trying to revisit onboarding -> redirect to dashboard
  if (isSetupCompleted && location.pathname === '/setup') {
    return <Navigate to="/dashboard" replace />
  }

  // Role-Based Access Control check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        padding: '1.5rem',
      }}>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-expense-light)',
            color: 'var(--color-expense)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Your account role (<strong>{role}</strong>) does not have authorization to view this section.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <a href="/dashboard" className="btn-primary">
              Return to Dashboard
            </a>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
