import { useState } from "react";
import { ChevronRight, CreditCard, Download, Edit2, Plus, Trash2, TrendingUp } from "lucide-react";
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
import IncomeModal from "../components/Modals/IncomeModal";
import Modal from "../components/Modals/Modal";
import LockedBtn from "../components/Access/LockedButton";
import Card from "../components/Cards/Card";
import ConfirmDialog from "../components/Modals/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useAnalytics } from "../context/AnalyticsContext";
import useScreenNavigate from "../hooks/useScreenNavigate";
import { downloadCSV } from "../utils/download";
import { formatDisplayDate, formatMonthLabel, monthKey, parseISODate, toISODate } from "../utils/formatDate";
import { pctChange } from "../utils/formatCurrency";

const sum = (list) => list.reduce((s, x) => s + x.amount, 0);

function shiftMonth(key, delta) {
  const d = parseISODate(`${key}-01`);
  d.setMonth(d.getMonth() + delta);
  return monthKey(toISODate(d));
}

// Months covered by the breakdown toggle (Monthly / Quarterly / Yearly)
function periodMonths(selectedMonth, period) {
  if (period === "Monthly") return [selectedMonth];
  if (period === "Quarterly") return [0, -1, -2].map((d) => shiftMonth(selectedMonth, d));
  return Array.from({ length: 12 }, (_, i) => `${selectedMonth.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`);
}

