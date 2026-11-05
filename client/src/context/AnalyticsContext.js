// Fetches /api/analytics/overview (charts + headline numbers) and keeps it
// fresh whenever expenses / income / goals change.
import { useEffect, useState } from "react";

import api from "../services/api";
import { colorForCategory } from "../data/constants";
import { useFinance } from "./FinanceContext";

const EMPTY = {
  monthly_trends: [],
  savings_growth: [],
  by_category: [],
  all_time_by_category: [],
  stats: {},
  total_spending: 0,
  total_income: 0,
};

export function useAnalytics({ month, months = 7, enabled = true } = {}) {
  const { dataVersion, selectedMonth } = useFinance();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const target = month || selectedMonth;

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setLoading(true);
    api
      .getAnalytics({ month: target, months })
      .then((res) => active && (setData(res), setError("")))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [target, months, dataVersion, enabled]);

  // Chart-ready series in the shape the Figma charts expect
  const monthlyTrend = data.monthly_trends.map((m) => ({
    month: m.label,
    income: m.income,
    expenses: m.expenses,
    savings: m.savings,
  }));
  const savingsGrowth = data.savings_growth.map((m) => ({ month: m.label, amount: m.amount }));
  const categoryExpenses = data.by_category.map((c, i) => ({
    name: c.category,
    value: c.total,
    color: colorForCategory(c.category, i),
  }));

  return { data, loading, error, monthlyTrend, savingsGrowth, categoryExpenses };
}

export default useAnalytics;
