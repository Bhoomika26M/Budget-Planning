from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.dashboard.transaction_model import Transaction


# Reports that are built from the user's saved transactions.
TRANSACTION_REPORTS = {"monthly-summary", "expense-history", "income-statement"}


def _month_label(year: int, month: int) -> str:
    return date(year, month, 1).strftime("%b %Y")


def _load_transactions(db: Session, user_id: int):
    return db.scalars(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.date, Transaction.id)
    ).all()


def get_monthly_summary(db: Session, user_id: int) -> dict:
    """Totals and month-by-month data for the Monthly Summary page."""
    transactions = _load_transactions(db, user_id)

    total_income = 0.0
    total_expenses = 0.0
    income_count = 0
    expense_count = 0
    months = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})

    for item in transactions:
        amount = abs(float(item.amount))
        key = (item.date.year, item.date.month)

        if item.type == "income":
            total_income += amount
            income_count += 1
            months[key]["income"] += amount
        elif item.type == "expense":
            total_expenses += amount
            expense_count += 1
            months[key]["expenses"] += amount

    monthly_data = [
        {
            "month": _month_label(year, month),
            "income": round(values["income"], 2),
            "expenses": round(values["expenses"], 2),
            "savings": round(values["income"] - values["expenses"], 2),
        }
        for (year, month), values in sorted(months.items())
    ]

    net_savings = total_income - total_expenses

    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": round(net_savings / total_income * 100, 1) if total_income else 0,
        "income_transactions": income_count,
        "expense_transactions": expense_count,
        "monthly_data": monthly_data,
    }


# ---------------------------------------------------------------------------
# Generic report tables (used by the on-screen tables and by CSV/Excel/PDF)
#
# Every report becomes:
#   {"title", "columns": [{"label", "kind"}], "rows": [[...]], "totals": [...] | None}
# where kind is one of: text, int, money, percent
# ---------------------------------------------------------------------------

def _monthly_table(transactions) -> dict:
    months = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for item in transactions:
        key = (item.date.year, item.date.month)
        amount = abs(float(item.amount))
        if item.type == "income":
            months[key]["income"] += amount
        elif item.type == "expense":
            months[key]["expenses"] += amount

    rows = [
        [
            _month_label(year, month),
            round(v["income"], 2),
            round(v["expenses"], 2),
            round(v["income"] - v["expenses"], 2),
        ]
        for (year, month), v in sorted(months.items())
    ]
    totals = None
    if rows:
        totals = [
            "Total",
            round(sum(r[1] for r in rows), 2),
            round(sum(r[2] for r in rows), 2),
            round(sum(r[3] for r in rows), 2),
        ]

    return {
        "title": "Monthly Summary",
        "columns": [
            {"label": "Month", "kind": "text"},
            {"label": "Income", "kind": "money"},
            {"label": "Expenses", "kind": "money"},
            {"label": "Savings", "kind": "money"},
        ],
        "rows": rows,
        "totals": totals,
    }


def _expense_history_table(transactions) -> dict:
    categories = defaultdict(lambda: {"count": 0, "total": 0.0})
    for item in transactions:
        if item.type != "expense":
            continue
        categories[item.category]["count"] += 1
        categories[item.category]["total"] += abs(float(item.amount))

    grand_total = sum(v["total"] for v in categories.values())
    ordered = sorted(categories.items(), key=lambda entry: entry[1]["total"], reverse=True)

    rows = [
        [
            name,
            v["count"],
            round(v["total"], 2),
            round(v["total"] / grand_total * 100, 1) if grand_total else 0,
        ]
        for name, v in ordered
    ]
    totals = None
    if rows:
        totals = ["Total", sum(r[1] for r in rows), round(grand_total, 2), 100]

    return {
        "title": "Expense History",
        "columns": [
            {"label": "Category", "kind": "text"},
            {"label": "Transactions", "kind": "int"},
            {"label": "Total Spent", "kind": "money"},
            {"label": "Share of Expenses", "kind": "percent"},
        ],
        "rows": rows,
        "totals": totals,
    }


def _income_statement_table(transactions) -> dict:
    incomes = [t for t in transactions if t.type == "income"]
    rows = [
        [
            str(t.date),
            t.description,
            t.category,
            t.account,
            round(abs(float(t.amount)), 2),
        ]
        for t in incomes
    ]
    totals = None
    if rows:
        totals = ["Total", "", "", "", round(sum(r[4] for r in rows), 2)]

    return {
        "title": "Income Statement",
        "columns": [
            {"label": "Date", "kind": "text"},
            {"label": "Description", "kind": "text"},
            {"label": "Source", "kind": "text"},
            {"label": "Account", "kind": "text"},
            {"label": "Amount", "kind": "money"},
        ],
        "rows": rows,
        "totals": totals,
    }


_BUILDERS = {
    "monthly-summary": _monthly_table,
    "expense-history": _expense_history_table,
    "income-statement": _income_statement_table,
}


def build_report_table(kind: str, transactions) -> dict:
    return _BUILDERS[kind](transactions)


def get_report_table(db: Session, user_id: int, kind: str) -> dict:
    return build_report_table(kind, _load_transactions(db, user_id))