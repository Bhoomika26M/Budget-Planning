// Convert API (snake_case, ISO dates) records into the shapes used by the
// Figma screens, and back again.
import { Bell, MoreHorizontal } from "lucide-react";

import { BUDGET_ICONS, NOTIF_ICON_MAP, catColors } from "../data/constants";
import { contributionLabel, formatDisplayDate, timeAgo } from "../utils/formatDate";

export const toExpense = (e) => ({
  id: e.id,
  desc: e.description || e.category,
  cat: e.category,
  amount: Number(e.amount),
  dateIso: e.expense_date,
  date: formatDisplayDate(e.expense_date),
  status: e.status || "Completed",
});

export const fromExpense = (e) => ({
  description: e.desc,
  category: e.cat,
  amount: Number(e.amount),
  expense_date: e.dateIso,
  status: e.status || "Completed",
});

export const toIncome = (i) => ({
  id: i.id,
  source: i.category,
  title: i.title,
  amount: Number(i.amount),
  dateIso: i.date,
  date: formatDisplayDate(i.date),
  freq: i.frequency || "Monthly",
});

export const fromIncome = (i) => ({
  category: i.source,
  title: i.source,
  amount: Number(i.amount),
  date: i.dateIso,
  frequency: i.freq,
});

export const toBudget = (b) => ({
  id: b.id,
  cat: b.category,
  icon: BUDGET_ICONS[b.category] ?? MoreHorizontal,
  allocated: Number(b.amount),
  spent: Number(b.spent || 0),
  color: b.color || catColors[b.category] || "#2E93C7",
});

export const toGoal = (g) => ({
  id: g.id,
  title: g.name,
  emoji: g.emoji || "🎯",
  target: Number(g.target),
  saved: Number(g.saved),
  deadlineIso: g.deadline || "",
  deadline: g.deadline ? formatDisplayDate(g.deadline) : "",
  quote: g.note || "Keep going!",
  color: g.color || "#2E93C7",
  completed: Boolean(g.completed),
});

export const fromGoal = (g) => ({
  name: g.title,
  emoji: g.emoji,
  target: Number(g.target),
  saved: Number(g.saved),
  deadline: g.deadlineIso || null,
  note: g.quote,
  color: g.color,
});

export const toContribution = (c) => ({
  id: c.id,
  goalId: c.goal_id,
  goalTitle: c.goal_name || "Savings goal",
  goalEmoji: c.goal_emoji || "🎯",
  amount: Number(c.amount),
  dateIso: c.created_at && String(c.created_at).slice(0, 10) === c.date ? c.created_at : c.date,
  dateLabel: contributionLabel(c.date, c.created_at),
});

export const toNotif = (n) => ({
  id: n.id,
  type: n.type,
  icon: NOTIF_ICON_MAP[n.type] ?? Bell,
  title: n.title,
  body: n.body,
  time: timeAgo(n.created_at),
  read: n.read,
  color: n.color,
});

export const toProfile = (u) =>
  u && {
    ...u,
    university: u.university || "",
    major: u.major || "",
    role: u.role || "student",
  };
