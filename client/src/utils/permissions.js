export const ROLE_SCREENS = {
  student: ["dashboard", "expenses", "income", "savings", "notifications", "profile", "settings"],
  premium: [
    "dashboard",
    "expenses",
    "income",
    "budgets",
    "savings",
    "analytics",
    "reports",
    "notifications",
    "profile",
    "settings",
  ],
  admin: [
    "admin-dashboard",
    "admin-users",
    "admin-subscriptions",
    "admin-categories",
    "admin-analytics",
    "admin-logs",
    "admin-announcements",
    "admin-feedback",
    "admin-issues",
    "admin-permissions",
  ],
};

// ── Feature-level permissions ──────────────────────────────────────

export const FEATURE_PERMISSIONS = {
  // All roles
  add_expense: ["student", "premium", "admin"],
  edit_expense: ["student", "premium", "admin"],
  add_income: ["student", "premium", "admin"],
  edit_income: ["student", "premium", "admin"],
  add_goal: ["student", "premium", "admin"],
  edit_goal: ["student", "premium", "admin"],
  contribute_goal: ["student", "premium", "admin"],
  // Premium+
  delete_expense: ["premium", "admin"],
  delete_income: ["premium", "admin"],
  delete_goal: ["premium", "admin"],
  budget_planning: ["premium", "admin"],
  add_budget: ["premium", "admin"],
  export_pdf: ["premium", "admin"],
  export_csv: ["premium", "admin"],
  report_preview: ["premium", "admin"],
  analytics_full: ["premium", "admin"],
  cash_flow: ["premium", "admin"],
  ai_insights: ["premium", "admin"],
  // Admin only
  manage_users: ["admin"],
};

export function canDo(role, feature) {
  return FEATURE_PERMISSIONS[feature]?.includes(role) ?? false;
}
