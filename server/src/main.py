
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from src.auth.routes import bootstrap_initial_admin, router as auth_router
from src.database.core import Base, SessionLocal, engine
from src.dashboard.transaction_model import Transaction
from src.entities.user import User
from src.settings.settings_model import UserSettings
from src.expenses.expense_model import Expense
from src.savings_goals.savings_goal_model import SavingsGoal
from src.budgets.budget_model import Budget

from src.dashboard.transaction_routes import router as dashboard_router
from src.settings.settings_routes import router as settings_router
from src.expenses.expense_routes import router as expense_router
from src.income.controller import router as income_router
from src.analytics.controller import router as analytics_router
from src.savings_goals.savings_goal_routes import router as savings_goals_router
from src.budgets.budget_routes import router as budgets_router

# Create tables for models that have been imported
Base.metadata.create_all(bind=engine)

user_columns = {column['name'] for column in inspect(engine).get_columns('users')}
with engine.begin() as connection:
    if 'password_hash' not in user_columns:
        connection.execute(text('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)'))
    if 'role' not in user_columns:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student'")
        )
    if 'created_at' not in user_columns:
        if engine.dialect.name == 'sqlite':
            connection.execute(
                text('ALTER TABLE users ADD COLUMN created_at TIMESTAMP')
            )
            connection.execute(
                text('UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL')
            )
        else:
            connection.execute(
                text(
                    'ALTER TABLE users ADD COLUMN created_at '
                    'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
                )
            )
    for column_name, column_type in (
        ('phone', 'VARCHAR(40)'),
        ('location', 'VARCHAR(160)'),
        ('university', 'VARCHAR(160)'),
        ('major', 'VARCHAR(160)'),
    ):
        if column_name not in user_columns:
            connection.execute(
                text(f'ALTER TABLE users ADD COLUMN {column_name} {column_type}')
            )
    if engine.dialect.name == 'sqlite':
        connection.execute(
            text(
                'UPDATE users SET created_at = CURRENT_TIMESTAMP '
                'WHERE created_at IS NULL'
            )
        )
        connection.execute(
            text(
                'CREATE TRIGGER IF NOT EXISTS users_created_at_default '
                'AFTER INSERT ON users WHEN NEW.created_at IS NULL '
                'BEGIN UPDATE users SET created_at = CURRENT_TIMESTAMP '
                'WHERE id = NEW.id; END'
            )
        )

for table_name, index_name in (
    ('transactions', 'ix_transactions_user_id'),
    ('user_settings', 'uq_user_settings_user_id'),
):
    table_columns = {column['name'] for column in inspect(engine).get_columns(table_name)}
    if 'user_id' not in table_columns:
        with engine.begin() as connection:
            connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN user_id INTEGER'))
    index = next(
        index
        for index in Base.metadata.tables[table_name].indexes
        if index.name == index_name
    )
    index.create(bind=engine, checkfirst=True)

expense_columns = {column['name'] for column in inspect(engine).get_columns('expenses')}
with engine.begin() as connection:
    if 'user_id' not in expense_columns:
        connection.execute(
            text('ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id)')
        )
    if 'transaction_id' not in expense_columns:
        connection.execute(
            text(
                'ALTER TABLE expenses ADD COLUMN transaction_id '
                'INTEGER REFERENCES transactions(id)'
            )
        )

for index in Base.metadata.tables['expenses'].indexes:
    index.create(bind=engine, checkfirst=True)

with SessionLocal() as db:
    bootstrap_initial_admin(db)

app = FastAPI()

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
configured_origins = os.getenv("CORS_ALLOWED_ORIGINS")
allowed_origins = (
    [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    if configured_origins
    else default_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(settings_router)
app.include_router(expense_router)
app.include_router(income_router)
app.include_router(budget_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(savings_goals_router)
app.include_router(budgets_router)


@app.get("/")
def root():
    return {"message": "FastAPI is working!"}
