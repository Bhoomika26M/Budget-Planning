from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, sessionmaker
from pydantic import BaseModel
from typing import List

# Import engine directly from your core database file
from src.database.core import engine 
from src.entities import Transaction

# ---- Database Session Dependency ----
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- Pydantic Schemas for Analytics ----
class MonthlyTrend(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float

class ExpenseBreakdown(BaseModel):
    name: str
    value: float

class AnalyticsResponse(BaseModel):
    has_data: bool
    total_income: float
    total_expenses: float
    savings_rate: float
    avg_tx_amount: float
    monthly_trend: List[MonthlyTrend]
    expense_breakdown: List[ExpenseBreakdown]

# ---- Route Registration ----
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
def fetch_analytics(
    user_id: int = Query(..., description="The ID of the user"),
    db: Session = Depends(get_db)
):
    try:
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        
        if not transactions:
            return AnalyticsResponse(
                has_data=False, total_income=0.0, total_expenses=0.0,
                savings_rate=0.0, avg_tx_amount=0.0, monthly_trend=[], expense_breakdown=[]
            )

        # Convert Decimal to float for calculations and JSON serialization
        total_income = sum(float(t.amount) for t in transactions if t.type == 'income')
        total_expenses = sum(abs(float(t.amount)) for t in transactions if t.type == 'expense')
        
        savings_rate = 0.0
        if total_income > 0:
            savings_rate = ((total_income - total_expenses) / total_income) * 100

        expense_txs = [t for t in transactions if t.type == 'expense']
        avg_tx_amount = total_expenses / len(expense_txs) if expense_txs else 0.0

        trend_dict = {}
        for t in transactions:
            # Matches your Mapped model field: transaction_date
            month_str = t.transaction_date.strftime("%b")
            amount_float = float(t.amount)
            
            if month_str not in trend_dict:
                trend_dict[month_str] = {"income": 0.0, "expenses": 0.0}
            
            if t.type == 'income':
                trend_dict[month_str]["income"] += amount_float
            else:
                trend_dict[month_str]["expenses"] += abs(amount_float)

        monthly_trend = [
            MonthlyTrend(
                month=month, income=data["income"], 
                expenses=data["expenses"], savings=data["income"] - data["expenses"]
            ) for month, data in trend_dict.items()
        ]

        cat_dict = {}
        for t in expense_txs:
            cat_dict[t.category] = cat_dict.get(t.category, 0.0) + abs(float(t.amount))
        
        expense_breakdown = [ExpenseBreakdown(name=k, value=v) for k, v in cat_dict.items()]
        expense_breakdown.sort(key=lambda x: x.value, reverse=True)

        return AnalyticsResponse(
            has_data=True, total_income=total_income, total_expenses=total_expenses,
            savings_rate=savings_rate, avg_tx_amount=avg_tx_amount,
            monthly_trend=monthly_trend, expense_breakdown=expense_breakdown
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))