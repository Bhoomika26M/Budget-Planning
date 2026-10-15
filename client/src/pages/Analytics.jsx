import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bb-surface)', borderRadius: '12px', padding: '12px 16px', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--bb-border)' }}>
      <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px', color: 'var(--bb-text)', marginBottom: '8px' }}>{label}</div>
      {payload.map((e) => (
        <div key={e.name} style={{ fontSize: '12px', fontWeight: 600, color: e.stroke || e.fill, marginBottom: '3px' }}>
          {e.name}: ${e.value?.toLocaleString() ?? e.value}
        </div>
      ))}
    </div>
  );
};

const PIE_COLORS = ['#4F93A0', '#166879', '#22C55E', '#F4B400', '#EF4444', '#8B5CF6', '#EC4899', '#86B4C1'];
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Analytics({ setCurrentPage }) {
  // MOCKED CONTEXTS: Replaced useAuth and useTheme to fix import errors and allow independent testing.
  const authContext = null; 
  const themeContext = null; 
  
  const currentUser = authContext?.currentUser || null;
  const isDark = themeContext?.isDark || false;
  const tickColor = isDark ? '#5a9aaa' : '#86B4C1';
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Defaults to true during testing so you can view the dashboard
  const isPremium = currentUser?.role === 'premium' || currentUser?.role === 'admin' || !currentUser;

  useEffect(() => {
    let isMounted = true;
    
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetches data for user 1 by default when tested independently
        const query = currentUser?.id ? `?user_id=${encodeURIComponent(currentUser.id)}` : '?user_id=1';
        const response = await fetch(`${API_BASE_URL}/api/analytics${query}`);
        
        if (!response.ok) {
          throw new Error(`Analytics request failed with status: ${response.status}`);
        }
        
        const responseData = await response.json();
        if (isMounted) setData(responseData);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (isPremium) {
      fetchAnalytics();
    } else {
      setIsLoading(false);
    }
    
    return () => { isMounted = false; };
  }, [currentUser?.id, isPremium]);

  if (!isPremium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '48px', textAlign: 'center', gap: '20px' }}>
        <div style={{ width: '72px', height: '72px', background: 'rgba(244,180,0,0.12)', border: '1.5px solid rgba(244,180,0,0.3)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={32} color="#F4B400" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '24px', color: 'var(--bb-text)', margin: '0 0 10px', letterSpacing: '-0.4px' }}>Premium Analytics</h2>
          <p style={{ fontSize: '15px', color: 'var(--bb-text-muted)', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 24px' }}>
            Get full access to spending breakdowns, monthly trends, savings rate analysis, and category insights.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '480px' }}>
          {[
            { icon: <BarChart2 size={18} />, label: 'Monthly Trends' },
            { icon: <TrendingUp size={18} />, label: 'Savings Rate' },
            { icon: <TrendingDown size={18} />, label: 'Expense Analysis' },
          ].map(f => (
            <div key={f.label} style={{ padding: '14px', background: 'var(--bb-tint)', borderRadius: '12px', border: '1px solid var(--bb-border-sub)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#F4B400' }}>{f.icon}</div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--bb-text)' }}>{f.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage?.('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #F4B400, #e09000)', border: 'none', borderRadius: '14px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Poppins', boxShadow: '0 6px 24px rgba(244,180,0,0.35)' }}>
          <Sparkles size={17} /> Upgrade to Premium — Free
        </button>
      </div>
    );
  }

  if (isLoading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--bb-text-muted)' }}>Loading analytics data...</div>;
  if (error) return <div style={{ padding: '48px', textAlign: 'center', color: '#EF4444' }}>Error: {error}</div>;

  const { total_income, total_expenses, savings_rate, avg_tx_amount, monthly_trend, expense_breakdown, has_data } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Income', value: `$${(total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#22C55E' },
          { label: 'Total Expenses', value: `$${(total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#EF4444' },
          { label: 'Savings Rate', value: `${(savings_rate || 0).toFixed(1)}%`, color: '#4F93A0' },
          { label: 'Avg Expense', value: `$${(avg_tx_amount || 0).toFixed(2)}`, color: '#8B5CF6' },
        ].map(k => (
          <div key={k.label} className="solid-card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: '12px', color: 'var(--bb-text-muted)', fontWeight: 500, marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '22px', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {!has_data ? (
        <div className="solid-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--bb-text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-text)', marginBottom: '6px' }}>No data to analyze yet</div>
          <div style={{ fontSize: '13.5px' }}>Add transactions to see your analytics charts and trends.</div>
        </div>
      ) : (
        <>
          <div className="solid-card" style={{ padding: '24px' }}>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: 'var(--bb-text)', marginBottom: '18px' }}>Monthly Income vs Expenses</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly_trend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} /><stop offset="95%" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bb-border-sub)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2.5} fill="url(#ig)" name="Income" dot={false} />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} fill="url(#eg)" name="Expenses" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="solid-card" style={{ padding: '24px' }}>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: 'var(--bb-text)', marginBottom: '18px' }}>Net Savings Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthly_trend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bb-border-sub)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="savings" stroke="#4F93A0" strokeWidth={2.5} dot={{ fill: '#4F93A0', r: 4 }} name="Savings" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="solid-card" style={{ padding: '24px' }}>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: 'var(--bb-text)', marginBottom: '18px' }}>Expense Breakdown</div>
              {(!expense_breakdown || expense_breakdown.length === 0) ? (
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bb-text-muted)', fontSize: '13.5px' }}>No expense data yet</div>
              ) : (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <PieChart width={140} height={140}>
                    <Pie data={expense_breakdown} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                      {expense_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, '']} contentStyle={{ background: 'var(--bb-surface)', border: 'none', borderRadius: '10px' }} />
                  </PieChart>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {expense_breakdown.slice(0, 5).map((b, i) => (
                      <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ color: 'var(--bb-text)' }}>{b.name}</span>
                        </div>
                        <span style={{ color: 'var(--bb-text-muted)', fontWeight: 600 }}>${b.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}