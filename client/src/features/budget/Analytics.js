import React, { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Legend,
} from "recharts";
import { CreditCard, Utensils, PiggyBank, Zap } from "lucide-react";
import "./BudgetAnalytics.css";

const FALLBACK_CATEGORIES = [
  { name: "Food & Dining", value: 3200, color: "#2E93C7" },
  { name: "Travel", value: 1800, color: "#0D6D91" },
  { name: "Shopping", value: 2400, color: "#5FA7D2" },
  { name: "Education", value: 1200, color: "#8DBEE3" },
  { name: "Entertainment", value: 900, color: "#B9D2E7" },
  { name: "Miscellaneous", value: 700, color: "#164A72" },
];
const monthlyTrend = [
  { month: "Jan", income: 12000, expenses: 8200, savings: 3800 },
  { month: "Feb", income: 12000, expenses: 7800, savings: 4200 },
  { month: "Mar", income: 13500, expenses: 9100, savings: 4400 },
  { month: "Apr", income: 12000, expenses: 6900, savings: 5100 },
  { month: "May", income: 14000, expenses: 8700, savings: 5300 },
  { month: "Jun", income: 12000, expenses: 7200, savings: 4800 },
  { month: "Jul", income: 15000, expenses: 9800, savings: 5200 },
];
const savingsGrowth = [
  { month: "Jan", amount: 8000 }, { month: "Feb", amount: 12200 },
  { month: "Mar", amount: 16600 }, { month: "Apr", amount: 21700 },
  { month: "May", amount: 27000 }, { month: "Jun", amount: 31800 },
  { month: "Jul", amount: 37000 },
];
function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}
function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }

export default function Analytics() {
  const budgets = readStorage("bb_budgets", []);
  const expenses = readStorage("bb_expenses", []);
  const income = readStorage("bb_income", []);
  const categories = useMemo(() => {
    if (Array.isArray(expenses) && expenses.length) {
      const totals = {};
      expenses.forEach((item) => {
        const category = item.cat || item.category || "Miscellaneous";
        totals[category] = (totals[category] || 0) + Number(item.amount || 0);
      });
      return Object.entries(totals).map(([name, value], index) => ({
        name, value, color: (budgets.find((b) => b.cat === name)?.color) || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].color,
      }));
    }
    if (Array.isArray(budgets) && budgets.length) {
      return budgets.map((item, index) => ({
        name: item.cat, value: Number(item.spent || 0),
        color: item.color || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].color,
      }));
    }
    return FALLBACK_CATEGORIES;
  }, [expenses, budgets]);

  const totalIncome = Array.isArray(income) && income.length
    ? income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : monthlyTrend[6].income;
  const totalExpenses = Array.isArray(expenses) && expenses.length
    ? expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : categories.reduce((sum, item) => sum + item.value, 0);
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((totalIncome - totalExpenses) / totalIncome * 1000) / 10) : 0;
  const averageDaily = Math.round(totalExpenses / new Date().getDate());
  const topCategory = [...categories].sort((a, b) => b.value - a.value)[0];
  const stats = [
    { label: "Avg Daily Spending", value: money(averageDaily), sub: "Based on current data", icon: CreditCard, color: "blue" },
    { label: "Top Category", value: topCategory?.name || "—", sub: topCategory ? `${money(topCategory.value)} spent` : "No spending yet", icon: Utensils, color: "navy" },
    { label: "Savings Rate", value: `${savingsRate}%`, sub: "Income minus expenses", icon: PiggyBank, color: "sky" },
    { label: "Budget Efficiency", value: `${Math.max(0, Math.min(100, Math.round((1 - totalExpenses / Math.max(totalIncome, 1)) * 100)))}%`, sub: "Based on income and expenses", icon: Zap, color: "deep" },
  ];

  return (
    <div className="ba-page">
      <div className="ba-page-heading ba-analytics-heading">
        <div><h1>Analytics</h1><p>Deep insights into your financial habits</p></div>
      </div>

      <div className="ba-analytics-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <section className="ba-card ba-stat-card" key={stat.label}>
              <div className={`ba-stat-icon ba-stat-${stat.color}`}><Icon size={19} /></div>
              <div className="ba-stat-copy"><p>{stat.label}</p><strong>{stat.value}</strong><small>{stat.sub}</small></div>
            </section>
          );
        })}
      </div>

      <div className="ba-analytics-grid">
        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Expenses by Category</h2>
          <div className="ba-donut-layout ba-analytics-donut-layout">
            <div className="ba-donut">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={49} outerRadius={78} paddingAngle={3}>
                    {categories.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ba-legend">
              {categories.map((item) => (
                <div className="ba-legend-row" key={item.name}>
                  <span className="ba-legend-name"><i style={{ background: item.color }} />{item.name}</span>
                  <strong>{(item.value / 1000).toFixed(1)}k</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyTrend} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value) => money(value)} />
              <Legend />
              <Bar dataKey="income" fill="#2E93C7" radius={[3, 3, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#8DBEE3" radius={[3, 3, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Monthly Spending Trend</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value) => money(value)} />
              <Legend />
              <Line type="monotone" dataKey="expenses" stroke="#2E93C7" strokeWidth={2.5} dot={{ fill: "#2E93C7", r: 4 }} name="Expenses" />
              <Line type="monotone" dataKey="savings" stroke="#0D6D91" strokeWidth={2.5} dot={{ fill: "#0D6D91", r: 4 }} name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="ba-card ba-chart-card">
          <h2 className="ba-card-title">Savings Growth</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={savingsGrowth}>
              <defs><linearGradient id="ba-savings-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D6D91" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0D6D91" stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5FA7D2" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value) => money(value)} />
              <Area type="monotone" dataKey="amount" stroke="#0D6D91" strokeWidth={2.5} fill="url(#ba-savings-gradient)" name="Savings" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>
      <p className="ba-data-note">Charts use your saved budget and transaction data where available. Monthly trend and savings growth currently use sample Figma data.</p>
    </div>
  );
}
