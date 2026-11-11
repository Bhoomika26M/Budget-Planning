/**
 * User Login Page.
 * Styled to match the Figma BudgetBuddy design system.
 */

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wallet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'

export const Login = () => {
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role') || 'student'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getRoleMeta = () => {
    switch (roleParam) {
      case 'premium':
        return { title: 'Premium User', icon: '👑', badgeColor: '#B45309', badgeBg: '#FEF9C3', accent: '#D97706' }
      case 'admin':
        return { title: 'Administrator', icon: '🛡️', badgeColor: '#4338CA', badgeBg: '#EEF2FF', accent: '#4338CA' }
      default:
        return { title: 'Student', icon: '🎓', badgeColor: '#0284C7', badgeBg: '#E6F4FE', accent: '#0284C7' }
    }
  }

  const roleMeta = getRoleMeta()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.')
      return
    }

    setLoading(true)
    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)

    if (result.success) {
      const { user } = result.data
      if (!user.is_setup_completed) {
        navigate('/setup')
      } else {
        const redirectPath = location.state?.from?.pathname || '/dashboard'
        navigate(redirectPath)
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E2ECF8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      fontFamily: 'var(--font-family)',
    }}>
      <div className="card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: '26px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
      }}>
        {/* Back Link */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748B',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          fontWeight: '600',
        }}>
          <ChevronLeft size={16} />
          Change Role
        </Link>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '0.85rem',
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
            }}>
              <Wallet size={22} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: '900', color: '#2563EB', letterSpacing: '-0.5px' }}>
              BudgetBuddy
            </span>
          </div>

          {/* Role Pill Badge */}
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: roleMeta.badgeBg,
              color: roleMeta.badgeColor,
              fontWeight: '700',
              fontSize: '0.82rem',
            }}>
              <span>{roleMeta.icon}</span>
              <span>{roleMeta.title} Login</span>
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Enter your credentials to access your dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--color-expense-light)',
            color: 'var(--color-expense)',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            border: '1px solid #FECACA',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.6rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.92rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 2.8rem 0.8rem 2.6rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.92rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: '#64748B',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              fontSize: '1rem',
              marginTop: '0.5rem',
              backgroundColor: '#2563EB',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : `Sign In as ${roleMeta.title}`}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748B' }}>
          Don't have an account yet?{' '}
          <Link to={`/register?role=${roleParam}`} style={{ color: '#2563EB', fontWeight: '700' }}>
            Register as {roleMeta.title}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
