import { useEffect, useState } from "react";

const DEFAULT_BUDGETS = [
  {
    cat: "Food",
    allocated: 5000,
    spent: 3200,
    color: "#2E93C7",
  },
  {
    cat: "Transport",
    allocated: 3000,
    spent: 1800,
    color: "#0D6D91",
  },
  {
    cat: "Entertainment",
    allocated: 2000,
    spent: 1200,
    color: "#7CB8D4",
  },
];

function useBudgets() {
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("bb_monthly_budget");
    return saved ? Number(saved) : 25000;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem("bb_budgets");

    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
  });

  useEffect(() => {
    localStorage.setItem(
      "bb_monthly_budget",
      monthlyBudget
    );
  }, [monthlyBudget]);

  useEffect(() => {
    localStorage.setItem(
      "bb_budgets",
      JSON.stringify(budgets)
    );
  }, [budgets]);

  const totalAlloc = budgets.reduce(
    (sum, budget) => sum + budget.allocated,
    0
  );

  const totalSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const unallocated = Math.max(
    monthlyBudget - totalAlloc,
    0
  );

  const remaining = Math.max(
    monthlyBudget - totalSpent,
    0
  );

  const utilPct =
    monthlyBudget > 0
      ? Math.min(
          Math.round((totalSpent / monthlyBudget) * 100),
          100
        )
      : 0;

  const allocPct =
    monthlyBudget > 0
      ? Math.min(
          Math.round((totalAlloc / monthlyBudget) * 100),
          100
        )
      : 0;

  const saveBudget = (budget) => {
    setBudgets((currentBudgets) => {
      const exists = currentBudgets.some(
        (item) => item.cat === budget.cat
      );

      if (exists) {
        return currentBudgets.map((item) =>
          item.cat === budget.cat
            ? budget
            : item
        );
      }

      return [...currentBudgets, budget];
    });
  };

  const deleteBudget = (category) => {
    setBudgets((currentBudgets) =>
      currentBudgets.filter(
        (budget) => budget.cat !== category
      )
    );
  };

  const utilizationData = budgets.map((budget) => ({
    name: budget.cat,
    allocated: budget.allocated,
    spent: budget.spent,
    remaining: Math.max(
      budget.allocated - budget.spent,
      0
    ),
    pct:
      budget.allocated > 0
        ? Math.round(
            (budget.spent / budget.allocated) * 100
          )
        : 0,
    color: budget.color,
  }));

  const allocationData = budgets.map((budget) => ({
    name: budget.cat,
    value: budget.allocated,
    color: budget.color,
  }));

  if (unallocated > 0) {
    allocationData.push({
      name: "Unallocated",
      value: unallocated,
      color: "#E4EFF7",
    });
  }

  return {
    budgets,
    monthlyBudget,
    setMonthlyBudget,

    totalAlloc,
    totalSpent,
    unallocated,
    remaining,

    utilPct,
    allocPct,

    utilizationData,
    allocationData,

    saveBudget,
    deleteBudget,
  };
}

export default useBudgets;