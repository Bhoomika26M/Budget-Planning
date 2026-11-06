import React, { useEffect, useState } from 'react'
import {
  AlertCircle, BarChart3, CircleDollarSign, RefreshCw,
  TrendingDown, TrendingUp, Wallet
} from 'lucide-react'
import {
  Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import './Analytics.css'

const COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#6366F1', '#10B981']

export default function Analytics() {
  const [period, setPeriod] = useState(6)
  const [data, setData] = useState(null)
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const [analyticsResult, profileResult] = await Promise.all([
        api.get('/analytics', { params: { period } }),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setData(analyticsResult.data)
      setCurrency(profileResult.data?.currency || 'INR')
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map(item => item.msg || 'Invalid request').join(', ') : typeof detail === 'string' ? detail : 'Unable to load analytics data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const symbols = { INR: 'â‚¹', USD: '$', EUR: 'â‚¬', GBP: 'Â£' }
  const money = (value) => `${symbols[currency] || currency}${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}`

  const overview = data?.financial_overview || {}
  const expenses = data?.expense_analysis || {}
  const budget = data?.budget_analysis || {}
  const savings = data?.savings_analysis || {}
  const net = Number(overview.net_surplus || 0)
  const hasFinancialData = Number(overview.total_income || 0) > 0 ||
    Number(overview.total_expenses || 0) > 0 ||
    (budget.categories || []).length > 0 ||
    (data?.savings_analysis?.total_target || 0) > 0

  return (
    <AppLayout>
      <div className="analytics-page">
        <div className="analytics-heading">
          <div>
            <p className="analytics-eyebrow">FINANCIAL PERFORMANCE</p>
            <h1>Analytics</h1>
            <p>Understand your income, spending and financial progress.</p>
          </div>
          <label className="analytics-period">
            Period
            <select value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="analytics-state"><RefreshCw size={26} className="spin" /> Loading analytics...</div>
        ) : error ? (
          <div className="analytics-error">
            <AlertCircle size={22} />
            <div><strong>Analytics could not be loaded</strong><p>{error}</p></div>
            <button type="button" onClick={loadAnalytics}>Retry</button>
          </div>
        ) : !hasFinancialData ? (
          <div className="analytics-state analytics-empty">
            <BarChart3 size={40} />
            <h2>No analytics available yet</h2>
            <p>Add income, expenses, budgets or savings goals to see your financial trends.</p>
          </div>
        ) : (
          <>
            <section className="analytics-overview">
              <article className="analytics-stat">
                <div><span>Total Income</span><TrendingUp size={20} /></div>
                <h2>{money(overview.total_income)}</h2>
                <p>Selected period</p>
              </article>
              <article className="analytics-stat">
                <div><span>Total Expenses</span><TrendingDown size={20} /></div>
                <h2>{money(overview.total_expenses)}</h2>
                <p>Selected period</p>
              </article>
              <article className={`analytics-stat ${net >= 0 ? 'positive' : 'negative'}`}>
                <div><span>{net >= 0 ? 'Net Surplus' : 'Net Deficit'}</span><CircleDollarSign size={20} /></div>
                <h2>{money(Math.abs(net))}</h2>
                <p>{net >= 0 ? 'Income exceeds expenses' : 'Expenses exceed income'}</p>
              </article>
              <article className="analytics-stat">
                <div><span>Savings Rate</span><Wallet size={20} /></div>
                <h2>{Number(overview.savings_rate || 0).toFixed(1)}%</h2>
                <p>{overview.total_income > 0 ? 'Of total income' : 'Income not recorded'}</p>
              </article>
            </section>

            <section className="analytics-charts-grid">
              <article className="analytics-chart-card analytics-chart-wide">
                <div className="analytics-chart-title">
                  <div><h2>Income vs Expenses</h2><p>Monthly cash flow comparison</p></div>
                </div>
                <div className="analytics-chart" role="img" aria-label="Income versus expenses bar chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data.monthly_trends} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => money(value)} />
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#2563EB" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="analytics-chart-card analytics-chart-wide">
                <div className="analytics-chart-title">
                  <div><h2>Monthly Net Flow</h2><p>Surplus or deficit by month</p></div>
                </div>
                <div className="analytics-chart" role="img" aria-label="Monthly net surplus and deficit line chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthly_trends} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => money(value)} />
                      <Tooltip formatter={(value) => money(value)} />
                      <Line type="monotone" dataKey="net" name="Net flow" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="analytics-chart-card">
                <div className="analytics-chart-title"><div><h2>Spending by Category</h2><p>Share of selected-period spending</p></div></div>
                {expenses.spending_by_category?.length ? (
                  <div className="analytics-donut-layout">
                    <div className="analytics-chart analytics-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={expenses.spending_by_category} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={82} paddingAngle={2}>
                            {expenses.spending_by_category.map((entry, index) => <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => money(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="analytics-chart-empty">No category spending recorded.</div>
                )}
              </article>

              <article className="analytics-chart-card">
                <div className="analytics-chart-title"><div><h2>Budget Usage</h2><p>Current-month allocation and spending</p></div></div>
                {budget.categories?.length ? (
                  <div className="analytics-budget-list">
                    {budget.categories.map((item) => (
                      <div className="analytics-budget-item" key={`${item.category}-${item.budget}`}>
                        <div><strong>{item.category}</strong><span>{money(item.spent)} / {money(item.budget)}</span></div>
                        <div className="analytics-budget-track">
                          <div className={item.usage_percentage >= 100 ? 'over' : item.usage_percentage >= 80 ? 'warning' : ''} style={{ width: `${Math.min(item.usage_percentage, 100)}%` }} />
                        </div>
                        <small>{Number(item.usage_percentage).toFixed(1)}% used</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="analytics-chart-empty">No current-month budgets are set.</div>
                )}
              </article>
            </section>

            <section className="analytics-bottom-grid">
              <article className="analytics-chart-card">
                <div className="analytics-chart-title"><div><h2>Savings Overview</h2><p>Progress across all goals</p></div></div>
                <div className="analytics-savings-summary">
                  <div><span>Total saved</span><strong>{money(savings.total_saved)}</strong></div>
                  <div><span>Target amount</span><strong>{money(savings.total_target)}</strong></div>
                </div>
                <div className="analytics-savings-progress">
                  <div><span>Overall progress</span><strong>{Number(savings.overall_progress || 0).toFixed(1)}%</strong></div>
                  <div className="analytics-budget-track"><div style={{ width: `${Math.min(savings.overall_progress || 0, 100)}%` }} /></div>
                </div>
                <div className="analytics-goal-counts">
                  <span><strong>{savings.active_goals || 0}</strong> Active goals</span>
                  <span><strong>{savings.completed_goals || 0}</strong> Completed goals</span>
                </div>
              </article>

              <article className="analytics-chart-card analytics-insights">
                <div className="analytics-chart-title"><div><h2>Key Insights</h2><p>Based on your recorded financial data</p></div></div>
                <div className="analytics-insight">
                  <strong>Highest spending category</strong>
                  <p>{expenses.highest_spending_category
                    ? `${expenses.highest_spending_category.category}: ${money(expenses.highest_spending_category.amount)}`
                    : 'No expense category data is available for this period.'}</p>
                </div>
                <div className="analytics-insight">
                  <strong>Highest-expense month</strong>
                  <p>{data.insights?.highest_expense_month
                    ? `${data.insights.highest_expense_month.label}: ${money(data.insights.highest_expense_month.expenses)}`
                    : 'There are no expenses in this period.'}</p>
                </div>
                <div className={`analytics-insight ${net < 0 ? 'negative' : ''}`}>
                  <strong>Net cash flow</strong>
                  <p>{net > 0
                    ? `Your income exceeded expenses by ${money(net)} in this period.`
                    : net < 0
                      ? `Your expenses exceeded income by ${money(Math.abs(net))} in this period.`
                      : 'Income and expenses are equal, or neither has been recorded for this period.'}</p>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  )
}
