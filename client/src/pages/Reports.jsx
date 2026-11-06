import React, { useEffect, useState } from 'react'
import { AlertCircle, FileText, RefreshCw } from 'lucide-react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'
import './Reports.css'

export default function Reports() {
  const [report, setReport] = useState(null)
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async () => {
    setLoading(true)
    setError('')
    try {
      const [reportResult, profileResult] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/profile').catch(() => ({ data: {} }))
      ])
      setReport(reportResult.data)
      setCurrency(profileResult.data?.currency || 'INR')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReport() }, [])

  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  const money = (value) => `${symbols[currency] || currency}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`

  return (
    <AppLayout>
      <div className="reports-page">
        <div className="reports-heading">
          <div>
            <p className="reports-eyebrow">PREMIUM REPORTING</p>
            <h1>Financial Reports</h1>
            <p>Review a current-month summary of your financial activity.</p>
          </div>
        </div>

        {loading ? (
          <div className="reports-state"><RefreshCw size={26} className="spin" /> Loading report...</div>
        ) : error ? (
          <div className="reports-error" role="alert">
            <AlertCircle size={22} />
            <span>{error}</span>
            <button type="button" onClick={loadReport}>Retry</button>
          </div>
        ) : (
          <>
            <section className="reports-overview">
              <article><span>Total Income</span><strong>{money(report.financial_overview.total_income)}</strong></article>
              <article><span>Total Expenses</span><strong>{money(report.financial_overview.total_expenses)}</strong></article>
              <article><span>Net</span><strong>{money(report.financial_overview.net)}</strong></article>
              <article><span>Savings Saved / Target</span><strong>{money(report.savings.total_saved)} / {money(report.savings.total_target)}</strong></article>
            </section>
            <section className="reports-card">
              <h2>Spending by Category</h2>
              <p className="reports-month">Report month: {report.month}</p>
              {report.spending_by_category.length ? (
                <div className="reports-table-wrap">
                  <table>
                    <thead><tr><th>Category</th><th>Amount</th></tr></thead>
                    <tbody>
                      {report.spending_by_category.map((item) => (
                        <tr key={item.category}><td>{item.category}</td><td>{money(item.amount)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="reports-empty"><FileText size={32} /><p>No expense data is available for this month.</p></div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  )
}
