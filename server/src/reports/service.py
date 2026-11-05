import csv
import io
from collections import defaultdict
from datetime import date

from sqlalchemy import extract
from sqlalchemy.orm import Session

from src.budgets.entity import Budget
from src.expenses.entity import Expense
from src.income.entity import Income


def build_report(db: Session, user_id: int, period: str = "monthly", month: str | None = None) -> dict:
    today = date.today()
    if month:
        year, mon = (int(part) for part in month.split("-"))
    else:
        year, mon = today.year, today.month

    expense_q = db.query(Expense).filter(Expense.user_id == user_id)
    income_q = db.query(Income).filter(Income.user_id == user_id)

    expense_q = expense_q.filter(extract("year", Expense.expense_date) == year)
    income_q = income_q.filter(extract("year", Income.date) == year)

    if period == "monthly":
        expense_q = expense_q.filter(extract("month", Expense.expense_date) == mon)
        income_q = income_q.filter(extract("month", Income.date) == mon)
        label = date(year, mon, 1).strftime("%B %Y")
        title = f"{label} Monthly Report"
        budget_multiplier = 1
    else:
        label = str(year)
        title = f"{year} Annual Report"
        budget_multiplier = today.month if year == today.year else 12

    expenses = expense_q.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()
    incomes = income_q.order_by(Income.date.desc(), Income.id.desc()).all()
    counted = [e for e in expenses if e.status != "Cancelled"]

    total_income = sum(float(i.amount) for i in incomes)
    total_expenses = sum(float(e.amount) for e in counted)

    by_category = defaultdict(float)
    for e in counted:
        by_category[e.category] += float(e.amount)

    trend = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for e in counted:
        trend[e.expense_date.strftime("%Y-%m")]["expenses"] += float(e.amount)
    for i in incomes:
        trend[i.date.strftime("%Y-%m")]["income"] += float(i.amount)

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.period == "monthly")
        .order_by(Budget.id.asc())
        .all()
    )
    budget_rows = []
    for b in budgets:
        budgeted = float(b.amount) * budget_multiplier
        actual = sum(v for k, v in by_category.items() if k.lower() == b.category.lower())
        variance = budgeted - actual
        budget_rows.append({
            "category": b.category,
            "color": b.color,
            "budgeted": round(budgeted, 2),
            "actual": round(actual, 2),
            "variance": round(variance, 2),
            "status": "Under budget" if variance >= 0 else "Over budget",
        })

    return {
        "period": period,
        "month": f"{year:04d}-{mon:02d}",
        "label": label,
        "title": title,
        "generated_on": today.isoformat(),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(total_income - total_expenses, 2),
        "by_category": [
            {"category": k, "total": round(v, 2)}
            for k, v in sorted(by_category.items(), key=lambda kv: -kv[1])
        ],
        "trend": [
            {
                "month": k,
                "label": date(int(k[:4]), int(k[5:]), 1).strftime("%b"),
                "income": round(v["income"], 2),
                "expenses": round(v["expenses"], 2),
            }
            for k, v in sorted(trend.items())
        ],
        "budgets": budget_rows,
        "expenses": [
            {
                "id": e.id,
                "description": e.description or e.category,
                "category": e.category,
                "amount": float(e.amount),
                "date": e.expense_date.isoformat(),
                "status": e.status,
            }
            for e in expenses
        ],
        "income": [
            {
                "id": i.id,
                "source": i.category,
                "amount": float(i.amount),
                "date": i.date.isoformat(),
                "frequency": i.frequency,
            }
            for i in incomes
        ],
    }


def _report_rows(report: dict) -> list[list]:
    rows: list[list] = [
        ["BudgetBuddy Financial Report", report["title"]],
        ["Generated", report["generated_on"]],
        [],
        ["SUMMARY"],
        ["Total Income", report["total_income"]],
        ["Total Expenses", report["total_expenses"]],
        ["Net Savings", report["net_savings"]],
        [],
        ["BUDGET vs ACTUALS"],
        ["Category", "Budgeted", "Actual", "Variance", "Status"],
    ]
    rows += [[b["category"], b["budgeted"], b["actual"], b["variance"], b["status"]] for b in report["budgets"]]
    rows += [[], ["SPENDING BY CATEGORY"], ["Category", "Total"]]
    rows += [[c["category"], c["total"]] for c in report["by_category"]]
    rows += [[], ["TRANSACTIONS"], ["Description", "Category", "Amount", "Date", "Status"]]
    rows += [[e["description"], e["category"], e["amount"], e["date"], e["status"]] for e in report["expenses"]]
    rows += [[], ["INCOME HISTORY"], ["Source", "Amount", "Date", "Frequency"]]
    rows += [[i["source"], i["amount"], i["date"], i["frequency"]] for i in report["income"]]
    return rows


def export_csv(report: dict) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(_report_rows(report))
    # BOM so Excel opens the ₹ symbol / UTF-8 correctly
    return ("﻿" + buffer.getvalue()).encode("utf-8")


def export_xlsx(report: dict) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    header_fill = PatternFill("solid", fgColor="2E93C7")
    header_font = Font(bold=True, color="FFFFFF")
    title_font = Font(bold=True, size=14, color="0C2A45")
    money = '"₹"#,##0.00'

    wb = Workbook()

    def sheet(ws, title, headers, rows, money_cols=()):
        ws.title = title
        ws.append(headers)
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        for row in rows:
            ws.append(row)
        for col in money_cols:
            for (cell,) in ws.iter_rows(min_row=2, min_col=col, max_col=col):
                cell.number_format = money
        for column in ws.columns:
            width = max(len(str(c.value or "")) for c in column) + 3
            ws.column_dimensions[column[0].column_letter].width = min(max(width, 12), 50)
        ws.freeze_panes = "A2"

    summary = wb.active
    summary.title = "Summary"
    summary["A1"] = "BudgetBuddy"
    summary["A1"].font = title_font
    summary["A2"] = report["title"]
    summary["A3"] = f"Generated: {report['generated_on']}"
    summary.append([])
    for label, key in (("Total Income", "total_income"), ("Total Expenses", "total_expenses"), ("Net Savings", "net_savings")):
        summary.append([label, report[key]])
        summary.cell(row=summary.max_row, column=1).font = Font(bold=True)
        summary.cell(row=summary.max_row, column=2).number_format = money
    summary.column_dimensions["A"].width = 22
    summary.column_dimensions["B"].width = 18

    sheet(
        wb.create_sheet(), "Budget vs Actuals",
        ["Category", "Budgeted", "Actual", "Variance", "Status"],
        [[b["category"], b["budgeted"], b["actual"], b["variance"], b["status"]] for b in report["budgets"]],
        money_cols=(2, 3, 4),
    )
    sheet(
        wb.create_sheet(), "Expenses",
        ["Description", "Category", "Amount", "Date", "Status"],
        [[e["description"], e["category"], e["amount"], e["date"], e["status"]] for e in report["expenses"]],
        money_cols=(3,),
    )
    sheet(
        wb.create_sheet(), "Income",
        ["Source", "Amount", "Date", "Frequency"],
        [[i["source"], i["amount"], i["date"], i["frequency"]] for i in report["income"]],
        money_cols=(2,),
    )

    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()
