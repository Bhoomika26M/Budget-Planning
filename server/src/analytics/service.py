from calendar import monthrange
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from src.budgets.entity import Budget
from src.entities.user import User
from src.expenses.entity import Expense
from src.income.entity import Income
from src.savings.entity import SavingsContribution, SavingsGoal


def _month_key(d: date) -> str:
    return d.strftime("%Y-%m")


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    index = year * 12 + (month - 1) + delta
    return index // 12, index % 12 + 1


def _last_months(year: int, month: int, count: int) -> list[tuple[int, int]]:
    return [_shift_month(year, month, -offset) for offset in range(count - 1, -1, -1)]


def _pct_change(current: float, previous: float) -> float | None:
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


def get_analytics_overview(db: Session, user_id: int, month: str | None = None, months: int = 7):
    today = date.today()
    if month:
        year, mon = (int(part) for part in month.split("-"))
    else:
        year, mon = today.year, today.month
    months = max(1, min(months, 24))
    selected_key = f"{year:04d}-{mon:02d}"

    user = db.query(User).filter(User.id == user_id).first()
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.status != "Cancelled")
        .all()
    )
    incomes = db.query(Income).filter(Income.user_id == user_id).all()
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.period == "monthly")
        .all()
    )
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    contributions = (
        db.query(SavingsContribution)
        .filter(SavingsContribution.user_id == user_id)
        .all()
    )

    # ── Monthly aggregates ────────────────────────────────────────
    expense_by_month = defaultdict(float)
    income_by_month = defaultdict(float)
    contrib_by_month = defaultdict(float)
    for e in expenses:
        expense_by_month[_month_key(e.expense_date)] += float(e.amount or 0)
    for i in incomes:
        income_by_month[_month_key(i.date)] += float(i.amount or 0)
    for c in contributions:
        contrib_by_month[_month_key(c.date)] += float(c.amount or 0)

    window = _last_months(year, mon, months)
    monthly_trends = []
    for y, m in window:
        key = f"{y:04d}-{m:02d}"
        inc = round(income_by_month.get(key, 0.0), 2)
        exp = round(expense_by_month.get(key, 0.0), 2)
        monthly_trends.append({
            "month": key,
            "label": date(y, m, 1).strftime("%b"),
            "income": inc,
            "expenses": exp,
            "savings": round(max(inc - exp, 0), 2),
            "total": exp,  # kept for older clients
        })

    # Savings growth: goal savings that existed before any recorded
    # contribution + cumulative contributions month by month.
    total_saved = sum(float(g.saved or 0) for g in goals)
    total_contrib = sum(float(c.amount or 0) for c in contributions)
    running = max(total_saved - total_contrib, 0)
    for key in sorted(k for k in contrib_by_month if k < f"{window[0][0]:04d}-{window[0][1]:02d}"):
        running += contrib_by_month[key]
    savings_growth = []
    for y, m in window:
        key = f"{y:04d}-{m:02d}"
        running += contrib_by_month.get(key, 0.0)
        savings_growth.append({"month": key, "label": date(y, m, 1).strftime("%b"), "amount": round(running, 2)})

    # ── Selected month figures ────────────────────────────────────
    month_expenses = [e for e in expenses if _month_key(e.expense_date) == selected_key]
    total_spending = sum(float(e.amount or 0) for e in month_expenses)
    total_income = income_by_month.get(selected_key, 0.0)

    category_totals = defaultdict(float)
    for e in month_expenses:
        category_totals[e.category or "Miscellaneous"] += float(e.amount or 0)

    all_time_categories = defaultdict(float)
    for e in expenses:
        all_time_categories[e.category or "Miscellaneous"] += float(e.amount or 0)

    budget_total = sum(float(b.amount or 0) for b in budgets)
    monthly_budget = float(user.monthly_budget or 0) if user else 0.0

    # Days elapsed in the selected month (whole month if it is in the past)
    days_in_month = monthrange(year, mon)[1]
    if (year, mon) == (today.year, today.month):
        days_elapsed = today.day
    elif (year, mon) > (today.year, today.month):
        days_elapsed = 1
    else:
        days_elapsed = days_in_month

    top_category = max(category_totals.items(), key=lambda kv: kv[1]) if category_totals else None

    savings_rate = round((total_income - total_spending) / total_income * 100, 1) if total_income else 0.0
    prev_y, prev_m = _shift_month(year, mon, -1)
    prev_key = f"{prev_y:04d}-{prev_m:02d}"
    prev_income = income_by_month.get(prev_key, 0.0)
    prev_exp = expense_by_month.get(prev_key, 0.0)
    prev_rate = round((prev_income - prev_exp) / prev_income * 100, 1) if prev_income else None

    # Budget efficiency: share of category budgets that stayed within limit.
    if budgets:
        within = 0
        for b in budgets:
            spent = sum(v for k, v in category_totals.items() if k.lower() == b.category.lower())
            if spent <= b.amount:
                within += 1
        budget_efficiency = round(within / len(budgets) * 100)
    else:
        budget_efficiency = None

    today_spending = sum(float(e.amount or 0) for e in expenses if e.expense_date == today)
    yesterday_spending = sum(
        float(e.amount or 0) for e in expenses if e.expense_date == today - timedelta(days=1)
    )

    active_goals = [g for g in goals if g.saved < g.target]
    goals_progress = (
        round(sum(min(g.saved / g.target, 1) for g in active_goals if g.target) / len(active_goals) * 100)
        if active_goals else (100 if goals else 0)
    )

    return {
        "month": selected_key,
        "total_spending": round(total_spending, 2),
        "total_income": round(total_income, 2),
        "net_savings": round(total_income - total_spending, 2),
        "budget_total": round(budget_total, 2),
        "monthly_budget": round(monthly_budget, 2),
        "remaining_budget": round((monthly_budget or budget_total) - total_spending, 2),
        "by_category": [
            {"category": c, "total": round(t, 2)}
            for c, t in sorted(category_totals.items(), key=lambda kv: -kv[1])
        ],
        "all_time_by_category": [
            {"category": c, "total": round(t, 2)}
            for c, t in sorted(all_time_categories.items(), key=lambda kv: -kv[1])
        ],
        "monthly_trends": monthly_trends,
        "savings_growth": savings_growth,
        "stats": {
            "avg_daily_spending": round(total_spending / max(days_elapsed, 1), 2),
            "top_category": {"name": top_category[0], "amount": round(top_category[1], 2)} if top_category else None,
            "savings_rate": savings_rate,
            "savings_rate_change": round(savings_rate - prev_rate, 1) if prev_rate is not None else None,
            "budget_efficiency": budget_efficiency,
            "today_spending": round(today_spending, 2),
            "yesterday_spending": round(yesterday_spending, 2),
            "today_change_pct": _pct_change(today_spending, yesterday_spending),
            "goals_progress": goals_progress,
            "active_goals": len(active_goals),
            "total_goal_savings": round(total_saved, 2),
        },
    }


