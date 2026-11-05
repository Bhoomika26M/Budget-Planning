import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Local development uses SQLite (file is created inside the server folder).
# Production can point DATABASE_URL at PostgreSQL, e.g.
#   postgresql+psycopg2://user:password@host:5432/budgetbuddy
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./budgetbuddy.db")

# Render/Heroku style URLs start with postgres:// which SQLAlchemy 2 rejects.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
    pool_pre_ping=not IS_SQLITE,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def add_missing_columns(bind=None):
    """Very small "migration" helper.

    Base.metadata.create_all() creates new tables but never alters existing
    ones. When a model gains a new column (for example after pulling the
    latest code onto an old budgetbuddy.db) this adds the column so the app
    keeps working without deleting the database.
    """
    bind = bind or engine
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    with bind.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue

            existing_columns = {
                column["name"] for column in inspector.get_columns(table.name)
            }

            for column in table.columns:
                if column.name in existing_columns:
                    continue

                column_type = column.type.compile(dialect=bind.dialect)
                default_sql = ""
                default = column.default.arg if column.default is not None else None

                if isinstance(default, bool):
                    default_sql = f" DEFAULT {'1' if default else '0'}" if IS_SQLITE else f" DEFAULT {str(default).upper()}"
                elif isinstance(default, (int, float)):
                    default_sql = f" DEFAULT {default}"
                elif isinstance(default, str):
                    safe = default.replace("'", "''")
                    default_sql = f" DEFAULT '{safe}'"

                connection.execute(
                    text(
                        f'ALTER TABLE "{table.name}" '
                        f'ADD COLUMN "{column.name}" {column_type}{default_sql}'
                    )
                )
