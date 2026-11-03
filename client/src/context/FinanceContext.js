// Loads the signed-in user's financial data from the API and exposes it
// (in the shapes the Figma screens use) together with CRUD actions.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api from "../services/api";
import {
  fromExpense,
  fromGoal,
  fromIncome,
  toBudget,
  toContribution,
  toExpense,
  toGoal,
  toIncome,
  toNotif,
} from "../services/mappers";
import { canDo } from "../utils/permissions";
import { monthKey, toISODate } from "../utils/formatDate";
import { EXPENSE_CATS } from "../data/constants";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const FinanceContext = createContext(null);

const byDateDesc = (a, b) => (b.dateIso || "").localeCompare(a.dateIso || "") || b.id - a.id;

export function FinanceProvider({ children }) {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const role = user?.role ?? "student";
  const isFinanceUser = Boolean(user) && role !== "admin";
  const canBudget = canDo(role, "budget_planning");

  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [categories, setCategories] = useState(EXPENSE_CATS);
  const [selectedDate, setSelectedDate] = useState(() => toISODate());
  const [dataVersion, setDataVersion] = useState(0); // bump to refresh charts

  const selectedMonth = monthKey(selectedDate);

  // Show API errors as a toast and re-throw so callers can stop their flow.
  const guard = useCallback(
    async (promise, successMsg) => {
      try {
        const result = await promise;
        if (successMsg) notify(successMsg);
        setDataVersion((v) => v + 1);
        return result;
      } catch (err) {
        notify(err.message || "Something went wrong.", "error");
        throw err;
      }
    },
    [notify]
  );

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setNotifs((await api.getNotifications()).map(toNotif));
    } catch {
      /* non-critical */
    }
  }, [user]);

  const loadBudgets = useCallback(
    async (month = selectedMonth) => {
      if (!isFinanceUser || !canBudget) {
        setBudgets([]);
        return;
      }
      try {
        setBudgets((await api.getBudgets(month)).map(toBudget));
      } catch {
        setBudgets([]);
      }
    },
    [isFinanceUser, canBudget, selectedMonth]
  );

  const loadContributions = useCallback(async () => {
    setContributions((await api.getAllContributions()).map(toContribution));
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) return;
    if (!isFinanceUser) {
      loadNotifications();
      return;
    }
    setLoading(true);
    try {
      const [exp, inc, gls, contribs, cats] = await Promise.all([
        api.getExpenses(),
        api.getIncome(),
        api.getSavingsGoals(),
        api.getAllContributions(),
        api.getCategories().catch(() => null),
      ]);
      setExpenses(exp.map(toExpense));
      setIncomeList(inc.map(toIncome));
      setGoals(gls.map(toGoal));
      setContributions(contribs.map(toContribution));
      if (cats && cats.length) setCategories(cats.map((c) => c.name));
      await Promise.all([loadBudgets(), loadNotifications()]);
      setDataVersion((v) => v + 1);
    } catch (err) {
      notify(err.message || "Could not load your data.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, isFinanceUser, loadBudgets, loadNotifications, notify]);

  // Reload whenever a different user signs in (or their role changes).
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIncomeList([]);
      setGoals([]);
      setContributions([]);
      setBudgets([]);
      setNotifs([]);
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);

  // Budgets follow the month picked in the header calendar.
  useEffect(() => {
    if (user) loadBudgets(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, canBudget]);

  // Poll notifications every minute so new alerts show up in the header.
  useEffect(() => {
    if (!user) return undefined;
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
  }, [user, loadNotifications]);

  // After money moves, budgets "spent" and automatic alerts change too.
  const afterSpendingChange = useCallback(() => {
    loadBudgets();
    loadNotifications();
  }, [loadBudgets, loadNotifications]);

  // ── Expenses ──────────────────────────────────────────────────
  const saveExpense = useCallback(
    async (e) => {
      const existing = e.id && expenses.some((x) => x.id === e.id);
      const saved = toExpense(
        await guard(
          existing ? api.updateExpense(e.id, fromExpense(e)) : api.createExpense(fromExpense(e)),
          existing ? "Expense updated." : "Expense added."
        )
      );
      setExpenses((prev) => (existing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]).sort(byDateDesc));
      afterSpendingChange();
      return saved;
    },
    [expenses, guard, afterSpendingChange]
  );

  const setExpenseStatus = useCallback(
    async (id, status) => {
      const saved = toExpense(await guard(api.updateExpense(id, { status }), `Marked as ${status}.`));
      setExpenses((prev) => prev.map((x) => (x.id === id ? saved : x)));
      afterSpendingChange();
    },
    [guard, afterSpendingChange]
  );

  const deleteExpense = useCallback(
    async (id) => {
      await guard(api.deleteExpense(id), "Expense deleted.");
      setExpenses((prev) => prev.filter((x) => x.id !== id));
      afterSpendingChange();
    },
    [guard, afterSpendingChange]
  );

  // ── Income ────────────────────────────────────────────────────
  const saveIncome = useCallback(
    async (i) => {
      const existing = i.id && incomeList.some((x) => x.id === i.id);
      const saved = toIncome(
        await guard(
          existing ? api.updateIncome(i.id, fromIncome(i)) : api.createIncome(fromIncome(i)),
          existing ? "Income updated." : "Income added."
        )
      );
      setIncomeList((prev) => (existing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]).sort(byDateDesc));
      return saved;
    },
    [incomeList, guard]
  );

  const deleteIncome = useCallback(
    async (id) => {
      await guard(api.deleteIncome(id), "Income deleted.");
      setIncomeList((prev) => prev.filter((x) => x.id !== id));
    },
    [guard]
  );

  // ── Budgets ───────────────────────────────────────────────────
  const saveBudget = useCallback(
    async (b) => {
      const payload = { category: b.cat, amount: Number(b.allocated), color: b.color };
      const saved = toBudget(
        await guard(
          b.id ? api.updateBudget(b.id, payload) : api.createBudget(payload),
          b.id ? "Budget updated." : "Budget category added."
        )
      );
      await loadBudgets();
      loadNotifications();
      return saved;
    },
    [guard, loadBudgets, loadNotifications]
  );

  const deleteBudget = useCallback(
    async (id) => {
      await guard(api.deleteBudget(id), "Budget category removed.");
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    },
    [guard]
  );

  const setMonthlyBudget = useCallback(
    async (amount) => {
      const res = await guard(api.setMonthlyBudget(Number(amount)), "Monthly budget saved.");
      setUser((u) => ({ ...u, monthly_budget: res.monthly_budget }));
      loadNotifications();
    },
    [guard, setUser, loadNotifications]
  );

  // ── Savings goals ─────────────────────────────────────────────
  const saveGoal = useCallback(
    async (g) => {
      const existing = g.id && goals.some((x) => x.id === g.id);
      const saved = toGoal(
        await guard(
          existing ? api.updateSavingsGoal(g.id, fromGoal(g)) : api.createSavingsGoal(fromGoal(g)),
          existing ? "Goal updated." : "Goal created."
        )
      );
      setGoals((prev) => (existing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
      return saved;
    },
    [goals, guard]
  );

  const deleteGoal = useCallback(
    async (id) => {
      await guard(api.deleteSavingsGoal(id), "Goal deleted.");
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setContributions((prev) => prev.filter((c) => c.goalId !== id));
    },
    [guard]
  );

  // Adds money to a goal and returns the updated goal.
  const contribute = useCallback(
    async (goal, amount) => {
      await guard(api.addSavingsContribution(goal.id, { amount: Number(amount), date: toISODate() }), "Savings added!");
      const updated = toGoal(await api.getSavingsGoal(goal.id));
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
      loadContributions();
      loadNotifications();
      return updated;
    },
    [guard, loadContributions, loadNotifications]
  );

  // ── Notifications ─────────────────────────────────────────────
  const markNotifRead = useCallback(async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await api.markNotificationRead(id).catch(() => {});
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.markAllNotificationsRead().catch(() => {});
  }, []);

  const deleteNotif = useCallback(async (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await api.deleteNotification(id).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      loading,
      dataVersion,
      expenses,
      incomeList,
      goals,
      contributions,
      budgets,
      notifs,
      categories,
      selectedDate,
      setSelectedDate,
      selectedMonth,
      monthlyBudget: Number(user?.monthly_budget ?? 0),
      reload: loadAll,
      loadNotifications,
      saveExpense,
      setExpenseStatus,
      deleteExpense,
      saveIncome,
      deleteIncome,
      saveBudget,
      deleteBudget,
      setMonthlyBudget,
      saveGoal,
      deleteGoal,
      contribute,
      markNotifRead,
      markAllNotifsRead,
      deleteNotif,
    }),
    [
      loading, dataVersion, expenses, incomeList, goals, contributions, budgets, notifs, categories, selectedDate,
      selectedMonth, user, loadAll, loadNotifications, saveExpense, setExpenseStatus, deleteExpense, saveIncome,
      deleteIncome, saveBudget, deleteBudget, setMonthlyBudget, saveGoal, deleteGoal, contribute, markNotifRead,
      markAllNotifsRead, deleteNotif,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside <FinanceProvider>");
  return ctx;
}
