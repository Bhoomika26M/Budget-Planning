
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BudgetBuddy Dashboard API")

# Allow your React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "BudgetBuddy backend is running!"
    }


@app.get("/api/dashboard/student")
def student_dashboard():
    return {
        "role": "Student",
        "total_budget": 65000,
        "total_spend": 38760,
        "remaining_budget": 26240,
    }


@app.get("/api/dashboard/admin")
def admin_dashboard():
    return {
        "role": "Admin",
        "total_users": 1000,
        "student_accounts": 95,
        "premium_accounts": 905,
    }


@app.get("/api/dashboard/premium")
def premium_dashboard():
    return {
        "role": "Premium User",
        "total_budget": 100000,
        "total_spend": 45000,
        "remaining_budget": 55000,
    }
