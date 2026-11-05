import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Crown,
  Edit2,
  FileText,
  GraduationCap,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
import { ROLE_META } from "../../data/constants";
import ConfirmDialog from "../../components/Modals/ConfirmDialog";
import PrimaryBtn from "../../components/Buttons/PrimaryButton";
import Card from "../../components/Cards/Card";
import getInitials from "../../utils/getInitials";
import RoleBadge from "../../components/Cards/RoleBadge";
import { ROLE_SCREENS, canDo } from "../../utils/permissions";
import { useAuth } from "../../context/AuthContext";
import useScreenNavigate from "../../hooks/useScreenNavigate";
import api from "../../services/api";
import { formatDateTime, formatShortDate } from "../../utils/formatDate";

// ── API -> shapes used by the admin screens ──────────────────────────
const toUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  plan: u.plan,
  since: u.plan_since ? formatShortDate(u.plan_since) : "—",
  renewal: u.plan_renewal ? formatShortDate(u.plan_renewal) : "—",
  createdAt: u.created_at,
});
const toLog = (l) => ({ id: l.id, level: l.level, time: formatDateTime(l.created_at), msg: l.message });
const toAnnouncement = (a) => ({
  id: a.id,
  title: a.title,
  body: a.body,
  audience: a.audience,
  recipients: a.recipients,
  date: formatShortDate(a.created_at),
  sent: true,
});
const toFeedback = (f) => ({
  id: f.id,
  user: f.user_name,
  email: f.user_email,
  type: f.type,
  msg: f.message,
  date: formatShortDate(f.created_at),
  status: f.status,
});
const toIssue = (i) => ({
  id: i.id,
  user: i.user_name,
  email: i.user_email,
  issue: i.issue,
  severity: i.severity,
  date: formatShortDate(i.created_at),
  status: i.status,
});

