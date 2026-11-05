import { useState } from "react";
import {
  BarChart2,
  CreditCard,
  Download,
  Edit2,
  FileText,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { catColors, colorForCategory } from "../data/constants";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { downloadCSV } from "../utils/download";
import { formatMonthLabel, monthKey } from "../utils/formatDate";
import ExpenseModal from "../components/Modals/ExpenseModal";
import LockedBtn from "../components/Access/LockedButton";
import Card from "../components/Cards/Card";
import Badge from "../components/Cards/Badge";
import StatusSelect from "../components/Forms/StatusSelect";
import ConfirmDialog from "../components/Modals/ConfirmDialog";

// ── Expenses ───────────────────────────────────────────────────────
export default function ExpensesScreen() {
  const { user } = useAuth();
  const { expenses, categories, selectedMonth, saveExpense, setExpenseStatus, deleteExpense } = useFinance();
  const role = user?.role ?? "student";
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const cats = ["All", ...categories];
  const months = [...new Set(expenses.map((e) => monthKey(e.dateIso)))].sort().reverse();
  const filtered = expenses.filter(
    (e) =>
      (catFilter === "All" || e.cat === catFilter) &&
      (monthFilter === "all" || monthKey(e.dateIso) === monthFilter) &&
      `${e.desc} ${e.cat}`.toLowerCase().includes(search.toLowerCase()),
  );
  // Summary cards use the month picked in the header calendar (cancelled ones excluded)
  const monthExpenses = expenses.filter((e) => monthKey(e.dateIso) === selectedMonth && e.status !== "Cancelled");
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="space-y-6">
      {confirmDelete && (
        <ConfirmDialog
          icon={Trash2}
          danger
          title="Delete Expense"
          sub={`${confirmDelete.desc} · ₹${confirmDelete.amount.toLocaleString()}`}
          body="This expense will be permanently removed. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteExpense(confirmDelete.id).catch(() => {});
            setConfirmDelete(null);
          }}
        />
      )}
      {modal && (
        <ExpenseModal
          initial={modal === "add" ? undefined : modal}
          onSave={saveExpense}
          onClose={() => setModal(null)}
        />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Expenses</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Track and manage all your expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <LockedBtn
            role={role}
            feature="export_csv"
            onClick={() =>
              downloadCSV(
                [
                  ["Description", "Category", "Amount", "Date", "Status"],
                  ...filtered.map((e) => [e.desc, e.cat, e.amount, e.dateIso, e.status]),
                ],
                "expenses.csv",
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
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: formatMonthLabel(selectedMonth, "short"),
            value: `₹${monthTotal.toLocaleString()}`,
            icon: CreditCard,
            g: "from-[#2E93C7] to-[#0D6D91]",
          },
          {
            label: "Transactions",
            value: String(monthExpenses.length),
            icon: FileText,
            g: "from-[#0D6D91] to-[#143452]",
          },
          {
            label: "Highest Spend",
            value: `₹${(monthExpenses.length ? Math.max(...monthExpenses.map((e) => e.amount)) : 0).toLocaleString()}`,
            icon: TrendingUp,
            g: "from-[#5FA7D2] to-[#2E93C7]",
          },
          {
            label: "Avg Expense",
            value: `₹${monthExpenses.length ? Math.round(monthTotal / monthExpenses.length).toLocaleString() : 0}`,
            icon: BarChart2,
            g: "from-[#164A72] to-[#0D6D91]",
          },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.g}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold font-['Poppins'] text-foreground">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filter by month"
            className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m, "short")}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={
                  catFilter === c
                    ? {
                        background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                        color: "#fff",
                      }
                    : {
                        background: "var(--muted)",
                        color: "var(--muted-foreground)",
                      }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Description", "Category", "Amount", "Date", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{e.desc}</td>
                  <td className="px-5 py-3.5">
                    <Badge color={catColors[e.cat] || colorForCategory(e.cat, categories.indexOf(e.cat))}>{e.cat}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                    -₹{e.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{e.date}</td>
                  <td className="px-5 py-3.5">
                    <StatusSelect
                      value={e.status}
                      onChange={(next) => next !== e.status && setExpenseStatus(e.id, next).catch(() => {})}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal(e)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <LockedBtn
                        role={role}
                        feature="delete_expense"
                        onClick={() => setConfirmDelete(e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </LockedBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No expenses found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
