
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.budgets.entity import Budget
from src.budgets.controller import router as budgets_router
from src.database.core import Base, engine
from src.entities.user import User
from src.auth.controller import router as auth_router
from src.expenses.entity import Expense
from src.expenses.controller import router as expenses_router
from src.analytics.controller import router as analytics_router
from src.income.entity import Income
from src.income.controller import router as income_router
from src.savings.entity import SavingsGoal, SavingsContribution
from src.savings.controller import router as savings_router

# Importing User ensures its table is registered with SQLAlchemy.
app = FastAPI(
    title="BudgetBuddy API",
    description="Backend API for personal budget planning and expense management.",
    version="1.0.0",
)

# Allow requests from the local React development server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables defined by imported SQLAlchemy models.
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(budgets_router)
app.include_router(expenses_router)
app.include_router(analytics_router)
app.include_router(income_router)
app.include_router(savings_router)
@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "success",
        "message": "BudgetBuddy API is running.",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