export default function AdminScreen({ screen: activeScreen }) {
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useScreenNavigate();
  const currentUserEmail = currentUser?.email;
  const tab = activeScreen.replace("admin-", "") || "dashboard";
  const [toast, setToast] = useState({
    msg: "",
    type: "success",
  });

  // Users (+ subscriptions, which are a view of the same records)
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const subs = users.map((u) => ({ email: u.email, plan: u.plan, since: u.since, renewal: u.renewal }));
  const [editSub, setEditSub] = useState(null);

  // Categories (names shown in the UI, ids used for the API)
  const [categoryRows, setCategoryRows] = useState([]);
  const categories = categoryRows.map((c) => c.name);
  const [newCat, setNewCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [editCat, setEditCat] = useState(null);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all");

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({
    title: "",
    body: "",
    audience: "all",
  });
  const [showAnnForm, setShowAnnForm] = useState(false);

  // Feedback & issues
  const [feedback, setFeedback] = useState([]);
  const [fbFilter, setFbFilter] = useState("all");
  const [issues, setIssues] = useState([]);
  const [issueFilter, setIssueFilter] = useState("all");

  // Platform analytics
  const [platform, setPlatform] = useState({ series: [] });

  function showToast(msg, type = "success") {
    setToast({
      msg,
      type,
    });
    setTimeout(
      () =>
        setToast({
          msg: "",
          type: "success",
        }),
      3000,
    );
  }

  // Run an API call, show its success message, report errors as a red toast.
  async function act(promise, successMsg) {
    try {
      const result = await promise;
      if (successMsg) showToast(successMsg);
      return result;
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
      return undefined;
    }
  }

  const refreshUsers = useCallback(async () => {
    setUsers((await api.admin.users()).map(toUser));
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [u, cats, lg, ann, fb, iss, pa] = await Promise.all([
        api.admin.users(),
        api.admin.categories(),
        api.admin.logs(),
        api.admin.announcements(),
        api.admin.feedback(),
        api.admin.issues(),
        api.admin.analytics(),
      ]);
      setUsers(u.map(toUser));
      setCategoryRows(cats);
      setLogs(lg.map(toLog));
      setAnnouncements(ann.map(toAnnouncement));
      setFeedback(fb.map(toFeedback));
      setIssues(iss.map(toIssue));
      setPlatform(pa);
    } catch (err) {
      showToast(err.message, "error");
    }
  }, []);

  // Refresh whenever the admin switches tab so logs / feedback are current.
  useEffect(() => {
    loadAll();
  }, [loadAll, tab]);

  const idOf = (email) => users.find((u) => u.email === email)?.id;

  async function updateUser(email, changes, msg) {
    const updated = await act(api.admin.updateUser(idOf(email), changes), msg);
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? toUser(updated) : u)));
      if (updated.email === currentUserEmail || email === currentUserEmail) refreshUser().catch(() => {});
      api.admin.analytics().then(setPlatform).catch(() => {});
    }
    return updated;
  }

  async function handleRoleChange(email, role) {
    if (await updateUser(email, { role }, `Role updated to ${ROLE_META[role].label}`)) setEditRoleUser(null);
  }
  async function handleDeleteUser(email) {
    const ok = await act(api.admin.deleteUser(idOf(email)), "User removed.");
    setConfirmDeleteUser(null);
    if (ok !== undefined) refreshUsers();
  }
  function handleToggleSuspend(email) {
    const cur = users.find((u) => u.email === email)?.status ?? "active";
    updateUser(email, { status: cur === "active" ? "suspended" : "active" }, `User ${cur === "active" ? "suspended" : "activated"}.`);
  }
  async function handleSaveEditUser() {
    if (!editUserModal) return;
    const done = await updateUser(
      editUserModal.email,
      { name: editUserName.trim(), email: editUserEmail.trim() },
      "User updated.",
    );
    if (done) setEditUserModal(null);
  }
  async function handleSavePlan(email, plan) {
    if (await updateUser(email, { plan }, "Subscription updated.")) setEditSub(null);
  }

  // Categories
  async function addCategory(name) {
    const created = await act(api.admin.addCategory(name), "Category added.");
    if (created) setCategoryRows((prev) => [...prev, created]);
  }
  async function renameCategory(oldName, name) {
    const row = categoryRows.find((c) => c.name === oldName);
    const updated = row && (await act(api.admin.renameCategory(row.id, name), "Category renamed."));
    if (updated) setCategoryRows((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }
  async function deleteCategory(name) {
    const row = categoryRows.find((c) => c.name === name);
    if (row && (await act(api.admin.deleteCategory(row.id), "Category deleted.")) !== undefined) {
      setCategoryRows((prev) => prev.filter((c) => c.id !== row.id));
    }
  }

  // Announcements / feedback / issues
  async function sendAnnouncement() {
    const created = await act(api.admin.sendAnnouncement(newAnn));
    if (created) {
      setAnnouncements((prev) => [toAnnouncement(created), ...prev]);
      setNewAnn({ title: "", body: "", audience: "all" });
      setShowAnnForm(false);
      showToast(`Announcement sent to ${created.recipients} user${created.recipients === 1 ? "" : "s"}!`);
    }
  }
  async function deleteAnnouncement(id) {
    if ((await act(api.admin.deleteAnnouncement(id), "Announcement deleted.")) !== undefined) {
      setAnnouncements((prev) => prev.filter((x) => x.id !== id));
    }
  }
  async function setFeedbackStatus(id, status) {
    const updated = await act(api.admin.updateFeedback(id, status), "Marked resolved.");
    if (updated) setFeedback((prev) => prev.map((x) => (x.id === id ? toFeedback(updated) : x)));
  }
  async function removeFeedback(id) {
    if ((await act(api.admin.deleteFeedback(id), "Feedback dismissed.")) !== undefined) {
      setFeedback((prev) => prev.filter((x) => x.id !== id));
    }
  }
  async function setIssueStatus(id, status) {
    const updated = await act(api.admin.updateIssue(id, status), status === "resolved" ? "Issue resolved." : "Marked in-progress.");
    if (updated) setIssues((prev) => prev.map((x) => (x.id === id ? toIssue(updated) : x)));
  }
  async function removeIssue(id) {
    if ((await act(api.admin.deleteIssue(id), "Issue dismissed.")) !== undefined) {
      setIssues((prev) => prev.filter((x) => x.id !== id));
    }
  }
  const roleCounts = {
    student: 0,
    premium: 0,
    admin: 0,
  };
  users.forEach((u) => roleCounts[u.role]++);
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast.msg && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2"
          style={{
            background:
              toast.type === "success"
                ? "linear-gradient(135deg,#2E93C7,#0D6D91)"
                : "linear-gradient(135deg,#e53e3e,#c53030)",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} {toast.msg}
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmDeleteUser && (
        <ConfirmDialog
          icon={Trash2}
          title="Remove User"
          sub={confirmDeleteUser}
          danger
          body="This user will be permanently removed. This cannot be undone."
          confirmLabel="Remove"
          onCancel={() => setConfirmDeleteUser(null)}
          onConfirm={() => handleDeleteUser(confirmDeleteUser)}
        />
      )}

      {confirmDeleteCat && (
        <ConfirmDialog
          icon={Trash2}
          title="Delete Category"
          sub={confirmDeleteCat}
          danger
          body="Expenses using this category will not be affected, but new entries won't be able to use it."
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteCat(null)}
          onConfirm={() => {
            deleteCategory(confirmDeleteCat);
            setConfirmDeleteCat(null);
          }}
        />
      )}

      {/* Edit Role Modal */}
      {editRoleUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Change Role</h3>
              <button
                onClick={() => setEditRoleUser(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{editRoleUser.email}</p>
            <div className="space-y-2">
              {["student", "premium", "admin"].map((r) => {
                const m = ROLE_META[r];
                const sel = editRoleUser.role === r;
                return (
                  <button
                    key={r}
                    onClick={() =>
                      setEditRoleUser({
                        ...editRoleUser,
                        role: r,
                      })
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${sel ? "" : "border-border hover:bg-secondary"}`}
                    style={
                      sel
                        ? {
                            background: m.bg,
                            borderColor: m.color,
                          }
                        : {}
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: m.bg,
                      }}
                    >
                      {r === "admin" && (
                        <ShieldCheck
                          size={15}
                          style={{
                            color: m.color,
                          }}
                        />
                      )}
                      {r === "premium" && (
                        <Crown
                          size={15}
                          style={{
                            color: m.color,
                          }}
                        />
                      )}
                      {r === "student" && (
                        <GraduationCap
                          size={15}
                          style={{
                            color: m.color,
                          }}
                        />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    {sel && (
                      <CheckCircle
                        size={15}
                        style={{
                          color: m.color,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <PrimaryBtn onClick={() => handleRoleChange(editRoleUser.email, editRoleUser.role)}>
              Save Role
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Edit User</h3>
              <button
                onClick={() => setEditUserModal(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Full Name</label>
                <input
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Email</label>
                <input
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <PrimaryBtn onClick={handleSaveEditUser}>Save Changes</PrimaryBtn>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">
                Change Subscription
              </h3>
              <button
                onClick={() => setEditSub(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{editSub.email}</p>
            <div className="space-y-2">
              {["free", "premium", "enterprise"].map((p) => {
                const colors = {
                  free: {
                    bg: "#f0f9ff",
                    color: "#0D6D91",
                    label: "Free",
                  },
                  premium: {
                    bg: "#ede9fe",
                    color: "#7c3aed",
                    label: "Premium",
                  },
                  enterprise: {
                    bg: "#fef3c7",
                    color: "#b45309",
                    label: "Enterprise",
                  },
                };
                const c = colors[p];
                const sel = editSub.plan === p;
                return (
                  <button
                    key={p}
                    onClick={() =>
                      setEditSub({
                        ...editSub,
                        plan: p,
                      })
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${sel ? "" : "border-border hover:bg-secondary"}`}
                    style={
                      sel
                        ? {
                            background: c.bg,
                            borderColor: c.color,
                          }
                        : {}
                    }
                  >
                    <span
                      className="text-sm font-semibold flex-1 text-left"
                      style={{
                        color: sel ? c.color : "var(--foreground)",
                      }}
                    >
                      {c.label}
                    </span>
                    {sel && (
                      <CheckCircle
                        size={15}
                        style={{
                          color: c.color,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <PrimaryBtn
              onClick={() => {
                if (!editSub) return;
                handleSavePlan(editSub.email, editSub.plan);
              }}
            >
              Save
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(12,42,69,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Edit Category</h3>
              <button
                onClick={() => setEditCat(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <input
              value={editCat.val}
              onChange={(e) =>
                setEditCat({
                  ...editCat,
                  val: e.target.value,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <PrimaryBtn
              onClick={() => {
                if (!editCat.val.trim()) return;
                renameCategory(editCat.old, editCat.val.trim());
                setEditCat(null);
              }}
            >
              Save
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: String(users.length),
                icon: Users,
                grad: "from-[#2E93C7] to-[#0D6D91]",
                sub: `+${platform.new_this_week ?? 0} this week`,
              },
              {
                label: "Active Users",
                value: String(users.filter((u) => u.status === "active").length),
                icon: CheckCircle,
                grad: "from-[#22c55e] to-[#16a34a]",
                sub: `${users.filter((u) => u.status === "suspended").length} suspended`,
              },
              {
                label: "Premium Users",
                value: String(roleCounts.premium + roleCounts.admin),
                icon: Crown,
                grad: "from-[#7c3aed] to-[#5b21b6]",
                sub: `${Math.round(((roleCounts.premium + roleCounts.admin) / Math.max(users.length, 1)) * 100)}% of base`,
              },
              {
                label: "Monthly Revenue",
                value: `₹${(platform.monthly_revenue ?? 0).toLocaleString()}`,
                icon: TrendingUp,
                grad: "from-[#b45309] to-[#92400e]",
                sub:
                  platform.revenue_change === null || platform.revenue_change === undefined
                    ? "Premium ₹299 · Enterprise ₹999"
                    : `${platform.revenue_change > 0 ? "+" : ""}${platform.revenue_change}% vs last month`,
              },
            ].map((s) => (
              <Card key={s.label} className="p-4 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.grad} shrink-0`}
                >
                  <s.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold font-['Poppins'] text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Role breakdown + Recent signups */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">User Breakdown</h3>
              {["student", "premium", "admin"].map((r) => {
                const m = ROLE_META[r];
                const pct = users.length ? Math.round((roleCounts[r] / users.length) * 100) : 0;
                return (
                  <div key={r} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{m.label}s</span>
                      <span className="text-muted-foreground">
                        {roleCounts[r]} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: m.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Signups</h3>
              <div className="space-y-2">
                {users.slice(0, 3).map((u) => (
                  <div
                    key={u.email}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{
                        background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                      }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                    >
                      {u.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick access buttons */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "View All Users",
                  icon: Users,
                  screen: "admin-users",
                },
                {
                  label: "Subscriptions",
                  icon: Crown,
                  screen: "admin-subscriptions",
                },
                {
                  label: "Send Announcement",
                  icon: Bell,
                  screen: "admin-announcements",
                },
                {
                  label: "Review Feedback",
                  icon: Star,
                  screen: "admin-feedback",
                },
                {
                  label: "Reported Issues",
                  icon: AlertTriangle,
                  screen: "admin-issues",
                },
                {
                  label: "System Logs",
                  icon: FileText,
                  screen: "admin-logs",
                },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.screen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <a.icon size={14} className="text-primary" /> {a.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{users.length} total users</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-8 pr-4 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["User", "Email", "Role", "Status", "Subscription", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const isSelf = u.email === currentUserEmail;
                    const sub = { plan: u.plan, since: u.since, renewal: u.renewal };
                    return (
                      <tr
                        key={u.email}
                        className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/5"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{
                                background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                              }}
                            >
                              {getInitials(u.name)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{u.name}</p>
                              {isSelf && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground capitalize">
                            {sub?.plan ?? "free"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              title="Edit user"
                              onClick={() => {
                                setEditUserModal(u);
                                setEditUserName(u.name);
                                setEditUserEmail(u.email);
                              }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Change role"
                              onClick={() =>
                                setEditRoleUser({
                                  email: u.email,
                                  role: u.role,
                                })
                              }
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                            >
                              <UserCog size={13} />
                            </button>
                            <button
                              title={u.status === "active" ? "Suspend" : "Activate"}
                              onClick={() => handleToggleSuspend(u.email)}
                              className={`p-1.5 rounded-lg transition-colors ${u.status === "active" ? "hover:bg-amber-50 text-muted-foreground hover:text-amber-600" : "hover:bg-green-50 text-muted-foreground hover:text-green-600"}`}
                            >
                              {u.status === "active" ? <Lock size={13} /> : <CheckCircle size={13} />}
                            </button>
                            {!isSelf && (
                              <button
                                title="Delete"
                                onClick={() => setConfirmDeleteUser(u.email)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-10 text-center text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {tab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {["free", "premium", "enterprise"].map((p) => {
              const count = subs.filter((s) => s.plan === p).length;
              const colors = {
                free: {
                  color: "#0D6D91",
                  bg: "#e0f2fe",
                },
                premium: {
                  color: "#7c3aed",
                  bg: "#ede9fe",
                },
                enterprise: {
                  color: "#b45309",
                  bg: "#fef3c7",
                },
              };
              const c = colors[p];
              return (
                <Card key={p} className="p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: c.bg,
                    }}
                  >
                    <Crown
                      size={18}
                      style={{
                        color: c.color,
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-['Poppins'] text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p}</p>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["User", "Plan", "Member Since", "Renewal", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s, i) => {
                    const u = users.find((u) => u.email === s.email);
                    const planColors = {
                      free: {
                        color: "#0D6D91",
                        bg: "#e0f2fe",
                      },
                      premium: {
                        color: "#7c3aed",
                        bg: "#ede9fe",
                      },
                      enterprise: {
                        color: "#b45309",
                        bg: "#fef3c7",
                      },
                    };
                    const c = planColors[s.plan];
                    return (
                      <tr
                        key={s.email}
                        className={`border-b border-border/50 hover:bg-secondary/20 ${i % 2 === 0 ? "" : "bg-secondary/5"}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground text-sm">{u?.name ?? s.email}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                            style={{
                              background: c.bg,
                              color: c.color,
                            }}
                          >
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.since}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.renewal}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setEditSub({
                                email: s.email,
                                plan: s.plan,
                              })
                            }
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
                          >
                            <Edit2 size={11} /> Change Plan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {tab === "categories" && (
        <div className="space-y-4">
          {/* Add Category Modal */}
          {showAddCat && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{
                background: "rgba(12,42,69,0.6)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold font-['Poppins'] text-foreground">New Category</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCat(false);
                      setNewCat("");
                    }}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="e.g. Healthcare, Rent…"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = newCat.trim();
                      if (v) {
                        addCategory(v);
                        setNewCat("");
                        setShowAddCat(false);
                      }
                    }
                    if (e.key === "Escape") {
                      setShowAddCat(false);
                      setNewCat("");
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCat(false);
                      setNewCat("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const v = newCat.trim();
                      if (v) {
                        addCategory(v);
                        setNewCat("");
                        setShowAddCat(false);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Expense Categories ({categories.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCat(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                }}
              >
                <Plus size={14} /> Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">{cat}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setEditCat({
                          old: cat,
                          val: cat,
                        })
                      }
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCat(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── PLATFORM ANALYTICS ── */}
      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: (platform.total_users ?? 0).toLocaleString(),
                sub: platform.users_change === null || platform.users_change === undefined ? "All time" : `${platform.users_change > 0 ? "+" : ""}${platform.users_change}% MoM`,
                color: "#2E93C7",
              },
              {
                label: "Active Users",
                value: (platform.active_users ?? 0).toLocaleString(),
                sub: `${Math.round(((platform.active_users ?? 0) / Math.max(platform.total_users ?? 0, 1)) * 100)}% active`,
                color: "#22c55e",
              },
              {
                label: "Premium Users",
                value: (platform.premium_users ?? 0).toLocaleString(),
                sub: `${Math.round(((platform.premium_users ?? 0) / Math.max(platform.total_users ?? 0, 1)) * 100)}% of base`,
                color: "#7c3aed",
              },
              {
                label: "Monthly Revenue",
                value: `₹${(platform.monthly_revenue ?? 0).toLocaleString()}`,
                sub: platform.revenue_change === null || platform.revenue_change === undefined ? "This month" : `${platform.revenue_change > 0 ? "+" : ""}${platform.revenue_change}% MoM`,
                color: "#b45309",
              },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p
                  className="text-2xl font-bold font-['Poppins']"
                  style={{
                    color: s.color,
                  }}
                >
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">User Growth & Revenue</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={platform.series}>
                <defs>
                  <linearGradient id="pa-users-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E93C7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2E93C7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pa-rev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
                  yAxisId="users"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rev"
                  orientation="right"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`)}
                />
                <Tooltip
                  formatter={(v, name) => [
                    name === "revenue" ? `₹${v.toLocaleString()}` : v.toLocaleString(),
                    name,
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: 11,
                  }}
                />
                <Area
                  yAxisId="users"
                  type="monotone"
                  dataKey="users"
                  stroke="#2E93C7"
                  strokeWidth={2}
                  fill="url(#pa-users-grad)"
                  name="Total Users"
                  dot={false}
                />
                <Area
                  yAxisId="users"
                  type="monotone"
                  dataKey="active"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="4 3"
                  name="Active Users"
                  dot={false}
                />
                <Area
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#pa-rev-grad)"
                  name="revenue"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Subscription Mix</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Free",
                        value: subs.filter((s) => s.plan === "free").length,
                        fill: "#0D6D91",
                      },
                      {
                        name: "Premium",
                        value: subs.filter((s) => s.plan === "premium").length,
                        fill: "#7c3aed",
                      },
                      {
                        name: "Enterprise",
                        value: subs.filter((s) => s.plan === "enterprise").length,
                        fill: "#b45309",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {[0, 1, 2].map((i) => (
                      <Cell key={`sub-mix-${i}`} fill={["#0D6D91", "#7c3aed", "#b45309"][i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Role Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={["student", "premium", "admin"].map((r) => ({
                    name: ROLE_META[r].label,
                    count: roleCounts[r],
                    fill: ROLE_META[r].color,
                  }))}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
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
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Users">
                    {["student", "premium", "admin"].map((r, i) => (
                      <Cell key={`role-bar-${i}`} fill={ROLE_META[r].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ── SYSTEM LOGS ── */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "info", "warn", "error"].map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${logFilter === f ? "text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
                style={
                  logFilter === f
                    ? {
                        background:
                          f === "error"
                            ? "#e53e3e"
                            : f === "warn"
                              ? "#f59e0b"
                              : f === "info"
                                ? "#2E93C7"
                                : "linear-gradient(135deg,#2E93C7,#0D6D91)",
                      }
                    : {}
                }
              >
                {f === "all" ? "All Logs" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["Level", "Time", "Message"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs
                    .filter((l) => logFilter === "all" || l.level === logFilter)
                    .map((l, i) => {
                      const lc = {
                        info: {
                          bg: "#e0f2fe",
                          color: "#0D6D91",
                        },
                        warn: {
                          bg: "#fef3c7",
                          color: "#b45309",
                        },
                        error: {
                          bg: "#fee2e2",
                          color: "#dc2626",
                        },
                      };
                      const c = lc[l.level];
                      return (
                        <tr
                          key={l.id}
                          className={`border-b border-border/50 hover:bg-secondary/20 ${i % 2 === 0 ? "" : "bg-secondary/5"}`}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase"
                              style={{
                                background: c.bg,
                                color: c.color,
                              }}
                            >
                              {l.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {l.time}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">{l.msg}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {tab === "announcements" && (
        <div className="space-y-4">
          {!showAnnForm ? (
            <button
              onClick={() => setShowAnnForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
              }}
            >
              <Plus size={15} /> New Announcement
            </button>
          ) : (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Compose Announcement</h3>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Title</label>
                <input
                  value={newAnn.title}
                  onChange={(e) =>
                    setNewAnn((a) => ({
                      ...a,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Scheduled Maintenance"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Message</label>
                <textarea
                  value={newAnn.body}
                  onChange={(e) =>
                    setNewAnn((a) => ({
                      ...a,
                      body: e.target.value,
                    }))
                  }
                  placeholder="Write your announcement…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Audience</label>
                <select
                  value={newAnn.audience}
                  onChange={(e) =>
                    setNewAnn((a) => ({
                      ...a,
                      audience: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">All Users</option>
                  <option value="premium">Premium Users Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAnnForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newAnn.title.trim() || !newAnn.body.trim()) {
                      showToast("Add a title and a message.", "error");
                      return;
                    }
                    sendAnnouncement();
                  }}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                  }}
                >
                  <Bell size={14} className="inline mr-1.5" />
                  Send
                </button>
              </div>
            </Card>
          )}
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id} className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">
                      Sent
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                      {a.audience}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {a.date} · delivered to {a.recipients} user{a.recipients === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── FEEDBACK ── */}
      {tab === "feedback" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["all", "open", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setFbFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${fbFilter === f ? "text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
                style={
                  fbFilter === f
                    ? {
                        background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                      }
                    : {}
                }
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {feedback
              .filter((f) => fbFilter === "all" || f.status === fbFilter)
              .map((f) => {
                const tc = {
                  bug: {
                    bg: "#fee2e2",
                    color: "#dc2626",
                  },
                  suggestion: {
                    bg: "#e0f2fe",
                    color: "#0D6D91",
                  },
                  praise: {
                    bg: "#dcfce7",
                    color: "#16a34a",
                  },
                };
                const c = tc[f.type] ?? tc.suggestion;
                return (
                  <Card key={f.id} className="p-4 flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: c.bg,
                      }}
                    >
                      <Star
                        size={15}
                        style={{
                          color: c.color,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-foreground">{f.user}</p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                          style={{
                            background: c.bg,
                            color: c.color,
                          }}
                        >
                          {f.type}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${f.status === "open" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-1">{f.msg}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.email} · {f.date}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {f.status === "open" && (
                        <button
                          onClick={() => setFeedbackStatus(f.id, "resolved")}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => removeFeedback(f.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            {feedback.filter((f) => fbFilter === "all" || f.status === fbFilter).length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No feedback in this category.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORTED ISSUES ── */}
      {tab === "issues" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "open", "in-progress", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setIssueFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${issueFilter === f ? "text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
                style={
                  issueFilter === f
                    ? {
                        background: "linear-gradient(135deg,#2E93C7,#0D6D91)",
                      }
                    : {}
                }
              >
                {f === "all"
                  ? "All Issues"
                  : f
                      .split("-")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {issues
              .filter((i) => issueFilter === "all" || i.status === issueFilter)
              .map((i) => {
                const sc = {
                  high: {
                    bg: "#fee2e2",
                    color: "#dc2626",
                  },
                  medium: {
                    bg: "#fef3c7",
                    color: "#b45309",
                  },
                  low: {
                    bg: "#dcfce7",
                    color: "#16a34a",
                  },
                };
                const stc = {
                  open: {
                    bg: "#fee2e2",
                    color: "#dc2626",
                  },
                  "in-progress": {
                    bg: "#fef3c7",
                    color: "#b45309",
                  },
                  resolved: {
                    bg: "#dcfce7",
                    color: "#16a34a",
                  },
                };
                const sv = sc[i.severity];
                const st = stc[i.status];
                return (
                  <Card key={i.id} className="p-4 flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: sv.bg,
                      }}
                    >
                      <AlertTriangle
                        size={15}
                        style={{
                          color: sv.color,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                          style={{
                            background: sv.bg,
                            color: sv.color,
                          }}
                        >
                          {i.severity} severity
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          {i.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{i.issue}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {i.user} · {i.email} · {i.date}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-col items-end">
                      {i.status === "open" && (
                        <button
                          onClick={() => setIssueStatus(i.id, "in-progress")}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          In Progress
                        </button>
                      )}
                      {i.status === "in-progress" && (
                        <button
                          onClick={() => setIssueStatus(i.id, "resolved")}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => removeIssue(i.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            {issues.filter((i) => issueFilter === "all" || i.status === issueFilter).length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No issues in this category.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PERMISSIONS MATRIX ── */}
      {tab === "permissions" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Role Permissions Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground w-48">
                    Feature
                  </th>
                  {["student", "premium", "admin"].map((r) => (
                    <th key={r} className="text-center py-2 px-3">
                      <RoleBadge role={r} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td
                    colSpan={4}
                    className="pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                  >
                    Screen Access
                  </td>
                </tr>
                {[
                  ["dashboard", "Dashboard"],
                  ["expenses", "Expenses"],
                  ["income", "Income"],
                  ["savings", "Savings Goals"],
                  ["budgets", "Budgets"],
                  ["analytics", "Analytics"],
                  ["reports", "Reports"],
                  ["notifications", "Notifications"],
                  ["profile", "Profile"],
                  ["settings", "Settings"],
                  ["admin", "Admin Panel"],
                ].map(([s, label]) => (
                  <tr key={s} className="hover:bg-secondary/20">
                    <td className="py-2 pr-4 text-foreground text-xs">{label}</td>
                    {["student", "premium", "admin"].map((r) => (
                      <td key={r} className="py-2 px-3 text-center">
                        {ROLE_SCREENS[r].includes(s) ? (
                          <CheckCircle size={15} className="mx-auto text-green-500" />
                        ) : (
                          <X size={15} className="mx-auto text-muted-foreground/30" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={4}
                    className="pt-4 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                  >
                    Feature Permissions
                  </td>
                </tr>
                {[
                  ["delete_expense", "Delete Expenses"],
                  ["delete_income", "Delete Income"],
                  ["delete_goal", "Delete Goals"],
                  ["export_csv", "Export CSV"],
                  ["export_pdf", "Export PDF"],
                  ["report_preview", "Report Preview"],
                  ["budget_planning", "Budget Planning"],
                  ["ai_insights", "AI Insights"],
                  ["manage_users", "Manage Users"],
                ].map(([f, label]) => (
                  <tr key={f} className="hover:bg-secondary/20">
                    <td className="py-2 pr-4 text-foreground text-xs">{label}</td>
                    {["student", "premium", "admin"].map((r) => (
                      <td key={r} className="py-2 px-3 text-center">
                        {canDo(r, f) ? (
                          <CheckCircle size={15} className="mx-auto text-green-500" />
                        ) : (
                          <X size={15} className="mx-auto text-muted-foreground/30" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
