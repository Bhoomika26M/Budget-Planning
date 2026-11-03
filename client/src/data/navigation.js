import {
  AlertTriangle,
  BarChart2,
  Bell,
  CreditCard,
  Crown,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";

// ── Nav ────────────────────────────────────────────────────────────
export const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "user",
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: CreditCard,
    group: "user",
  },
  {
    id: "income",
    label: "Income",
    icon: TrendingUp,
    group: "user",
  },
  {
    id: "budgets",
    label: "Budgets",
    icon: Wallet,
    group: "user",
  },
  {
    id: "savings",
    label: "Savings Goals",
    icon: Target,
    group: "user",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart2,
    group: "user",
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    group: "user",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    group: "user",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    group: "user",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    group: "user",
  },
  {
    id: "admin-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "admin",
  },
  {
    id: "admin-users",
    label: "Users",
    icon: Users,
    group: "admin",
  },
  {
    id: "admin-subscriptions",
    label: "Subscriptions",
    icon: Crown,
    group: "admin",
  },
  {
    id: "admin-categories",
    label: "Categories",
    icon: Wallet,
    group: "admin",
  },
  {
    id: "admin-analytics",
    label: "Platform Analytics",
    icon: BarChart2,
    group: "admin",
  },
  {
    id: "admin-logs",
    label: "System Logs",
    icon: FileText,
    group: "admin",
  },
  {
    id: "admin-announcements",
    label: "Announcements",
    icon: Bell,
    group: "admin",
  },
  {
    id: "admin-feedback",
    label: "Feedback",
    icon: Star,
    group: "admin",
  },
  {
    id: "admin-issues",
    label: "Reported Issues",
    icon: AlertTriangle,
    group: "admin",
  },
  {
    id: "admin-permissions",
    label: "Permissions",
    icon: ShieldCheck,
    group: "admin",
  },
];

// Screen id (as used by the Figma screens) -> URL path
export const SCREEN_PATHS = {
  dashboard: "/",
  expenses: "/expenses",
  income: "/income",
  budgets: "/budget",
  savings: "/savings",
  analytics: "/analytics",
  reports: "/reports",
  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
  "admin-dashboard": "/admin-dashboard",
  "admin-users": "/admin-users",
  "admin-subscriptions": "/admin-subscriptions",
  "admin-categories": "/admin-categories",
  "admin-analytics": "/admin-analytics",
  "admin-logs": "/admin-logs",
  "admin-announcements": "/admin-announcements",
  "admin-feedback": "/admin-feedback",
  "admin-issues": "/admin-issues",
  "admin-permissions": "/admin-permissions",
};

export function screenFromPath(pathname) {
  const entry = Object.entries(SCREEN_PATHS).find(([, path]) => path === pathname);
  return entry ? entry[0] : "dashboard";
}
