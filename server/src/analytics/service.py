from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.entities.transaction import Transaction


def get_analytics(session: Session, user_id: int | None = None) -> dict:
    query = select(Transaction).order_by(Transaction.transaction_date)
    if user_id is not None:
        query = query.where(Transaction.user_id == user_id)
    transactions = session.scalars(query).all()

    income = sum((item.amount for item in transactions if item.type == 'income'), Decimal('0'))
    expenses = sum((abs(item.amount) for item in transactions if item.type == 'expense'), Decimal('0'))
    expense_items = [item for item in transactions if item.type == 'expense']
    categories = defaultdict(Decimal)
    for item in expense_items:
        categories[item.category] += abs(item.amount)

    today = date.today()
    months = []
    year, month = today.year, today.month
    for _ in range(6):
        months.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()

    monthly = []
    for month_year, month_number in months:
        month_income = sum((item.amount for item in transactions if item.type == 'income' and item.transaction_date.year == month_year and item.transaction_date.month == month_number), Decimal('0'))
        month_expenses = sum((abs(item.amount) for item in transactions if item.type == 'expense' and item.transaction_date.year == month_year and item.transaction_date.month == month_number), Decimal('0'))
        monthly.append({'month': date(month_year, month_number, 1).strftime('%b'), 'income': float(month_income), 'expenses': float(month_expenses), 'savings': float(month_income - month_expenses)})

    return {
        'summary': {
            'total_income': float(income),
            'total_expenses': float(expenses),
            'savings_rate': float((income - expenses) / income * 100) if income else 0,
            'average_expense': float(expenses / len(expense_items)) if expense_items else 0,
            'transaction_count': len(transactions),
        },
        'monthly_trend': monthly,
        'expense_breakdown': [{'name': name, 'value': float(value)} for name, value in sorted(categories.items(), key=lambda entry: entry[1], reverse=True)],
    }
