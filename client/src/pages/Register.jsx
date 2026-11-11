/**
 * User Registration Page.
 * Styled to match the Figma BudgetBuddy design system.
 */

import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wallet,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'

export const Register = () => {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'student'

  const [role, setRole] = useState(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.')
      return
    }

    setLoading(true)
    const result = await register({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    })
    setLoading(false)

    if (result.success) {
      navigate('/setup')
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
        maxWidth: '500px',
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

          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
            Create Your Account
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Select your account plan and fill in your details
          </p>
        </div>

        {/* Role Selector Tabs (Figma Theme) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem',
          backgroundColor: '#EFF6FF',
          padding: '0.35rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
        }}>
          {[
            { id: 'student', label: 'Student', icon: '🎓', activeBg: '#E6F4FE', activeColor: '#0284C7', border: '#38BDF8' },
            { id: 'premium', label: 'Premium', icon: '👑', activeBg: '#FEF9C3', activeColor: '#B45309', border: '#FBBF24' },
            { id: 'admin', label: 'Admin', icon: '🛡️', activeBg: '#1E1B4B', activeColor: '#FFFFFF', border: '#2E2866' },
          ].map((t) => {
            const active = role === t.id
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setRole(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.35rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: active ? '800' : '600',
                  backgroundColor: active ? t.activeBg : 'transparent',
                  color: active ? t.activeColor : '#64748B',
                  border: active ? `2px solid ${t.border}` : '2px solid transparent',
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
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

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
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
            {loading ? 'Creating Account...' : 'Register & Continue'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748B' }}>
          Already have an account?{' '}
          <Link to={`/login?role=${role}`} style={{ color: '#2563EB', fontWeight: '700' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
