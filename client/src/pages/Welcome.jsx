/**
 * Welcome / Role Selection Landing Page.
 * Pixel-perfect reproduction of the original Figma design.
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Moon,
  Sun,
  ChevronRight,
  Wallet
} from 'lucide-react'

export const Welcome = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDarkMode ? '#0F172A' : '#E2ECF8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      fontFamily: 'var(--font-family)',
      transition: 'background-color 0.3s ease',
    }}>
      {/* Top-Right Theme Toggle Button (matching Figma design) */}
      <div style={{ position: 'absolute', top: '1.75rem', right: '2rem' }}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle Theme"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            color: isDarkMode ? '#F8FAFC' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: isDarkMode ? '1px solid #334155' : '1px solid rgba(226, 232, 240, 0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div style={{ maxWidth: '980px', width: '100%', textAlign: 'center' }}>
        {/* Brand Logo & Name (Figma: Wallet icon in rounded blue box + BudgetBuddy text) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
          }}>
            <Wallet size={24} strokeWidth={2.4} />
          </div>
          <span style={{
            fontSize: '1.85rem',
            fontWeight: '900',
            color: '#2563EB',
            letterSpacing: '-0.5px',
          }}>
            BudgetBuddy
          </span>
        </div>

        {/* Heading: Who are you? */}
        <h1 style={{
          fontSize: '2.1rem',
          fontWeight: '800',
          color: isDarkMode ? '#F8FAFC' : '#1E293B',
          letterSpacing: '-0.5px',
          marginBottom: '0.5rem',
        }}>
          Who are you?
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.98rem',
          color: isDarkMode ? '#94A3B8' : '#64748B',
          marginBottom: '2.75rem',
          fontWeight: '500',
        }}>
          Select your role to continue to the right login page
        </p>

        {/* 3 Figma Role Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}>
          {/* Card 1: Student (Soft Cyan/Sky Blue) */}
          <div
            onClick={() => navigate('/login?role=student')}
            style={{
              backgroundColor: '#E6F4FE',
              border: '2px solid #38BDF8',
              borderRadius: '26px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.12)',
              minHeight: '380px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.12)'
            }}
          >
            <div>
              {/* Graduation Cap Emoji/Icon */}
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1 }}>
                🎓
              </div>

              {/* Free Plan Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#0284C7',
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                Free Plan
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#0F172A',
                marginBottom: '0.65rem',
              }}>
                Student
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.88rem',
                color: '#475569',
                lineHeight: '1.55',
                fontWeight: '500',
              }}>
                Track pocket money, college expenses &amp; savings goals
              </p>
            </div>

            {/* CTA Link */}
            <div style={{ marginTop: '2rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#0284C7',
                fontWeight: '700',
                fontSize: '0.92rem',
              }}>
                Login as Student
                <ChevronRight size={17} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          {/* Card 2: Premium User (Pastel Warm Yellow/Gold) */}
          <div
            onClick={() => navigate('/login?role=premium')}
            style={{
              backgroundColor: '#FEF9C3',
              border: '2px solid #FBBF24',
              borderRadius: '26px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 8px 24px rgba(251, 191, 36, 0.12)',
              minHeight: '380px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(251, 191, 36, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 191, 36, 0.12)'
            }}
          >
            <div>
              {/* Crown Emoji/Icon */}
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1 }}>
                👑
              </div>

              {/* Premium Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#FDE68A',
                color: '#B45309',
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}>
                Premium
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#0F172A',
                marginBottom: '0.65rem',
              }}>
                Premium User
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.88rem',
                color: '#475569',
                lineHeight: '1.55',
                fontWeight: '500',
              }}>
                Advanced analytics, investment tracking &amp; priority support
              </p>
            </div>

            {/* CTA Link */}
            <div style={{ marginTop: '2rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#B45309',
                fontWeight: '700',
                fontSize: '0.92rem',
              }}>
                Login as Premium User
                <ChevronRight size={17} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          {/* Card 3: Admin (Deep Royal Indigo / Navy) */}
          <div
            onClick={() => navigate('/login?role=admin')}
            style={{
              backgroundColor: '#1E1B4B',
              border: '2px solid #2E2866',
              borderRadius: '26px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 10px 30px rgba(30, 27, 75, 0.35)',
              minHeight: '380px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 14px 36px rgba(30, 27, 75, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(30, 27, 75, 0.35)'
            }}
          >
            <div>
              {/* Blue Shield Icon */}
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1 }}>
                🛡️
              </div>

              {/* Admin Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#4338CA',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}>
                Admin
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#FFFFFF',
                marginBottom: '0.65rem',
              }}>
                Admin
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.88rem',
                color: '#94A3B8',
                lineHeight: '1.55',
                fontWeight: '500',
              }}>
                Manage users, system settings &amp; platform analytics
              </p>
            </div>

            {/* CTA Link */}
            <div style={{ marginTop: '2rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#A5B4FC',
                fontWeight: '700',
                fontSize: '0.92rem',
              }}>
                Login as Admin
                <ChevronRight size={17} strokeWidth={2.5} />
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Helper Links */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.88rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
          <span>
            Need a new account?{' '}
            <Link to="/register" style={{ color: '#2563EB', fontWeight: '700' }}>
              Register Here
            </Link>
          </span>
          <span>&bull;</span>
          <Link to="/health" style={{ color: '#2563EB', fontWeight: '600' }}>
            System Architecture
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Welcome
