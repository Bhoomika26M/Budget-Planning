from datetime import date

from sqlalchemy.orm import Session

from src.dashboard.transaction_model import Transaction


def get_analytics(session: Session, user_id: int) -> dict:
    transactions = (
        session.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.date, Transaction.id)
        .all()
    )
    income_transactions = [
        transaction for transaction in transactions if transaction.type == "income"
    ]
    expense_transactions = [
        transaction for transaction in transactions if transaction.type == "expense"
    ]
    total_income = sum(float(transaction.amount) for transaction in income_transactions)
    total_expenses = sum(float(transaction.amount) for transaction in expense_transactions)

    monthly_totals: dict[str, dict[str, float]] = {}
    for transaction in transactions:
        if transaction.type not in {"income", "expense"}:
            continue
        month_key = transaction.date.strftime("%Y-%m")
        totals = monthly_totals.setdefault(month_key, {"income": 0.0, "expenses": 0.0})
        bucket = "income" if transaction.type == "income" else "expenses"
        totals[bucket] += float(transaction.amount)

    category_totals: dict[str, float] = {}
    for transaction in expense_transactions:
        category_totals[transaction.category] = (
            category_totals.get(transaction.category, 0.0) + float(transaction.amount)
        )

    return {
        "has_data": bool(transactions),
        "total_income": total_income,
        "total_expenses": total_expenses,
        "savings_rate": (
            ((total_income - total_expenses) / total_income) * 100
            if total_income > 0
            else 0.0
        ),
        "avg_tx_amount": (
            total_expenses / len(expense_transactions) if expense_transactions else 0.0
        ),
        "monthly_trend": [
            {
                "month": date.fromisoformat(f"{month_key}-01").strftime("%b %Y"),
                "income": totals["income"],
                "expenses": totals["expenses"],
                "savings": totals["income"] - totals["expenses"],
            }
            for month_key, totals in sorted(monthly_totals.items())
        ],
        "expense_breakdown": [
            {"name": name, "value": value}
            for name, value in sorted(
                category_totals.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ],
    }
