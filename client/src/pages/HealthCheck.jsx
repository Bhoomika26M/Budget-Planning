/**
 * Health Check & System Architecture Inspection Page (Preserving Milestone 1).
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  ShieldCheck,
  Database,
  Layers,
  Server,
  Code2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

export const HealthCheck = () => {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/health')
      setHealth(response.data)
    } catch (err) {
      console.error('Failed to reach backend health endpoint:', err)
      setError(err.message || 'Cannot connect to backend server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Top Bar */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600' }}>
            <ArrowLeft size={16} />
            Home
          </Link>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }} />
          <h1 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-navy)' }}>
            BudgetBuddy System Health & Architecture
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchHealth}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/login" className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
        {/* Banner Card */}
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '5px solid var(--primary-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '0.4rem' }}>
                System Architecture & Foundation Active
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '720px', lineHeight: '1.5' }}>
                FastAPI backend, SQLAlchemy ORM schema, Alembic migration scripts, and React + Vite frontend
                operate with strict relational integrity and user isolation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {loading ? (
                <span className="badge-income">Checking health...</span>
              ) : health?.status === 'healthy' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-income)', fontWeight: '700' }}>
                  <CheckCircle2 size={18} />
                  <span>Backend Healthy</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-expense)', fontWeight: '700' }}>
                  <AlertCircle size={18} />
                  <span>Backend Offline / Starting</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Card 1: API Engine */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-pastel-blue)', color: 'var(--primary-blue)' }}>
                <Server size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>FastAPI Backend</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li><strong>App Name:</strong> {health?.app_name || 'BudgetBuddy API'}</li>
              <li><strong>Version:</strong> {health?.version || '1.0.0'}</li>
              <li><strong>Environment:</strong> {health?.environment || 'development'}</li>
              <li><strong>Interactive Docs:</strong> <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}>Swagger UI (/docs)</a></li>
            </ul>
          </div>

          {/* Card 2: Database Layer */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-pastel-purple)', color: '#8B5CF6' }}>
                <Database size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Relational Database</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li><strong>Engine:</strong> PostgreSQL / SQLite compatible</li>
              <li><strong>Connectivity:</strong> {health?.database || 'Ready'}</li>
              <li><strong>Migrations:</strong> Alembic revision <code>001_initial_schema</code></li>
              <li><strong>ORM:</strong> SQLAlchemy 2.0 with Declarative Models</li>
            </ul>
          </div>

          {/* Card 3: Security & RBAC */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-income-light)', color: 'var(--color-income)' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Security & Roles</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li><strong>Roles:</strong> Student, Premium User, Admin</li>
              <li><strong>Passwords:</strong> Bcrypt hashing (zero plain-text)</li>
              <li><strong>Auth:</strong> JWT Bearer token architecture</li>
              <li><strong>Data Isolation:</strong> User ID foreign keys & cascades</li>
            </ul>
          </div>
        </div>

        {/* Database Tables Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--color-pastel-amber)', color: '#D97706' }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Configured Relational Models</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                8 database tables created with foreign keys, indexes, and cascading deletes.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem'
          }}>
            {[
              { name: 'users', desc: 'Accounts, hashed credentials, roles' },
              { name: 'user_profiles', desc: 'Preferences, currency, monthly income' },
              { name: 'expenses', desc: 'Category-wise expense transactions' },
              { name: 'incomes', desc: 'Income sources, amounts, and dates' },
              { name: 'budgets', desc: 'Monthly & category spending limits' },
              { name: 'savings_goals', desc: 'Target amounts, dates, and status' },
              { name: 'savings_contributions', desc: 'Incremental deposits per goal' },
              { name: 'notifications', desc: 'Alerts, overspend warnings, updates' },
            ].map((tbl) => (
              <div
                key={tbl.name}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Code2 size={15} color="var(--primary-blue)" />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-navy)' }}>
                    {tbl.name}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tbl.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default HealthCheck
