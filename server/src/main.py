
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database.core import Base, engine
from src.reports.controller import router as reports_router
from src.dashboard.transaction_model import Transaction
from src.settings.settings_model import UserSettings
from src.dashboard.transaction_routes import router as dashboard_router
from src.settings.settings_routes import router as settings_router
from src.income.controller import router as income_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(settings_router)
app.include_router(income_router)


@app.get("/")
def root():
    return {"message": "FastAPI is working!"}
