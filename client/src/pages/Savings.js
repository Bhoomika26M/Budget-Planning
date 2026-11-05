import { useState } from "react";
import { motion } from "motion/react";
import {
  BarChart2,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Edit2,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GoalModal from "../components/Modals/GoalModal";
import Modal from "../components/Modals/Modal";
import ExtendDeadlineModal from "../components/Modals/ExtendDeadlineModal";
import AddSavingsModal from "../components/Modals/AddSavingsModal";
import GoalSuccessPopup from "../components/Modals/GoalSuccessPopup";
import Card from "../components/Cards/Card";
import LockedBtn from "../components/Access/LockedButton";
import CircleProgress from "../components/Cards/CircleProgress";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useAnalytics } from "../context/AnalyticsContext";
import { daysUntil } from "../utils/formatDate";

// ── Savings ────────────────────────────────────────────────────────

export default function SavingsScreen() {
  const { user } = useAuth();
  const { goals, contributions, saveGoal, deleteGoal, contribute } = useFinance();
  const { savingsGrowth } = useAnalytics({ months: 7 });
  const role = user?.role ?? "student";
  const [modal, setModal] = useState(null);
  const [addSav, setAddSav] = useState(null);
  const [successGoal, setSuccessGoal] = useState(null);
  const [sortKey, setSortKey] = useState("deadline");
  const [sortDir, setSortDir] = useState("asc");
  const [showAllContribs, setShowAllContribs] = useState(false);
  const [extendGoal, setExtendGoal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // deadlines are ISO dates (YYYY-MM-DD) from the API
  function isOverdue(deadlineIso) {
    if (!deadlineIso) return false;
    return daysUntil(deadlineIso) < 0;
  }
  const SORT_OPTIONS = [
    {
      key: "deadline",
      label: "Target Date",
    },
    {
      key: "target",
      label: "Total Amount",
    },
    {
      key: "saved",
      label: "Amount Saved",
    },
    {
      key: "remaining",
      label: "Remaining Amount",
    },
    {
      key: "progress",
      label: "% Progress",
    },
  ];
  function sortGoals(list) {
    return [...list].sort((a, b) => {
      let av = 0,
        bv = 0;
      if (sortKey === "deadline") {
        av = a.deadlineIso ? new Date(a.deadlineIso).getTime() : Infinity;
        bv = b.deadlineIso ? new Date(b.deadlineIso).getTime() : Infinity;
      } else if (sortKey === "target") {
        av = a.target;
        bv = b.target;
      } else if (sortKey === "saved") {
        av = a.saved;
        bv = b.saved;
      } else if (sortKey === "remaining") {
        av = Math.max(0, a.target - a.saved);
        bv = Math.max(0, b.target - b.saved);
      } else if (sortKey === "progress") {
        av = a.target > 0 ? a.saved / a.target : 0;
        bv = b.target > 0 ? b.saved / b.target : 0;
      }
      if (av === bv) return 0;
      return sortDir === "asc" ? (av < bv ? -1 : 1) : av < bv ? 1 : -1;
    });
  }
  const rawActive = goals.filter((g) => g.saved < g.target);
  const activeGoals = sortGoals(rawActive);
  const completedGoals = goals.filter((g) => g.saved >= g.target);
  const totalSaved = activeGoals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = activeGoals.reduce((s, g) => s + g.target, 0);
  return (
    <div className="space-y-6">
      {modal && (
        <GoalModal
          key={modal === "add" ? "add" : modal.id}
          initial={modal === "add" ? undefined : modal}
          onSave={saveGoal}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <Modal title="Delete Goal" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
              <span className="text-2xl">{confirmDelete.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{confirmDelete.title}</p>
                <p className="text-xs text-muted-foreground">
                  ₹{confirmDelete.saved.toLocaleString()} saved of ₹{confirmDelete.target.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteGoal(confirmDelete.id).catch(() => {});
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {extendGoal && (
        <ExtendDeadlineModal
          goal={extendGoal}
          onSave={(d) => saveGoal({ ...extendGoal, deadlineIso: d })}
          onClose={() => setExtendGoal(null)}
        />
      )}

      {addSav && (
        <AddSavingsModal
          goal={addSav}
          onSave={async (amt) => {
            const updated = await contribute(addSav, amt);
            if (updated.saved >= updated.target) setSuccessGoal(updated);
          }}
          onClose={() => setAddSav(null)}
        />
      )}
      {successGoal && (
        <GoalSuccessPopup
          goal={successGoal}
          onClose={() => setSuccessGoal(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Savings Goals</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Work towards your financial dreams</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
          }}
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Summary stats — based on active goals only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Total Saved",
            value: `₹${totalSaved.toLocaleString()}`,
            icon: PiggyBank,
            g: "from-[#2E93C7] to-[#0D6D91]",
          },
          {
            label: "Target Amount",
            value: `₹${totalTarget.toLocaleString()}`,
            icon: Target,
            g: "from-[#0D6D91] to-[#143452]",
          },
          {
            label: "Overall Progress",
            value: `${totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%`,
            icon: BarChart2,
            g: "from-[#5FA7D2] to-[#2E93C7]",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.g}`}>
              <s.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold font-['Poppins'] text-foreground">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Sort controls */}
      {activeGoals.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Sort by:</span>
          {SORT_OPTIONS.map((opt) => {
            const active = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else {
                    setSortKey(opt.key);
                    setSortDir("asc");
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "text-white border-transparent" : "text-muted-foreground border-border bg-card hover:border-primary/40 hover:text-foreground"}`}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                      }
                    : {}
                }
              >
                {opt.label}
                {active && (
                  <span className="ml-0.5 text-[10px] leading-none">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {activeGoals.map((g) => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            const overdue = isOverdue(g.deadlineIso);
            // days remaining (negative = passed)
            const daysLeft = g.deadlineIso ? daysUntil(g.deadlineIso) : null;
            return (
              <Card key={g.id} className="p-6 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-8 translate-x-8 bg-primary" />

                {/* ── Row 1: emoji + title + actions — fixed height ── */}
                <div className="relative flex items-center justify-between mb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5">{g.emoji}</span>
                    <div className="min-w-0 min-h-[3rem]">
                      <h3 className="text-base font-bold font-['Poppins'] text-foreground leading-snug">
                        {g.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.deadline ? `Due ${g.deadline}` : "No target date"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setModal(g)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <LockedBtn
                      role={role}
                      feature="delete_goal"
                      onClick={() => setConfirmDelete(g)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </LockedBtn>
                  </div>
                </div>

                {/* ── Row 2: circle progress — fixed height ── */}
                <div className="relative flex justify-center my-3">
                  <CircleProgress pct={pct} size={80} stroke={8} color="#2E93C7" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-foreground">{pct}%</span>
                  </div>
                </div>

                {/* ── Row 3: saved / target bar — fixed height ── */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-semibold text-foreground">₹{g.saved.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #2E93C7, #0D6D91)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-semibold text-foreground">₹{g.target.toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Row 4: days remaining + quote ── */}
                {daysLeft !== null && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-2 text-xs font-medium ${overdue ? "bg-red-50 text-red-600" : daysLeft <= 30 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}
                  >
                    <CalendarDays size={12} />
                    {overdue ? "Deadline passed" : daysLeft === 0 ? "Due today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
                    {overdue && (
                      <button onClick={() => setExtendGoal(g)} className="ml-auto underline hover:no-underline">
                        Extend date
                      </button>
                    )}
                  </div>
                )}
                <div className="px-3 py-2 rounded-xl mb-3 bg-secondary border-l-[3px] border-primary">
                  <p className="text-xs italic text-muted-foreground truncate">&quot;{g.quote}&quot;</p>
                </div>

                {/* ── Row 5: button — always at the bottom ── */}
                <button
                  onClick={() => setAddSav(g)}
                  className="mt-auto w-full py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                  }}
                >
                  Add Savings
                </button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Target size={24} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">No active goals</p>
          <p className="text-xs text-muted-foreground">
            Click &quot;New Goal&quot; to start saving towards something meaningful.
          </p>
        </Card>
      )}

      {/* ── Recent Contributions ── */}
      {showAllContribs && (
        <Modal title="All Contributions" onClose={() => setShowAllContribs(false)}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {[...contributions]
              .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #2E93C720, #2E93C710)",
                    }}
                  >
                    {c.goalEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.goalTitle}</p>
                    <p className="text-xs text-muted-foreground">{c.dateLabel}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 shrink-0">
                    +₹{c.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            {contributions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No contributions yet.</p>
            )}
          </div>
        </Modal>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
              }}
            >
              <TrendingUp size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Recent Contributions</h3>
          </div>
          <button
            onClick={() => setShowAllContribs(true)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No contributions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {[...contributions]
              .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
              .slice(0, 3)
              .map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
                  style={{
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {/* Emoji badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-border"
                    style={{
                      background: "linear-gradient(135deg, #EAF4FB, #F6F9FC)",
                    }}
                  >
                    {c.goalEmoji}
                  </div>

                  {/* Goal info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">
                      {c.goalTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.dateLabel}</p>
                  </div>

                  {/* Amount pill */}
                  <div
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold text-green-700"
                    style={{
                      background: "#dcfce7",
                    }}
                  >
                    +₹{c.amount.toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Savings growth chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Savings Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={savingsGrowth}>
            <defs>
              <linearGradient id="sav-areaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E93C7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2E93C7" stopOpacity={0} />
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
            <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Total Savings"]} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#2E93C7"
              strokeWidth={2.5}
              fill="url(#sav-areaG)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Completed goals section */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={13} className="text-green-600" />
              </div>
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Completed Goals</h3>
            </div>
            <div className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {completedGoals.length} achieved
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {completedGoals.map((g) => (
              <motion.div
                key={g.id}
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
              >
                <Card
                  className="p-5 relative overflow-hidden border-green-200"
                  style={{
                    borderColor: "#bbf7d0",
                  }}
                >
                  {/* Green shimmer strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{
                      background: "linear-gradient(90deg, #22c55e, #16a34a)",
                    }}
                  />

                  {/* Watermark tick */}
                  <div className="absolute bottom-3 right-4 text-green-100 text-5xl font-black select-none pointer-events-none leading-none">
                    ✓
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                          style={{
                            background: `${g.color}18`,
                            border: `1.5px solid ${g.color}30`,
                          }}
                        >
                          {g.emoji}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold font-['Poppins'] text-foreground leading-tight">
                            {g.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{g.deadline ? `by ${g.deadline}` : "Completed"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0 mt-0.5">
                        Done ✓
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #22c55e, #16a34a)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Saved ₹{g.saved.toLocaleString()}</span>
                        <span className="font-semibold text-green-600">100%</span>
                      </div>
                    </div>

                    <LockedBtn
                      role={role}
                      feature="delete_goal"
                      onClick={() => setConfirmDelete(g)}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Remove
                    </LockedBtn>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