// ── Income ─────────────────────────────────────────────────────────
export default function IncomeScreen() {
  const { user } = useAuth();
  const { incomeList, expenses: allExpenses, selectedMonth, saveIncome, deleteIncome } = useFinance();
  const { monthlyTrend } = useAnalytics();
  const navigate = useScreenNavigate();
  const role = user?.role ?? "student";
  const expenses = allExpenses.filter((e) => e.status !== "Cancelled");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [breakdownPeriod, setBreakdownPeriod] = useState("Monthly");
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Stat cards: the month chosen in the header calendar vs the month before
  const inMonth = (list, key) => list.filter((x) => monthKey(x.dateIso) === key);
  const prevMonth = shiftMonth(selectedMonth, -1);
  const totalIncome = sum(inMonth(incomeList, selectedMonth));
  const totalExpense = sum(inMonth(expenses, selectedMonth));
  const netCashFlow = totalIncome - totalExpense;
  const freelanceAmt = sum(inMonth(incomeList, selectedMonth).filter((i) => i.source === "Freelance"));
  const incomeChange = pctChange(totalIncome, sum(inMonth(incomeList, prevMonth)));
  const expenseChange = pctChange(totalExpense, sum(inMonth(expenses, prevMonth)));
  const fmtPct = (v) => (v === null ? "New" : `${v > 0 ? "+" : ""}${v}%`);
  const monthLabel = formatMonthLabel(selectedMonth, "short");
  const allActivity = [
    ...incomeList.map((i) => ({
      id: `inc-${i.id}`,
      label: i.source,
      sub: i.date,
      dateIso: i.dateIso,
      type: "income",
      amount: i.amount,
    })),
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      label: e.desc,
      sub: e.date,
      dateIso: e.dateIso,
      type: "expense",
      amount: e.amount,
    })),
  ].sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const recentActivity = allActivity.slice(0, 5);
  const breakdownMonths = periodMonths(selectedMonth, breakdownPeriod);
  const catTotals = expenses.filter((e) => breakdownMonths.includes(monthKey(e.dateIso))).reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] ?? 0) + e.amount;
    return acc;
  }, {});
  const PIE_COLORS = ["#1e3a5f", "#2E93C7", "#5FA7D2", "#8DBEE3", "#b8d4e8", "#ddeaf5"];
  const breakdownData = Object.entries(catTotals).map(([name, value], i) => ({
    name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  // Upcoming = next expected payment of each monthly / weekly source
  const upcoming = Object.values(
    incomeList
      .filter((i) => i.freq === "Monthly" || i.freq === "Weekly")
      .reduce((acc, i) => {
        if (!acc[i.source] || acc[i.source].dateIso < i.dateIso) acc[i.source] = i;
        return acc;
      }, {}),
  )
    .map((i) => {
      const next = parseISODate(i.dateIso);
      const today = toISODate();
      while (toISODate(next) <= today) {
        if (i.freq === "Weekly") next.setDate(next.getDate() + 7);
        else next.setMonth(next.getMonth() + 1);
      }
      return { ...i, nextIso: toISODate(next), date: formatDisplayDate(toISODate(next)) };
    })
    .sort((a, b) => a.nextIso.localeCompare(b.nextIso))
    .slice(0, 5);
  const statCards = [
    {
      label: "Total Revenue",
      value: totalIncome,
      positive: incomeChange === null || incomeChange >= 0,
      badge: fmtPct(incomeChange),
      sub: `${monthLabel} · all sources`,
      action: "",
      dest: "reports",
    },
    {
      label: "Total Expenses",
      value: totalExpense,
      positive: expenseChange !== null && expenseChange <= 0,
      badge: fmtPct(expenseChange),
      sub: `${monthLabel}`,
      action: "Review Expenses",
      dest: "expenses",
    },
    {
      label: "Net Cash Flow",
      value: netCashFlow,
      positive: netCashFlow >= 0,
      badge: netCashFlow >= 0 ? "Surplus" : "Deficit",
      sub: "Income − Expenses",
      action: "See Reports",
      dest: "reports",
    },
    {
      label: "Freelance",
      value: freelanceAmt,
      positive: true,
      badge: "One-time",
      sub: `Freelance earnings · ${monthLabel}`,
      action: "View Analytics",
      dest: "analytics",
    },
  ];
  return (
    <div className="space-y-5">
      {confirmDelete && (
        <ConfirmDialog
          icon={Trash2}
          danger
          title="Delete Income"
          sub={`${confirmDelete.source} · ₹${confirmDelete.amount.toLocaleString()} · ${confirmDelete.date}`}
          body="This income entry will be permanently removed."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteIncome(confirmDelete.id).catch(() => {});
            setConfirmDelete(null);
          }}
        />
      )}
      {modal && (
        <IncomeModal
          initial={modal === "add" ? undefined : modal}
          onSave={saveIncome}
          onClose={() => setModal(null)}
        />
      )}
      {showAllActivity && (
        <Modal title="All Activity" onClose={() => setShowAllActivity(false)}>
          <div className="space-y-0 max-h-[60vh] overflow-y-auto pr-1">
            {allActivity.map((a, idx) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 py-2.5 ${idx < allActivity.length - 1 ? "border-b border-border/60" : ""}`}
              >
                <div
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${a.type === "income" ? "bg-primary/10" : "bg-muted"}`}
                >
                  {a.type === "income" ? (
                    <TrendingUp size={13} className="text-primary" />
                  ) : (
                    <CreditCard size={13} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{a.sub}</p>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${a.type === "income" ? "text-primary" : "text-muted-foreground"}`}
                >
                  {a.type === "income" ? "+" : "−"}₹{a.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Income Management</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your revenue, cash flow and income sources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LockedBtn
            role={role}
            feature="export_csv"
            onClick={() =>
              downloadCSV(
                [["Source", "Amount", "Date", "Frequency"], ...incomeList.map((i) => [i.source, i.amount, i.dateIso, i.freq])],
                "income.csv",
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-secondary transition"
            style={{}}
          >
            <Download size={15} /> Export CSV
          </LockedBtn>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
          >
            <Plus size={16} /> Add Income
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4 border border-border flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                {s.label}
              </p>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ml-1 ${s.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
              >
                {s.badge}
              </span>
            </div>
            <p className="text-2xl font-bold font-['Poppins'] text-foreground leading-none">
              ₹{Math.abs(s.value).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            {s.action && (
              <div className="mt-auto pt-3 border-t border-border/60">
                <button
                  onClick={() => navigate(s.dest)}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  {s.action} <ChevronRight size={12} />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Cash Flow Analysis + Recent Activity */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch"
        style={{
          gridAutoRows: "320px",
        }}
      >
        <Card className="p-5 border border-border lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Cash Flow Analysis</h3>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block bg-[#2E93C7] rounded" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block bg-[#f59e0b] rounded" />
                Expenses
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrend}
                margin={{
                  top: 8,
                  right: 8,
                  left: 8,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="cf-income-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E93C7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2E93C7" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="cf-expense-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v, name) => [`₹${v.toLocaleString()}`, name]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2E93C7"
                  strokeWidth={2.5}
                  fill="url(#cf-income-grad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#cf-expense-grad)"
                  fillOpacity={0.6}
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                  name="Expenses"
                  strokeDasharray="0"
                  style={{
                    isolation: "isolate",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <button
              onClick={() => setShowAllActivity(true)}
              className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
            >
              Show All <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {recentActivity.map((a, idx) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 py-2.5 ${idx < recentActivity.length - 1 ? "border-b border-border/60" : ""}`}
              >
                {/* Type icon badge */}
                <div
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${a.type === "income" ? "bg-primary/10" : "bg-muted"}`}
                >
                  {a.type === "income" ? (
                    <TrendingUp size={13} className="text-primary" />
                  ) : (
                    <CreditCard size={13} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{a.sub}</p>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${a.type === "income" ? "text-primary" : "text-muted-foreground"}`}
                >
                  {a.type === "income" ? "+" : "−"}₹{a.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row: Breakdown + Sources + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense Breakdown */}
        <Card className="p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Expense Breakdown</h3>
            <button
              onClick={() => navigate("reports")}
              className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
            >
              View Report <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] mb-3 w-fit">
            {["Monthly", "Quarterly", "Yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setBreakdownPeriod(p)}
                className={`px-3 py-1.5 font-medium transition-colors ${breakdownPeriod === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {breakdownData.map((d, i) => (
                  <Cell key={`breakdown-${i}`} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`₹${v.toLocaleString()}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {breakdownData.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{
                    background: d.color,
                  }}
                />
                <span className="text-xs text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="text-xs font-semibold text-foreground">₹{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Income Sources */}
        <Card className="p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Income Sources</h3>
            <button
              onClick={() => setModal("add")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-0">
            {incomeList.slice(0, 5).map((i, idx) => (
              <div
                key={i.id}
                className={`flex items-center justify-between py-2.5 ${idx < Math.min(incomeList.length, 5) - 1 ? "border-b border-border/60" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{i.source}</p>
                  <p className="text-[10px] text-muted-foreground">{i.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-foreground">₹{i.amount.toLocaleString()}</span>
                  <button
                    onClick={() => setModal(i)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <LockedBtn
                    role={role}
                    feature="delete_income"
                    onClick={() => setConfirmDelete(i)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </LockedBtn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming / Recurring */}
        <Card className="p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Income</h3>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Recurring
            </span>
          </div>
          <div className="space-y-0">
            {upcoming.length > 0 ? (
              upcoming.map((i, idx) => (
                <div
                  key={i.id}
                  className={`flex items-center justify-between py-2.5 ${idx < upcoming.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{i.source}</p>
                    <p className="text-[10px] text-muted-foreground">{i.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0 ml-3">
                    ₹{i.amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No recurring income set</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
