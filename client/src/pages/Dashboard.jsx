/**
 * Dashboard Page - Final Implementation.
 * Matches Figma design exactly with live data from backend.
 * 4 metric cards + Income vs Expenses bar chart + Spending by Category donut + Recent Transactions.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  IndianRupee, TrendingUp, Wallet, AlertTriangle,
  Utensils, Car, GraduationCap, ShoppingBag, Clapperboard,
  HeartPulse, ReceiptText, ArrowRight, Briefcase
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import AppLayout from '../components/AppLayout'

const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EF4444', '#14B8A6', '#EC4899', '#8B5CF6']

const CATEGORY_ICONS = {
  Food: Utensils,
  Transportation: Car,
  Education: GraduationCap,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Healthcare: HeartPulse,
  Bills: ReceiptText,
  Income: Briefcase,
  Others: Wallet,
}

const CATEGORY_BG = {
  Food: '#FEF3C7',
  Transportation: '#DBEAFE',
  Education: '#EDE9FE',
  Shopping: '#FCE7F3',
  Entertainment: '#D1FAE5',
  Healthcare: '#CCFBF1',
  Bills: '#FEE2E2',
  Income: '#D1FAE5',
  Others: '#F1F5F9',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, profRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setSummary(dashRes.data)
      setProfile(profRes.data)
    } catch (e) {
      setError('Failed to load dashboard data. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const currency = profile?.currency || 'INR'
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'

  const fmt = (n) => `${sym}${Number(n || 0).toLocaleString('en-IN')}`

  const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Student'

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <p>Loading your financial overview...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ padding: 24, background: '#FEE2E2', borderRadius: 12, color: '#991B1B', marginTop: 24 }}>
          {error}
        </div>
      </AppLayout>
    )
  }

  const {
    total_budget = 0,
    total_spend = 0,
    remaining_budget = 0,
    budget_alert_count = 0,
    spending_by_category = [],
    monthly_comparison = [],
    recent_transactions = []
  } = summary || {}

  return (
    <AppLayout>
      <div style={{ paddingTop: 24 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1E293B', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 14 }}>
            Welcome back, {displayName}! Here's your financial overview.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {/* Total Budget */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Total Budget</span>
              <IndianRupee size={20} color="#2563EB" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{fmt(total_budget)}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>This Month</div>
          </div>

          {/* Total Spend */}
          <div style={{ background: '#ECFDF5', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#064E3B', fontWeight: 500 }}>Total Spend</span>
              <TrendingUp size={20} color="#10B981" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>{fmt(total_spend)}</div>
            <div style={{ fontSize: 12, color: '#6EE7B7' }}>
              {total_budget > 0 ? `${((total_spend / total_budget) * 100).toFixed(1)}% of budget` : 'No budget set'}
            </div>
          </div>

          {/* Remaining Budget */}
          <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 500 }}>Remaining Budget</span>
              <Wallet size={20} color="#2563EB" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#2563EB', marginBottom: 4 }}>{fmt(remaining_budget)}</div>
            <div style={{ fontSize: 12, color: '#93C5FD' }}>
              {total_budget > 0 ? `${((remaining_budget / total_budget) * 100).toFixed(1)}% remaining` : '—'}
            </div>
          </div>

          {/* Budget Alerts */}
          <div style={{ background: '#FFFBEB', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>Budget Alert</span>
              <AlertTriangle size={20} color="#F59E0B" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>
              {budget_alert_count} Alert{budget_alert_count !== 1 ? 's' : ''}
            </div>
            <Link to="/notifications" style={{ fontSize: 12, color: '#D97706', textDecoration: 'none' }}>
              View alerts →
            </Link>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
          {/* Income vs Expenses Bar Chart */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>Income vs Expenses</h2>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Last 6 months</span>
            </div>
            {monthly_comparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthly_comparison} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${sym}${(v / 1000).toFixed(0)}k` : `${sym}${v}`} />
                  <Tooltip
                    formatter={(v, n) => [fmt(v), n === 'income' ? 'Income' : 'Expenses']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="income" fill="#93C5FD" radius={[4, 4, 0, 0]} name="income" />
                  <Bar dataKey="expenses" fill="#BFDBFE" radius={[4, 4, 0, 0]} name="expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No data yet — add income and expenses to see the chart
              </div>
            )}
          </div>

          {/* Spending by Category Donut */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Spending by Category</h2>
            {spending_by_category.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={spending_by_category}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                    >
                      {spending_by_category.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {spending_by_category.slice(0, 5).map((c, i) => (
                    <div key={c.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#475569' }}>{c.category}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', textAlign: 'center' }}>
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>Recent Transactions</h2>
            <Link to="/expenses" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recent_transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '32px 0' }}>
              No recent transactions. Add expenses or income to see them here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent_transactions.map((tx) => {
                const Icon = CATEGORY_ICONS[tx.category] || Wallet
                const bg = CATEGORY_BG[tx.category] || '#F1F5F9'
                const isIncome = tx.type === 'income'
                return (
                  <div key={`${tx.type}-${tx.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 0', borderBottom: '1px solid #F8FAFC'
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color={isIncome ? '#10B981' : '#475569'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 2 }}>{tx.title}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{tx.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isIncome ? '#10B981' : '#1E293B' }}>
                        {isIncome ? '+' : ''}{fmt(Math.abs(tx.amount))}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
