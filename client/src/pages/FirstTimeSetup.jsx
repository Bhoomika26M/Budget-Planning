/**
 * First Time Setup / Onboarding Page.
 * Styled to match the Figma BudgetBuddy design system.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wallet,
  DollarSign,
  Compass,
  Target,
  ArrowRight,
  AlertCircle,
  Check
} from 'lucide-react'

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
]

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

const PREFERENCE_OPTIONS = [
  {
    id: 'Save and Invest',
    title: 'Save and Invest',
    desc: 'Grow wealth steadily through smart allocation and disciplined savings.',
  },
  {
    id: 'Control Spending',
    title: 'Control Spending',
    desc: 'Keep daily expenses disciplined and prevent accidental overspending.',
  },
  {
    id: 'Manage Debt',
    title: 'Manage Debt',
    desc: 'Track repayments, reduce obligations, and gain financial freedom.',
  },
  {
    id: 'Build Emergency Fund',
    title: 'Build Emergency Fund',
    desc: 'Create a robust safety cushion for unexpected life events.',
  },
]

const GOAL_PRESETS = [
  'Laptop',
  'Mobile Phone',
  'College Fees',
  'Emergency Fund',
  'Travel & Vacation',
  'Certifications',
]

export const FirstTimeSetup = () => {
  const { user, completeSetup } = useAuth()
  const navigate = useNavigate()

  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0])
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [financialPreference, setFinancialPreference] = useState('Save and Invest')
  const [goalFocus, setGoalFocus] = useState('Emergency Fund')
  const [customGoal, setCustomGoal] = useState('')

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please provide your full name.')
      return
    }

    const incomeVal = parseFloat(monthlyIncome)
    if (isNaN(incomeVal) || incomeVal < 0) {
      setError('Please enter a valid monthly income (0 or greater).')
      return
    }

    const finalGoal = goalFocus === 'Other' && customGoal.trim() ? customGoal.trim() : goalFocus

    setLoading(true)
    const result = await completeSetup({
      full_name: fullName.trim(),
      avatar_url: avatarUrl,
      monthly_income: incomeVal,
      currency,
      financial_preference: financialPreference,
      goal_focus: finalGoal,
    })
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }

  const selectedCurrencySymbol = CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol || '₹'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E2ECF8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
      fontFamily: 'var(--font-family)',
    }}>
      <div className="card" style={{
        maxWidth: '680px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: '26px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
      }}>
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

          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
            First-Time Profile Setup
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            Personalize your preferred currency, income, and financial targets
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
            marginBottom: '1.5rem',
            border: '1px solid #FECACA',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>
          {/* 1. Avatar Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              Select an Avatar
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {AVATAR_OPTIONS.map((url, i) => {
                const isSelected = avatarUrl === url
                return (
                  <div
                    key={i}
                    onClick={() => setAvatarUrl(url)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      padding: '3px',
                      border: isSelected ? '3px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: isSelected ? 'scale(1.08)' : 'none',
                      backgroundColor: '#FFFFFF',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Avatar ${i + 1}`}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Personal Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.92rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
                Registered Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.92rem',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {/* 3. Preferred Currency */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              Preferred Currency
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
            }}>
              {CURRENCY_OPTIONS.map((c) => {
                const active = currency === c.code
                return (
                  <div
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    style={{
                      padding: '0.85rem 0.5rem',
                      borderRadius: '12px',
                      border: active ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.35rem', fontWeight: '900', color: active ? '#2563EB' : '#0F172A' }}>
                      {c.symbol}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: active ? '#2563EB' : '#64748B' }}>
                      {c.code}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Estimated Monthly Income */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
              Estimated Monthly Income / Allowance
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: '700',
                color: '#64748B',
                fontSize: '1rem',
              }}>
                {selectedCurrencySymbol}
              </span>
              <input
                type="number"
                placeholder="e.g. 25000"
                min="0"
                step="100"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.5rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
            </div>
          </div>

          {/* 5. Financial Preference */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              Primary Financial Strategy
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              {PREFERENCE_OPTIONS.map((pref) => {
                const active = financialPreference === pref.id
                return (
                  <div
                    key={pref.id}
                    onClick={() => setFinancialPreference(pref.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '12px',
                      border: active ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: active ? '#2563EB' : '#0F172A' }}>
                        {pref.title}
                      </span>
                      {active && <Check size={16} color="#2563EB" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4' }}>
                      {pref.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 6. Financial Goal Focus */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              Target Savings Focus
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {GOAL_PRESETS.map((preset) => {
                const active = goalFocus === preset
                return (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => {
                      setGoalFocus(preset)
                      setCustomGoal('')
                    }}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      border: active ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      backgroundColor: active ? '#2563EB' : '#FFFFFF',
                      color: active ? '#FFFFFF' : '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setGoalFocus('Other')}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  border: goalFocus === 'Other' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  backgroundColor: goalFocus === 'Other' ? '#2563EB' : '#FFFFFF',
                  color: goalFocus === 'Other' ? '#FFFFFF' : '#0F172A',
                  cursor: 'pointer',
                }}
              >
                Other (Custom)
              </button>
            </div>

            {goalFocus === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom savings target (e.g. Electric Bike, Coding Bootcamp)"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.92rem',
                  backgroundColor: '#F8FAFC',
                }}
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '0.95rem',
              borderRadius: '12px',
              fontSize: '1rem',
              marginTop: '0.5rem',
              backgroundColor: '#2563EB',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving Setup Details...' : 'Complete Setup & Launch Dashboard'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default FirstTimeSetup
