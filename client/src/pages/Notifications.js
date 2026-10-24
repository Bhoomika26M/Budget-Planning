import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Wallet,
  Target,
  CheckCheck,
  CircleCheck,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { api } from "../services/api";
import "./Notifications.css";

const STORAGE_KEY = "budgetbuddy_notifications_state";
const UNREAD_COUNT_KEY = "budgetbuddy_unread_notification_count";
const UNREAD_COUNT_EVENT = "budgetbuddy:unread-count";

const COLORS = {
  alert: "#e53e3e",
  reminder: "#f59e0b",
  success: "#22c55e",
  income: "#2E93C7",
  info: "#64748b",
};

function readStoredState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Notifications remain usable if local storage is unavailable.
  }
}

function getArray(response, keys = []) {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }

  if (Array.isArray(response?.data)) return response.data;

  return [];
}

function getAmount(item) {
  const value = Number(item?.amount);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getDate(item) {
  return (
    item?.expense_date ??
    item?.date ??
    item?.created_at ??
    item?.transaction_date ??
    item?.updated_at ??
    ""
  );
}

function relativeTime(value) {
  if (!value) return "Recent update";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recent update";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";

  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function makeNotification({ id, type, title, body, time }) {
  return {
    id: String(id),
    type,
    title,
    body,
    time: relativeTime(time),
    color: COLORS[type] || COLORS.info,
  };
}

/*
 * Budget alert rules:
 * - Only expenses from the current month and year.
 * - Use expense.expense_date, expense.category and expense.amount.
 * - Only monthly budgets.
 * - Use budget.amount as the allocated budget.
 * - Generate an alert when 85% or more is used.
 */
function generateNotifications({ budgets, expenses, goals, income }) {
  const notifications = [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spendingByCategory = {};

  expenses.forEach((expense) => {
    if (!expense?.expense_date) return;

    const expenseDate = new Date(`${expense.expense_date}T00:00:00`);

    if (
      Number.isNaN(expenseDate.getTime()) ||
      expenseDate.getMonth() !== currentMonth ||
      expenseDate.getFullYear() !== currentYear
    ) {
      return;
    }

    const category = String(
      expense.category || "Miscellaneous"
    )
      .trim()
      .toLowerCase();

    const amount = Number(expense.amount || 0);

    if (!Number.isFinite(amount) || amount < 0) return;

    spendingByCategory[category] =
      (spendingByCategory[category] || 0) + amount;
  });

  // Monthly budget notifications.
  budgets.forEach((budget) => {
    if (budget.period !== "monthly") return;

    const categoryName = String(budget.category || "").trim();

    if (!categoryName) return;

    const category = categoryName.toLowerCase();
    const limit = Number(budget.amount);
    const spent = Number(spendingByCategory[category] || 0);

    if (!Number.isFinite(limit) || limit <= 0) return;

    const percentage = (spent / limit) * 100;

    if (percentage < 85) return;

    const exceeded = percentage >= 100;
    const budgetId = budget.id ?? budget.budget_id ?? category;

    notifications.push(
      makeNotification({
        id: `budget-${budgetId}-${exceeded ? "exceeded" : "near"}`,
        type: exceeded ? "alert" : "reminder",
        title: exceeded
          ? `Budget exceeded: ${categoryName}`
          : `Budget limit approaching: ${categoryName}`,
        body: exceeded
          ? `You've used ${Math.round(
              percentage
            )}% of your ${categoryName} budget. Review your spending.`
          : `Your ${categoryName} spending has reached ${Math.round(
              percentage
            )}% of its budget.`,
        time: budget.updated_at ?? budget.created_at,
      })
    );
  });

  // Savings goal notifications.
  goals.forEach((goal) => {
    const id = goal.id ?? goal.goal_id;

    const name =
      goal.name ?? goal.title ?? goal.goal_name ?? "Savings goal";

    const target = Number(goal.target ?? goal.target_amount);
    const saved = Number(goal.saved ?? goal.saved_amount);

    if (
      id === undefined ||
      !Number.isFinite(target) ||
      !Number.isFinite(saved) ||
      target <= 0 ||
      saved < 0
    ) {
      return;
    }

    if (saved >= target) {
      notifications.push(
        makeNotification({
          id: `goal-complete-${id}`,
          type: "success",
          title: `Savings goal completed: ${name}`,
          body: `Congratulations! You've reached your savings target of ₹${target.toLocaleString(
            "en-IN"
          )}.`,
          time: goal.updated_at ?? goal.created_at,
        })
      );
    } else if (saved / target >= 0.5) {
      notifications.push(
        makeNotification({
          id: `goal-milestone-${id}`,
          type: "success",
          title: `Savings milestone: ${name}`,
          body: `You've saved ${Math.round(
            (saved / target) * 100
          )}% of your target. Keep going!`,
          time: goal.updated_at ?? goal.created_at,
        })
      );
    }

    const deadline = goal.deadline ?? goal.target_date ?? goal.due_date;

    if (deadline && saved < target) {
      const dueDate = new Date(deadline);

      if (!Number.isNaN(dueDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil(
          (dueDate.getTime() - today.getTime()) / 86400000
        );

        if (daysLeft >= 0 && daysLeft <= 30) {
          notifications.push(
            makeNotification({
              id: `goal-deadline-${id}`,
              type: "reminder",
              title: `Savings deadline approaching: ${name}`,
              body:
                daysLeft === 0
                  ? "Your savings goal is due today."
                  : `Your savings goal is due in ${daysLeft} day${
                      daysLeft === 1 ? "" : "s"
                    }.`,
              time: goal.updated_at ?? goal.created_at,
            })
          );
        }
      }
    }
  });

  // Latest income notification.
  if (income.length > 0) {
    const latest = [...income].sort((a, b) => {
      const dateA = new Date(getDate(a) || 0).getTime() || 0;
      const dateB = new Date(getDate(b) || 0).getTime() || 0;

      return dateB - dateA;
    })[0];

    const amount = getAmount(latest);

    notifications.push(
      makeNotification({
        id: `income-${
          latest.id ?? latest.income_id ?? getDate(latest) ?? "latest"
        }`,
        type: "income",
        title: "Income recorded",
        body: `An income entry of ₹${amount.toLocaleString(
          "en-IN"
        )} is available in your income tracker.`,
        time: getDate(latest),
      })
    );
  }

  const priority = {
    alert: 0,
    reminder: 1,
    success: 2,
    income: 3,
    info: 4,
  };

  return notifications.sort(
    (a, b) => (priority[a.type] ?? 5) - (priority[b.type] ?? 5)
  );
}

function NotificationIcon({ type }) {
  const Icon = {
    alert: AlertTriangle,
    reminder: Bell,
    success: Target,
    income: Wallet,
    info: Info,
  }[type] || Bell;

  return (
    <div
      className="notification-icon"
      style={{
        color: COLORS[type] || COLORS.info,
        backgroundColor: `${COLORS[type] || COLORS.info}15`,
      }}
    >
      <Icon size={18} />
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storedState, setStoredState] = useState(readStoredState);

  const visibleNotifications = notifications.filter(
    (item) => !storedState[item.id]?.deleted
  );

  const unreadCount = visibleNotifications.filter(
    (item) => !storedState[item.id]?.read
  ).length;

  // Keep the navbar's unread count synchronized with this page.
  useEffect(() => {
    try {
      localStorage.setItem(UNREAD_COUNT_KEY, String(unreadCount));
    } catch {
      // The event still updates the navbar in this tab.
    }

    window.dispatchEvent(
      new CustomEvent(UNREAD_COUNT_EVENT, {
        detail: unreadCount,
      })
    );
  }, [unreadCount]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.getBudgets(),
        api.getExpenses(),
        api.getSavingsGoals(),
        api.getIncome(),
      ]);

      const [
        budgetResult,
        expenseResult,
        savingsResult,
        incomeResult,
      ] = results;

      const unwrap = (result, label) => {
        if (result.status === "fulfilled") return result.value;

        console.warn(`Could not load ${label}:`, result.reason);
        return null;
      };

      const budgetData = unwrap(budgetResult, "budgets");
      const expenseData = unwrap(expenseResult, "expenses");
      const savingsData = unwrap(savingsResult, "savings goals");
      const incomeData = unwrap(incomeResult, "income");

      if (
        budgetData === null &&
        expenseData === null &&
        savingsData === null &&
        incomeData === null
      ) {
        throw new Error(
          "Unable to load your financial data. Please try again."
        );
      }

      const generated = generateNotifications({
        budgets: getArray(budgetData, ["budgets", "items"]),
        expenses: getArray(expenseData, ["expenses", "items"]),
        goals: getArray(savingsData, ["goals", "items"]),
        income: getArray(incomeData, ["income", "incomes", "items"]),
      });

      setNotifications(generated);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    saveStoredState(storedState);
  }, [storedState]);

  function markAsRead(id) {
    setStoredState((previous) => ({
      ...previous,
      [id]: { ...previous[id], read: true },
    }));
  }

  function markAllAsRead() {
    setStoredState((previous) => {
      const next = { ...previous };

      visibleNotifications.forEach((item) => {
        next[item.id] = { ...next[item.id], read: true };
      });

      return next;
    });
  }

  function deleteNotification(id) {
    setStoredState((previous) => ({
      ...previous,
      [id]: { ...previous[id], deleted: true },
    }));
  }

  return (
    <section className="notifications-page">
      <header className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="notification-text-button"
            onClick={markAllAsRead}
          >
            <CheckCheck size={17} />
            Mark all read
          </button>
        )}
      </header>

      {error && (
        <div className="notifications-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button type="button" onClick={loadNotifications}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="notifications-empty">
          <p>Loading your financial updates…</p>
        </div>
      ) : (
        <div className="notifications-list">
          {visibleNotifications.map((item) => {
            const isRead = Boolean(storedState[item.id]?.read);

            return (
              <article
                key={item.id}
                className={`notification-card ${
                  !isRead ? "notification-unread" : ""
                }`}
                style={
                  !isRead ? { borderLeftColor: item.color } : undefined
                }
                onClick={() => markAsRead(item.id)}
              >
                <NotificationIcon type={item.type} />

                <div className="notification-content">
                  <div className="notification-card-heading">
                    <h3>{item.title}</h3>
                  </div>

                  <p>{item.body}</p>

                  <div className="notification-meta">
                    <span>{item.time}</span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!isRead && (
                    <button
                      type="button"
                      title="Mark as read"
                      aria-label={`Mark ${item.title} as read`}
                      onClick={(event) => {
                        event.stopPropagation();
                        markAsRead(item.id);
                      }}
                    >
                      <CircleCheck size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Delete notification"
                    aria-label={`Delete ${item.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNotification(item.id);
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              </article>
            );
          })}

          {visibleNotifications.length === 0 && (
            <div className="notifications-empty">
              <CheckCheck size={38} />
              <h3>All clear!</h3>
              <p>
                No notifications to show. Alerts will appear when
                your financial data meets a notification rule.
              </p>
              <button type="button" onClick={loadNotifications}>
                Refresh notifications
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}