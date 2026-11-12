import { useState } from "react";
import { BookOpen, CheckCircle, Edit2, FileText, Mail, TrendingUp, User, Wallet } from "lucide-react";
import getInitials from "../utils/getInitials";
import EditProfileModal from "../components/Modals/EditProfileModal";
import Card from "../components/Cards/Card";
import { ROLE_META } from "../data/constants";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { formatShortDate, timeAgo, monthKey } from "../utils/formatDate";



// ── Profile ────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user: profile, updateProfile } = useAuth();
  const {
    expenses,
    incomeList,
    goals,
    selectedMonth,
    monthlyBudget,
    setMonthlyBudget,
  } = useFinance();
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState("");
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }
  async function handleSaveBudget() {
    const amount = Number(budgetInput);

    if (budgetInput.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      showToast("Please enter a valid budget.");
      return;
    }

    try {
      setSavingBudget(true);

      await setMonthlyBudget(amount);

      setEditBudget(false);
      showToast("Monthly budget updated successfully!");
    } catch (error) {
      // FinanceContext already handles the API error notification.
    } finally {
      setSavingBudget(false);
    }
  }
  const initials = getInitials(profile.name);

  const monthlyIncome = incomeList
  .filter((i) => monthKey(i.dateIso) === selectedMonth)
  .reduce((total, i) => total + i.amount, 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
          }}
        >
          <CheckCircle size={14} /> {toast}
        </div>
      )}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onSave={async (changes) => {
            await updateProfile(changes);
            showToast("Profile updated successfully!");
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      <div>
        <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Profile</h2>
        <p className="text-muted-foreground text-sm mt-0.5">View and edit your personal information</p>
      </div>

      {/* Avatar card */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-['Poppins'] shrink-0"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold font-['Poppins'] text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {[profile.major, profile.university].filter(Boolean).join(" · ") || "Add your university and programme"}
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        </div>
      </Card>

      {/* Account info */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Full Name",
              value: profile.name,
              icon: User,
            },
            {
              label: "Email",
              value: profile.email,
              icon: Mail,
            },
            {
              label: "University",
              value: profile.university || "—",
              icon: BookOpen,
            },
            {
              label: "Programme",
              value: profile.major || "—",
              icon: FileText,
            },
            {
              label: "Monthly Income",
              value: `₹${monthlyIncome.toLocaleString()}`,
              icon: TrendingUp,
            },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={14} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{f.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet size={14} className="text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Monthly Budget</p>

            {!editBudget ? (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  ₹{Number(monthlyBudget).toLocaleString("en-IN")}
                </p>

                <button
                  onClick={() => {
                    setBudgetInput(String(monthlyBudget));
                    setEditBudget(true);
                  }}
                  className="text-primary hover:opacity-70"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  type="number"
                  min="0"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBudget}
                    disabled={savingBudget}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs"
                  >
                    {savingBudget ? "Saving..." : "Save"}
                  </button>

                  <button
                    onClick={() => setEditBudget(false)}
                    disabled={savingBudget}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </Card>

      {/* Activity summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Account Activity</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Member Since",
              value: formatShortDate(profile.created_at),
            },
            {
              label: "Last Login",
              value: profile.last_login ? timeAgo(profile.last_login) : "Today",
            },
            {
              label: "Account Type",
              value: `${ROLE_META[profile.role].label} · ${profile.plan ? profile.plan[0].toUpperCase() + profile.plan.slice(1) : "Free"}`,
            },
            { label: "Expenses Logged", value: String(expenses.length) },
            { label: "Income Entries", value: String(incomeList.length) },
            { label: "Savings Goals", value: String(goals.length) },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-secondary/40">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
