import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle,
  FileText,
  Gamepad2,
  MoreHorizontal,
  Plane,
  ShoppingBag,
  Utensils,
} from "lucide-react";

// ── Icon lookup maps (API data only stores the category / type) ─────
export const BUDGET_ICONS = {
  "Food & Dining": Utensils,
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Education: BookOpen,
  Entertainment: Gamepad2,
  Miscellaneous: MoreHorizontal,
};

export const NOTIF_ICON_MAP = {
  alert: AlertTriangle,
  reminder: Bell,
  success: CheckCircle,
  info: FileText,
};

// ── Role-Based Access Control ──────────────────────────────────────

export const ROLE_META = {
  student: {
    label: "Student",
    color: "#0D6D91",
    bg: "#e0f2fe",
    description: "Basic access — dashboard, expenses, income & savings",
  },
  premium: {
    label: "Premium",
    color: "#7c3aed",
    bg: "#ede9fe",
    description: "Full access — all features including analytics & reports",
  },
  admin: {
    label: "Admin",
    color: "#b45309",
    bg: "#fef3c7",
    description: "Administrator — full access + user management panel",
  },
};

export const catColors = {
  Food: "#2E93C7",
  Travel: "#0D6D91",
  Shopping: "#5FA7D2",
  Education: "#8DBEE3",
  Entertainment: "#164A72",
  Miscellaneous: "#B9D2E7",
  Income: "#22c55e",
};

export const EXPENSE_CATS = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Miscellaneous"];

export const EXPENSE_STATUSES = ["Completed", "Pending", "Cancelled"];

export const INCOME_SOURCES = ["Pocket Money", "Scholarship", "Freelance", "Part-time Job", "Other"];

export const FREQS = ["Monthly", "One-time", "Weekly"];

// ── Goal Modal ─────────────────────────────────────────────────────
export const GOAL_COLORS = [
  "#2E93C7",
  "#0D6D91",
  "#5FA7D2",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#e53e3e",
  "#ec4899",
];

// ── Status inline dropdown ─────────────────────────────────────────
export const STATUS_META = {
  Completed: {
    color: "#22c55e",
    icon: "✓",
  },
  Pending: {
    color: "#f59e0b",
    icon: "⏳",
  },
  Cancelled: {
    color: "#e53e3e",
    icon: "✕",
  },
};

// Category colours used for budgets & charts (any extra admin-defined
// category falls back to CHART_PALETTE).
export const CHART_PALETTE = ["#2E93C7", "#0D6D91", "#5FA7D2", "#8DBEE3", "#164A72", "#B9D2E7", "#7c3aed", "#f59e0b"];

export function colorForCategory(cat, index = 0) {
  return catColors[cat] ?? CHART_PALETTE[index % CHART_PALETTE.length];
}
