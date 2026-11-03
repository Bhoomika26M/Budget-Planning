import { useEffect, useMemo, useState } from "react";
import { Download, Eye, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LockedBtn from "../components/Access/LockedButton";
import Badge from "../components/Cards/Badge";
import { catColors, colorForCategory } from "../data/constants";
import Card from "../components/Cards/Card";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useAnalytics } from "../context/AnalyticsContext";
import api from "../services/api";
import { downloadBlob, filenameFromResponse } from "../utils/download";
import { formatDisplayDate } from "../utils/formatDate";

// ── Reports ────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const { selectedMonth, dataVersion } = useFinance();
  const { monthlyTrend: lastMonthsTrend } = useAnalytics({ months: 6 });
  const [type, setType] = useState("monthly");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState(false);
  const [report, setReport] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState("");

  // The report is built on the server for the month chosen in the header calendar.
  useEffect(() => {
    let active = true;
    api
      .getReport(type, selectedMonth)
      .then((r) => active && (setReport(r), setLoadError("")))
      .catch((err) => active && setLoadError(err.message));
    return () => {
      active = false;
    };
  }, [type, selectedMonth, dataVersion]);

  const title = report?.title ?? (type === "monthly" ? "Monthly Report" : "Annual Report");
  const fileStem = `BudgetBuddy_${(report?.label ?? "").replace(/\s+/g, "")}_${type === "monthly" ? "Monthly" : "Annual"}_Report`;
  const totalIncome = report?.total_income ?? 0;
  const totalExpenses = report?.total_expenses ?? 0;
  const netSavings = report?.net_savings ?? 0;
  const budgets = useMemo(
    () => (report?.budgets ?? []).map((b) => ({ cat: b.category, allocated: b.budgeted, spent: b.actual, color: b.color })),
    [report],
  );
  const expenses = useMemo(
    () =>
      (report?.expenses ?? []).map((e) => ({
        id: e.id,
        desc: e.description,
        cat: e.category,
        amount: e.amount,
        date: formatDisplayDate(e.date),
        status: e.status,
      })),
    [report],
  );
  const categoryData = (report?.by_category ?? []).map((c, i) => ({
    name: c.category,
    value: c.total,
    color: colorForCategory(c.category, i),
  }));
  // Monthly report: last 6 months for context · Annual report: every month of that year
  const monthlyTrend =
    type === "monthly"
      ? lastMonthsTrend
      : (report?.trend ?? []).map((t) => ({ month: t.label, income: t.income, expenses: t.expenses }));

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function downloadFromServer(format) {
    setExporting(format);
    try {
      const response = await api.exportReport(format, type, selectedMonth);
      const blob = await response.blob();
      downloadBlob(blob, filenameFromResponse(response, `${fileStem}.${format}`));
      showToast(`${format === "xlsx" ? "Excel" : "CSV"} downloaded successfully!`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setExporting("");
    }
  }
  function downloadPDF() {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(12, 42, 69);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BudgetBuddy", 14, 15);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 25);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 140, 25);

    // Summary boxes
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, 48);
    autoTable(doc, {
      startY: 52,
      head: [["Total Income", "Total Expenses", "Net Savings"]],
      body: [
        [
          `Rs. ${totalIncome.toLocaleString()}`,
          `Rs. ${totalExpenses.toLocaleString()}`,
          `${netSavings < 0 ? "-" : ""}Rs. ${Math.abs(netSavings).toLocaleString()}`,
        ],
      ],
      headStyles: {
        fillColor: [46, 147, 199],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 11,
        fontStyle: "bold",
      },
      columnStyles: {
        0: {
          textColor: [34, 197, 94],
        },
        1: {
          textColor: [229, 62, 62],
        },
        2: {
          textColor: [46, 147, 199],
        },
      },
      margin: {
        left: 14,
        right: 14,
      },
    });
    const y1 = doc.lastAutoTable.finalY + 10;

    // Budget table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Budget vs Actuals", 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [["Category", "Budgeted (Rs.)", "Actual (Rs.)", "Variance (Rs.)", "Status"]],
      body: budgets.map((b) => {
        const v = b.allocated - b.spent;
        return [
          b.cat,
          b.allocated.toLocaleString(),
          b.spent.toLocaleString(),
          (v >= 0 ? "+" : "-") + Math.abs(v).toLocaleString(),
          v >= 0 ? "Under budget" : "Over budget",
        ];
      }),
      headStyles: {
        fillColor: [13, 109, 145],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [234, 244, 251],
      },
      columnStyles: {
        4: {
          fontStyle: "bold",
        },
      },
      margin: {
        left: 14,
        right: 14,
      },
    });
    const y2 = doc.lastAutoTable.finalY + 10;

    // Transactions table
    doc.setFont("helvetica", "bold");
    doc.text("Recent Transactions", 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [["Description", "Category", "Amount (Rs.)", "Date", "Status"]],
      body: expenses.slice(0, 15).map((e) => [e.desc, e.cat, e.amount.toLocaleString(), e.date, e.status]),
      headStyles: {
        fillColor: [20, 52, 82],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 247, 252],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("BudgetBuddy · Financial Report · Confidential", 14, 290);
      doc.text(`Page ${i} of ${pageCount}`, 185, 290);
    }
    doc.save(`${fileStem}.pdf`);
    showToast("PDF downloaded successfully!");
  }
  const downloadCSV = () => downloadFromServer("csv");
  const downloadExcel = () => downloadFromServer("xlsx");
  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{
            background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setPreview(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">
                {title} Preview
              </h3>
              <div className="flex items-center gap-2">
                <LockedBtn
                  role={role}
                  feature="export_pdf"
                  onClick={downloadPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                  }}
                >
                  <Download size={12} /> PDF
                </LockedBtn>
                <button
                  onClick={() => setPreview(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Header strip */}
              <div
                className="rounded-xl p-5 text-white"
                style={{
                  background: "linear-gradient(135deg, #0C2A45, #0D6D91)",
                }}
              >
                <p className="text-lg font-bold font-['Poppins']">BudgetBuddy</p>
                <p className="text-blue-200 text-sm">
                  {title}
                </p>
                <p className="text-blue-300 text-xs mt-1">
                  Generated: {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total Income",
                    value: `₹${totalIncome.toLocaleString()}`,
                    color: "#22c55e",
                  },
                  {
                    label: "Total Expenses",
                    value: `₹${totalExpenses.toLocaleString()}`,
                    color: "#e53e3e",
                  },
                  {
                    label: "Net Savings",
                    value: `${netSavings < 0 ? "-" : ""}₹${Math.abs(netSavings).toLocaleString()}`,
                    color: "#2E93C7",
                  },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-secondary/40 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p
                      className="text-base font-bold font-['Poppins'] mt-0.5"
                      style={{
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Budget table preview */}
              <div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                  Budget vs Actuals
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/40">
                        {["Category", "Budgeted", "Actual", "Variance", "Status"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((b, i) => {
                        const v = b.allocated - b.spent;
                        return (
                          <tr
                            key={b.cat}
                            className={`border-t border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                          >
                            <td className="px-3 py-2 font-medium text-foreground">{b.cat}</td>
                            <td className="px-3 py-2 text-foreground">₹{b.allocated.toLocaleString()}</td>
                            <td className="px-3 py-2 text-foreground">₹{b.spent.toLocaleString()}</td>
                            <td
                              className="px-3 py-2 font-medium"
                              style={{
                                color: v >= 0 ? "#22c55e" : "#e53e3e",
                              }}
                            >
                              {v >= 0 ? "+" : "-"}₹{Math.abs(v).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <Badge color={v >= 0 ? "#22c55e" : "#e53e3e"}>
                                {v >= 0 ? "Under" : "Over"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Transactions preview */}
              <div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                  Recent Transactions
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/40">
                        {["Description", "Category", "Amount", "Date"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.slice(0, 8).map((e, i) => (
                        <tr
                          key={e.id}
                          className={`border-t border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                        >
                          <td className="px-3 py-2 font-medium text-foreground">{e.desc}</td>
                          <td className="px-3 py-2">
                            <Badge color={catColors[e.cat] || "#2E93C7"}>{e.cat}</Badge>
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">
                            ₹{e.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Reports</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Generate and download financial reports</p>
        {loadError && <p className="text-xs text-red-500 mt-1">{loadError}</p>}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          {["monthly", "yearly"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all"
              style={
                type === t
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
              {t} Report
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Period: <span className="font-semibold text-foreground">{report?.label ?? "…"}</span> · change the month from the
            calendar in the header
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            {
              label: "Total Income",
              value: `₹${totalIncome.toLocaleString()}`,
              color: "#22c55e",
            },
            {
              label: "Total Expenses",
              value: `₹${totalExpenses.toLocaleString()}`,
              color: "#e53e3e",
            },
            {
              label: "Net Savings",
              value: `${netSavings < 0 ? "-" : ""}₹${Math.abs(netSavings).toLocaleString()}`,
              color: "#2E93C7",
            },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-secondary/40">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p
                className="text-xl font-bold font-['Poppins']"
                style={{
                  color: s.color,
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="text-sm font-semibold text-foreground mb-3">Spending by Category</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={`rpt-pie-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {categoryData.length === 0 && (
                  <p className="text-xs text-muted-foreground">No spending in this period.</p>
                )}
                {categoryData.slice(0, 5).map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: c.color,
                      }}
                    />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-medium text-foreground">₹{c.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="text-sm font-semibold text-foreground mb-3">Income vs Expenses</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyTrend} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E4EFF7" />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 10,
                    fill: "#5FA7D2",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "#5FA7D2",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="income" fill="#2E93C7" radius={[3, 3, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#8DBEE3" radius={[3, 3, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-secondary/30 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-foreground">
              {title}
            </span>
            <div className="flex items-center gap-2">
              <LockedBtn
                role={role}
                feature="report_preview"
                onClick={() => setPreview(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border border-border hover:bg-secondary transition-colors"
                style={{}}
              >
                <Eye size={13} /> Preview
              </LockedBtn>
              <LockedBtn
                role={role}
                feature="export_pdf"
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                }}
              >
                <Download size={13} /> PDF
              </LockedBtn>
              <LockedBtn
                role={role}
                feature="export_csv"
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                }}
              >
                <Download size={13} /> {exporting === "csv" ? "…" : "CSV"}
              </LockedBtn>
              <LockedBtn
                role={role}
                feature="export_csv"
                onClick={downloadExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                }}
              >
                <Download size={13} /> {exporting === "xlsx" ? "…" : "Excel"}
              </LockedBtn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Category", "Budgeted", "Actual", "Variance", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgets.map((b, i) => {
                  const v = b.allocated - b.spent;
                  return (
                    <tr
                      key={b.cat}
                      className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                    >
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{b.cat}</td>
                      <td className="px-5 py-3 text-sm text-foreground">₹{b.allocated.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-foreground">₹{b.spent.toLocaleString()}</td>
                      <td
                        className="px-5 py-3 text-sm font-medium"
                        style={{
                          color: v >= 0 ? "#22c55e" : "#e53e3e",
                        }}
                      >
                        {v >= 0 ? "+" : "-"}₹{Math.abs(v).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={v >= 0 ? "#22c55e" : "#e53e3e"}>
                          {v >= 0 ? "Under budget" : "Over budget"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