def get_insights(db: Session, user_id: int) -> list[dict]:
    """Simple rule-based "AI Insights" shown on the dashboard (Premium)."""
    data = get_analytics_overview(db, user_id, months=2)
    insights: list[dict] = []
    today = date.today()

    spent = data["total_spending"]
    limit = data["monthly_budget"] or data["budget_total"]
    if limit:
        days_in_month = monthrange(today.year, today.month)[1]
        # Smooth the first week so day-1 purchases do not look alarming.
        expected = limit * max(today.day, 7) / days_in_month
        diff = (expected - spent) / expected * 100 if expected else 0
        if diff >= 0:
            insights.append({
                "kind": "positive",
                "title": "Spending on track",
                "body": f"You are {diff:.0f}% under your expected spend for this point in the month. Great discipline!",
            })
        else:
            insights.append({
                "kind": "warning",
                "title": "Spending ahead of plan",
                "body": f"You've spent ₹{spent:,.0f} — {abs(diff):.0f}% more than expected by today. Slow down a little.",
            })

    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.period == "monthly").all()
    cats = {c["category"].lower(): c["total"] for c in data["by_category"]}
    worst = None
    for b in budgets:
        pct = cats.get(b.category.lower(), 0) / b.amount * 100 if b.amount else 0
        if worst is None or pct > worst[1]:
            worst = (b, pct)
    if worst and worst[1] >= 70:
        insights.append({
            "kind": "warning",
            "title": f"{worst[0].category} budget alert",
            "body": f"{worst[0].category} is at {worst[1]:.0f}% of its limit — consider cutting back this week.",
        })
    elif data["stats"]["top_category"]:
        top = data["stats"]["top_category"]
        insights.append({
            "kind": "warning" if top["amount"] > spent * 0.4 else "positive",
            "title": f"Top category: {top['name']}",
            "body": f"₹{top['amount']:,.0f} spent on {top['name']} this month ({top['amount'] / spent * 100 if spent else 0:.0f}% of spending).",
        })

    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id, SavingsGoal.saved < SavingsGoal.target)
        .order_by(SavingsGoal.deadline.is_(None), SavingsGoal.deadline.asc())
        .first()
    )
    leftover = data["net_savings"]
    if goal:
        suggestion = max(min(leftover * 0.5, goal.target - goal.saved), 0) if leftover > 0 else 0
        if suggestion >= 1:
            body = f"Move ₹{suggestion:,.0f} of this month's surplus into your {goal.name} goal."
        else:
            body = f"₹{goal.target - goal.saved:,.0f} left for {goal.name}. Even small weekly deposits help."
        insights.append({"kind": "tip", "title": "Savings opportunity", "body": body})
    else:
        insights.append({
            "kind": "tip",
            "title": "Set a savings goal",
            "body": "Create a goal (e.g. Emergency Fund) so surplus money has a purpose.",
        })

    return insights[:3]
