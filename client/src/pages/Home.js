import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  Crown,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../components/Cards/StatCard";
import Card from "../components/Cards/Card";
import LockedBtn from "../components/Access/LockedButton";
import FeatureLock from "../components/Access/FeatureLock";
import { ROLE_META, catColors } from "../data/constants";
import { useEffect, useState } from "react";
import ExpenseModal from "../components/Modals/ExpenseModal";
import IncomeModal from "../components/Modals/IncomeModal";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useAnalytics } from "../context/AnalyticsContext";
import useScreenNavigate from "../hooks/useScreenNavigate";
import api from "../services/api";
import { canDo } from "../utils/permissions";
import { formatMonthLabel, parseISODate } from "../utils/formatDate";

// Shown (blurred) to Students behind the Premium lock.
const PREVIEW_INSIGHTS = [
  { kind: "positive", title: "Spending on track", body: "You are 12% under budget this month. Great discipline!" },
  { kind: "warning", title: "Food budget alert", body: "Food & Dining is at 80% — consider limiting dining out this week." },
  { kind: "tip", title: "Savings opportunity", body: "Redirect ₹1,200 saved on Travel to your Japan Trip goal." },
];
const INSIGHT_STYLE = {
  positive: { icon: TrendingUp, color: "#22c55e" },
  warning: { icon: AlertTriangle, color: "#f59e0b" },
  tip: { icon: Target, color: "#2E93C7" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
}

function trendSub(pct, suffix) {
  if (pct === null || pct === undefined) return `No data ${suffix}`;
  return `${pct > 0 ? "+" : ""}${pct}% ${suffix}`;
}

// ── Dashboard ──────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const { expenses, goals, selectedDate, selectedMonth, monthlyBudget, saveExpense, saveIncome, dataVersion } = useFinance();
  const { data, monthlyTrend, categoryExpenses } = useAnalytics();
  const navigate = useScreenNavigate();
  const role = user?.role ?? "student";
  const profileName = user?.name ?? "";
  const [addExpModal, setAddExpModal] = useState(false);
  const [addIncModal, setAddIncModal] = useState(false);
  const [insights, setInsights] = useState(PREVIEW_INSIGHTS);

  useEffect(() => {
    if (!canDo(role, "ai_insights")) return;
    api.getInsights().then(setInsights).catch(() => {});
  }, [role, dataVersion]);

  const openAddExpense = () => setAddExpModal(true);
  const openAddIncome = () => setAddIncModal(true);
  const totalExp = data.total_spending || 0;
  const totalInc = data.total_income || 0;
  const stats = data.stats || {};
  const monthName = formatMonthLabel(selectedMonth, "long").split(" ")[0];
  const budgetRemaining = monthlyBudget - totalExp;
  const budgetPct = monthlyBudget > 0 ? Math.round((totalExp / monthlyBudget) * 100) : 0;
  const trend = data.monthly_trends || [];
  const prev = trend.length > 1 ? trend[trend.length - 2] : null;
  const savingsThisMonth = Math.max(totalInc - totalExp, 0);
  const savingsChange = prev && prev.savings ? Math.round(((savingsThisMonth - prev.savings) / prev.savings) * 1000) / 10 : null;
  const prevMonthName = prev ? formatMonthLabel(prev.month, "short").split(" ")[0] : "last month";

  return (
    <div className="space-y-6">
      {addExpModal && <ExpenseModal onSave={saveExpense} onClose={() => setAddExpModal(false)} />}
      {addIncModal && <IncomeModal onSave={saveIncome} onClose={() => setAddIncModal(false)} />}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0C2A45 0%, #0D6D91 60%, #2E93C7 100%)",
        }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-64 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 80% 50%, #B9D2E7, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-blue-200 text-sm mb-1">{greeting()}</p>
            <h2 className="text-3xl font-bold font-['Poppins'] mb-1">{profileName} 👋</h2>
            <p className="text-blue-200 text-sm">
              {parseISODate(selectedDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Here&apos;s your financial overview
            </p>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[
              {
                label: "Monthly Balance",
                value: `${totalInc - totalExp < 0 ? "-" : ""}₹${Math.abs(totalInc - totalExp).toLocaleString()}`,
                color: "text-white",
              },
              {
                label: "Total Income",
                value: `₹${totalInc.toLocaleString()}`,
                color: "text-green-300",
              },
              {
                label: "Total Expenses",
                value: `₹${totalExp.toLocaleString()}`,
                color: "text-red-300",
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-blue-200 text-xs mb-1">{s.label}</p>
                <p className={`text-xl font-bold font-['Poppins'] ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Spending"
          value={`₹${(stats.today_spending ?? 0).toLocaleString()}`}
          sub={trendSub(stats.today_change_pct, "vs yesterday")}
          trend={stats.today_change_pct > 0 ? "up" : stats.today_change_pct < 0 ? "down" : undefined}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-[#2E93C7] to-[#0D6D91]"
        />
        <StatCard
          label="Budget Remaining"
          value={`${budgetRemaining < 0 ? "-" : ""}₹${Math.abs(budgetRemaining).toLocaleString()}`}
          sub={monthlyBudget > 0 ? `${budgetPct}% of ${monthName} budget used` : "Set a monthly budget"}
          trend={budgetPct >= 90 ? "down" : undefined}
          icon={Wallet}
          gradient="bg-gradient-to-br from-[#0D6D91] to-[#143452]"
        />
        <StatCard
          label="Savings This Month"
          value={`₹${savingsThisMonth.toLocaleString()}`}
          sub={trendSub(savingsChange, `vs ${prevMonthName}`)}
          trend={savingsChange > 0 ? "up" : savingsChange < 0 ? "down" : undefined}
          icon={PiggyBank}
          gradient="bg-gradient-to-br from-[#5FA7D2] to-[#2E93C7]"
        />
        <StatCard
          label="Goals Progress"
          value={`${stats.goals_progress ?? 0}%`}
          sub={`${stats.active_goals ?? 0} active goal${stats.active_goals === 1 ? "" : "s"}`}
          trend={(stats.goals_progress ?? 0) > 0 ? "up" : undefined}
          icon={Target}
          gradient="bg-gradient-to-br from-[#164A72] to-[#0D6D91]"
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Add Expense",
              icon: CreditCard,
              color: "#2E93C7",
              action: openAddExpense,
              feature: null,
            },
            {
              label: "Add Income",
              icon: TrendingUp,
              color: "#0D6D91",
              action: openAddIncome,
              feature: null,
            },
            {
              label: "Set Goal",
              icon: Target,
              color: "#164A72",
              action: () => navigate("savings"),
              feature: null,
            },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)`,
              }}
            >
              <a.icon size={15} />
              {a.label}
            </button>
          ))}
          <LockedBtn
            role={role}
            feature="budget_planning"
            onClick={() => navigate("budgets")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #5FA7D2, #5FA7D2cc)",
            }}
          >
            <Wallet size={15} />
            Create Budget
          </LockedBtn>
        </div>
      </Card>

      {/* AI Insights — Premium/Admin only */}
      <FeatureLock role={role} feature="ai_insights" label="AI Insights">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "#7c3aed20",
              }}
            >
              <Zap
                size={16}
                style={{
                  color: "#7c3aed",
                }}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
            <span
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: ROLE_META.premium.bg,
                color: ROLE_META.premium.color,
              }}
            >
              <Crown size={9} /> Premium
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights
              .map((i) => ({ ...i, ...(INSIGHT_STYLE[i.kind] || INSIGHT_STYLE.tip) }))
              .map((i) => (
              <div key={i.title} className="flex gap-3 p-3 rounded-xl bg-secondary/40">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `${i.color}18`,
                  }}
                >
                  <i.icon
                    size={15}
                    style={{
                      color: i.color,
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{i.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FeatureLock>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryExpenses}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryExpenses.map((e, i) => (
                  <Cell key={`dash-pie-${i}`} fill={e.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryExpenses.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">No expenses recorded for {monthName} yet.</p>
            )}
            {categoryExpenses.slice(0, 4).map((e) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: e.color,
                    }}
                  />
                  <span className="text-muted-foreground">{e.name}</span>
                </div>
                <span className="font-medium text-foreground">₹{e.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="dash-incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E93C7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2E93C7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dash-expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D6D91" stopOpacity={0.2} />
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
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#2E93C7"
                strokeWidth={2}
                fill="url(#dash-incG)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#0D6D91"
                strokeWidth={2}
                fill="url(#dash-expG)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <button
            onClick={() => navigate("expenses")}
            className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {expenses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet — add your first expense.</p>
          )}
          {expenses.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `${catColors[e.cat] ?? "#2E93C7"}18`,
                }}
              >
                <CreditCard
                  size={16}
                  style={{
                    color: catColors[e.cat] ?? "#2E93C7",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.desc}</p>
                <p className="text-xs text-muted-foreground">
                  {e.cat} · {e.date}
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground">-₹{e.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Savings Goals</h3>
          <button
            onClick={() => navigate("savings")}
            className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
          >
            Manage goals <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-4">
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No savings goals yet — tap “Set Goal” to create one.</p>
          )}
          {goals.map((g) => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{g.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{g.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-foreground">₹{g.saved.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground"> / ₹{g.target.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${g.color}, ${g.color}99)`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{pct}% achieved</span>
                  <span className="text-xs text-muted-foreground">{g.deadline ? `Due ${g.deadline}` : "No deadline"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
