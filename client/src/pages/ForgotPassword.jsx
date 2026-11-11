/**
 * Forgot Password Page.
 * Styled to match the Figma BudgetBuddy design system.
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wallet,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const { forgotPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid registered email address.')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.')
      return
    }

    setLoading(true)
    const result = await forgotPassword(email.trim().toLowerCase(), newPassword)
    setLoading(false)

    if (result.success) {
      setSuccess('Your password has been successfully reset! You can now log in.')
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')
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
        <Link to="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748B',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          fontWeight: '600',
        }}>
          <ChevronLeft size={16} />
          Back to Login
        </Link>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            Reset Password
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Enter your account email and choose a new password
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--color-income-light)',
            color: 'var(--color-income)',
            fontSize: '0.9rem',
            marginBottom: '1.25rem',
            border: '1px solid #A7F3D0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <CheckCircle2 size={18} />
              <span>Password Reset Completed</span>
            </div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{success}</p>
            <Link to="/login" className="btn-primary" style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', backgroundColor: '#2563EB' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

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

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                Account Email
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

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
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
              {loading ? 'Updating Password...' : 'Reset Password'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
