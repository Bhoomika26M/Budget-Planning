"""
BudgetBuddy FastAPI Application Entry Point.

Initializes the FastAPI application, configures CORS middleware,
registers API routers, and prepares database schema tables on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import init_db
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.expenses import router as expenses_router
from app.routers.income import router as income_router
from app.routers.budgets import router as budgets_router
from app.routers.savings import router as savings_router
from app.routers.notifications import router as notifications_router
from app.routers.dashboard import router as dashboard_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Full-Stack Personal Budget Planning and Expense Management Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """
    Runs automatically on server boot:
    Ensures database tables are initialized.
    """
    init_db()


# Register Routers
app.include_router(health_router)
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(income_router, prefix="/api")
app.include_router(budgets_router, prefix="/api")
app.include_router(savings_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    """
    Welcoming root endpoint with interactive documentation links.
    """
    return {
        "message": "Welcome to the BudgetBuddy API",
        "documentation": "/docs",
        "health_check": "/api/health",
        "status": "online",
        "version": settings.PROJECT_VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
