import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database.core import Base, SessionLocal, add_missing_columns, engine

# Importing every entity registers its table with SQLAlchemy.
from src.entities.user import User  # noqa: F401
from src.expenses.entity import Expense  # noqa: F401
from src.income.entity import Income  # noqa: F401
from src.budgets.entity import Budget  # noqa: F401
from src.savings.entity import SavingsGoal, SavingsContribution  # noqa: F401
from src.notifications.entity import Notification  # noqa: F401
from src.categories.entity import Category  # noqa: F401
from src.support.entity import Feedback, Issue  # noqa: F401
from src.admin.entity import Announcement  # noqa: F401
from src.logs.entity import SystemLog  # noqa: F401

from src.auth.controller import router as auth_router
from src.users.controller import router as users_router
from src.expenses.controller import router as expenses_router
from src.income.controller import router as income_router
from src.budgets.controller import router as budgets_router
from src.savings.controller import router as savings_router
from src.analytics.controller import router as analytics_router
from src.reports.controller import router as reports_router
from src.notifications.controller import router as notifications_router
from src.categories.controller import router as categories_router
from src.support.controller import router as support_router
from src.admin.controller import router as admin_router
from src.seed import seed_demo_data

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)

app = FastAPI(
    title="BudgetBuddy API",
    description="Backend API for personal budget planning and expense management.",
    version="2.0.0",
)

# Allow requests from the React dev server (and FRONTEND_URL in production).
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
extra_origins = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + extra_origins + ([frontend_url] if frontend_url else []),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Create tables, add columns introduced by newer versions, load demo data.
Base.metadata.create_all(bind=engine)
add_missing_columns()
with SessionLocal() as session:
    seed_demo_data(session)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(expenses_router)
app.include_router(income_router)
app.include_router(budgets_router)
app.include_router(savings_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(categories_router)
app.include_router(support_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "success",
        "message": "BudgetBuddy API is running.",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
