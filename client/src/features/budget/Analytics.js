import { CreditCard, PiggyBank, Utensils, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/Cards/Card";
import { useState } from "react";
import { useAnalytics } from "../../context/AnalyticsContext";
import { useFinance } from "../../context/FinanceContext";
import { formatMonthLabel } from "../../utils/formatDate";

const RANGES = [3, 6, 12];

function efficiencyLabel(pct) {
  if (pct === null || pct === undefined) return "Add budgets to track";
  if (pct >= 85) return "Excellent";
  if (pct >= 60) return "Good";
  return "Needs attention";
}

// ── Analytics ──────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { selectedMonth } = useFinance();
  const [range, setRange] = useState(6);
  const { data, loading, monthlyTrend, savingsGrowth, categoryExpenses } = useAnalytics({ months: range });
  const stats = data.stats || {};
  const monthShort = formatMonthLabel(selectedMonth, "short");
  const prevLabel = data.monthly_trends?.length > 1 ? data.monthly_trends[data.monthly_trends.length - 2].label : "last month";
  const rateChange = stats.savings_rate_change;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Deep insights into your financial habits{loading ? " · updating…" : ""}
          </p>
        </div>
        <div className="flex rounded-xl border border-border overflow-hidden text-xs bg-card">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 font-medium transition-colors ${range === r ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              style={range === r ? { background: "linear-gradient(135deg, #2E93C7, #0D6D91)" } : undefined}
            >
              {r} months
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Avg Daily Spending",
            value: `₹${Math.round(stats.avg_daily_spending ?? 0).toLocaleString()}`,
            sub: monthShort,
            icon: CreditCard,
            g: "from-[#2E93C7] to-[#0D6D91]",
          },
          {
            label: "Top Category",
            value: stats.top_category?.name ?? "—",
            sub: stats.top_category ? `₹${stats.top_category.amount.toLocaleString()} spent` : "No spending yet",
            icon: Utensils,
            g: "from-[#0D6D91] to-[#143452]",
          },
          {
            label: "Savings Rate",
            value: `${stats.savings_rate ?? 0}%`,
            sub: rateChange === null || rateChange === undefined ? `of ${monthShort} income` : `${rateChange > 0 ? "+" : ""}${rateChange}% vs ${prevLabel}`,
            icon: PiggyBank,
            g: "from-[#5FA7D2] to-[#2E93C7]",
          },
          {
            label: "Budget Efficiency",
            value: stats.budget_efficiency === null || stats.budget_efficiency === undefined ? "—" : `${stats.budget_efficiency}%`,
            sub: efficiencyLabel(stats.budget_efficiency),
            icon: Zap,
            g: "from-[#164A72] to-[#0D6D91]",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.g}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-base font-bold font-['Poppins'] text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Expenses by Category · {monthShort}</h3>
          {categoryExpenses.length === 0 && (
            <p className="text-xs text-muted-foreground mb-2">No expenses recorded for {monthShort}.</p>
          )}
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryExpenses.map((e, i) => (
                    <Cell key={`an-pie-${i}`} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryExpenses.map((e) => (
                <div key={e.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: e.color,
                    }}
                  />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{e.name}</span>
                  <span className="text-xs font-medium text-foreground">₹{(e.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="income" fill="#2E93C7" radius={[3, 3, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#8DBEE3" radius={[3, 3, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#2E93C7"
                strokeWidth={2.5}
                dot={{
                  fill: "#2E93C7",
                  r: 4,
                }}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#0D6D91"
                strokeWidth={2.5}
                dot={{
                  fill: "#0D6D91",
                  r: 4,
                }}
                name="Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Savings Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={savingsGrowth}>
              <defs>
                <linearGradient id="analytics-sg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D6D91" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D6D91" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#5FA7D2",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Savings"]} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0D6D91"
                strokeWidth={2.5}
                fill="url(#analytics-sg2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
