import { useState } from "react";
import { AlertTriangle, CalendarDays, Edit2, Plus, Trash2, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import BudgetModal from "../../components/Modals/BudgetModal";
import Modal from "../../components/Modals/Modal";
import Field from "../../components/Forms/Field";
import Input from "../../components/Forms/FormInput";
import PrimaryBtn from "../../components/Buttons/PrimaryButton";
import Card from "../../components/Cards/Card";
import CircleProgress from "../../components/Cards/CircleProgress";
import ConfirmDialog from "../../components/Modals/ConfirmDialog";
import { useFinance } from "../../context/FinanceContext";
import { formatMonthLabel, monthKey } from "../../utils/formatDate";

// ── Budgets ────────────────────────────────────────────────────────
export default function BudgetsScreen() {
  const { budgets, expenses, monthlyBudget, setMonthlyBudget, selectedMonth, saveBudget, deleteBudget } = useFinance();
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [savingBudget, setSavingBudget] = useState(false);
  const [setBudgetModal, setSetBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const totalAlloc = budgets.reduce((s, b) => s + b.allocated, 0);
  // Everything spent this month (not only budgeted categories); cancelled expenses excluded
  const totalSpent = expenses
    .filter((e) => monthKey(e.dateIso) === selectedMonth && e.status !== "Cancelled")
    .reduce((s, e) => s + e.amount, 0);
  const unallocated = Math.max(monthlyBudget - totalAlloc, 0);
  const overAllocated = totalAlloc > monthlyBudget;
  const utilPct = monthlyBudget > 0 ? Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100) : 0;
  const allocPct = monthlyBudget > 0 ? Math.min(Math.round((totalAlloc / monthlyBudget) * 100), 100) : 0;
  const monthLabel = formatMonthLabel(selectedMonth);

  // Horizontal bar chart data
  const utilizationData = budgets.map((b) => ({
    name: b.cat,
    allocated: b.allocated,
    spent: b.spent,
    remaining: Math.max(b.allocated - b.spent, 0),
    pct: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0,
    color: b.color,
  }));

  // Donut data — allocation split
  const allocData = [
    ...budgets.map((b) => ({
      name: b.cat,
      value: b.allocated,
      color: b.color,
    })),
    ...(unallocated > 0
      ? [
          {
            name: "Unallocated",
            value: unallocated,
            color: "#E4EFF7",
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      {confirmDelete && (
        <ConfirmDialog
          icon={Trash2}
          danger
          title="Remove Budget Category"
          sub={`${confirmDelete.cat} · ₹${confirmDelete.allocated.toLocaleString()} limit`}
          body="Your expenses stay as they are — only this category limit is removed."
          confirmLabel="Remove"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteBudget(confirmDelete.id).catch(() => {});
            setConfirmDelete(null);
          }}
        />
      )}
      {modal && (
        <BudgetModal
          key={modal === "add" ? "add" : modal.id}
          initial={modal === "add" ? undefined : modal}
          onSave={saveBudget}
          onClose={() => setModal(null)}
        />
      )}
      {setBudgetModal && (
        <Modal title="Set Monthly Budget" onClose={() => setSetBudgetModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set your total spending limit for{" "}
              <span className="font-semibold text-foreground">{monthLabel}</span>.
            </p>
            <Field label="Monthly Budget (₹)">
              <Input value={budgetInput} onChange={setBudgetInput} placeholder="e.g. 25000" type="number" />
            </Field>
            {Number(budgetInput) < totalAlloc && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  Budget is lower than current allocations (₹{totalAlloc.toLocaleString()}). Consider
                  adjusting categories.
                </p>
              </div>
            )}
            <PrimaryBtn
              disabled={savingBudget}
              onClick={async () => {
                if (budgetInput === "" || Number(budgetInput) < 0) return;
                setSavingBudget(true);
                try {
                  await setMonthlyBudget(Number(budgetInput));
                  setSetBudgetModal(false);
                } catch {
                  /* toast already shown */
                } finally {
                  setSavingBudget(false);
                }
              }}
            >
              {savingBudget ? "Saving…" : "Save Budget"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Budget Planner</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plan, allocate and track your monthly spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBudgetInput(String(monthlyBudget));
              setSetBudgetModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-card hover:bg-secondary transition-colors text-foreground"
          >
            <Wallet size={15} /> Set Budget
          </button>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Monthly Budget Hero */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0C2A45 0%, #0D6D91 60%, #2E93C7 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, #fff, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={14} className="text-blue-300" />
              <p className="text-blue-200 text-sm">{monthLabel}</p>
            </div>
            <h3 className="text-3xl font-bold font-['Poppins']">₹{monthlyBudget.toLocaleString()}</h3>
            <p className="text-blue-200 text-sm mt-0.5">Monthly budget</p>

            {/* Allocation bar */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-blue-200">
                <span>Allocated ({allocPct}%)</span>
                <span>
                  ₹{totalAlloc.toLocaleString()} / ₹{monthlyBudget.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${allocPct}%`,
                    background: overAllocated ? "#f87171" : "#93c5fd",
                  }}
                />
              </div>
              {/* Utilization bar */}
              <div className="flex justify-between text-xs text-blue-200">
                <span>Spent ({utilPct}%)</span>
                <span>₹{totalSpent.toLocaleString()} used</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${utilPct}%`,
                    background: utilPct >= 90 ? "#f87171" : "#4ade80",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {[
              {
                label: "Monthly Budget",
                value: `₹${monthlyBudget.toLocaleString()}`,
                sub: "Total limit",
              },
              {
                label: "Allocated",
                value: `₹${totalAlloc.toLocaleString()}`,
                sub: `${allocPct}% of budget`,
              },
              {
                label: "Spent",
                value: `₹${totalSpent.toLocaleString()}`,
                sub: `${utilPct}% utilized`,
              },
              {
                label: "Remaining",
                value: `₹${Math.max(monthlyBudget - totalSpent, 0).toLocaleString()}`,
                sub: "Available to spend",
              },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                <p className="text-blue-200 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-lg font-bold font-['Poppins']">{s.value}</p>
                <p className="text-blue-200 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {overAllocated && (
          <div className="relative mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-400/30">
            <AlertTriangle size={14} className="text-red-300 shrink-0" />
            <p className="text-sm text-red-200">
              Category allocations (₹{totalAlloc.toLocaleString()}) exceed your monthly budget. Consider
              reducing limits or increasing budget.
            </p>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allocation breakdown donut */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Budget Allocation</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={allocData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocData.map((e, i) => (
                    <Cell key={`alloc-${i}`} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {allocData.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: d.color,
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground shrink-0">
                    ₹{d.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Utilization bar chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Category Utilization</h3>
          <div className="space-y-3">
            {utilizationData
              .sort((a, b) => b.pct - a.pct)
              .map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        ₹{d.spent.toLocaleString()} / ₹{d.allocated.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${d.pct >= 100 ? "bg-red-100 text-red-600" : d.pct >= 80 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                      >
                        {d.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${d.pct}%`,
                        background: d.pct >= 100 ? "#e53e3e" : d.pct >= 80 ? "#f59e0b" : d.color,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Category cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Category Budgets</h3>
          <span className="text-xs text-muted-foreground">{budgets.length} categories</span>
        </div>
        {budgets.length === 0 && (
          <Card className="p-10 flex flex-col items-center gap-3 text-center">
            <Wallet size={24} className="text-primary" />
            <p className="text-sm font-medium text-foreground">No budget categories yet</p>
            <p className="text-xs text-muted-foreground">Click “Add Category” to set a monthly limit for Food, Travel and more.</p>
          </Card>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(Math.round((b.spent / b.allocated) * 100), 100);
            const isOver = pct >= 100;
            const isNear = pct >= 80 && pct < 100;
            const statusColor = isOver ? "#e53e3e" : isNear ? "#f59e0b" : b.color;
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${statusColor}18`,
                      }}
                    >
                      <b.icon
                        size={18}
                        style={{
                          color: statusColor,
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.cat}</p>
                      <p className="text-xs text-muted-foreground">₹{b.allocated.toLocaleString()} limit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? "bg-red-100 text-red-600" : isNear ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                    >
                      {isOver ? "Over" : isNear ? "Near" : "OK"}
                    </span>
                    <button
                      onClick={() => setModal(b)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(b)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-center mb-3 relative">
                  <CircleProgress pct={pct} size={72} stroke={7} color={statusColor} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{pct}%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium text-foreground">₹{b.spent.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: statusColor,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-medium ${isOver ? "text-red-500" : "text-green-600"}`}>
                      ₹{Math.max(b.allocated - b.spent, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {(isOver || isNear) && (
                  <div
                    className={`mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border ${isOver ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}
                  >
                    <AlertTriangle
                      size={12}
                      className={isOver ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"}
                    />
                    <span className={`text-xs font-medium ${isOver ? "text-red-600" : "text-amber-700"}`}>
                      {isOver
                        ? `Over by ₹${(b.spent - b.allocated).toLocaleString()}`
                        : `₹${(b.allocated - b.spent).toLocaleString()} left — spend wisely`}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
