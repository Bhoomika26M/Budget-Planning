"""
Database Engine and Session Management Module.

Configures SQLAlchemy engine and session factory to support both
PostgreSQL and SQLite seamlessly. Also provides the FastAPI dependency
`get_db` to inject database sessions into route handlers.
"""

from typing import Generator, Any
from app.core.config import settings

db_url = settings.get_sqlalchemy_database_url()

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, declarative_base

    # SQLAlchemy connection arguments
    connect_args = {}
    if db_url.startswith("sqlite"):
        # SQLite requires check_same_thread=False for multi-threaded FastAPI requests
        connect_args["check_same_thread"] = False
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        # PostgreSQL settings with connection recycling and pre-ping health check
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )

    # Session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Declarative base class for all ORM models
    Base = declarative_base()

    _HAS_SQLALCHEMY = True
except Exception:
    engine = None
    SessionLocal = None
    class _MockBase:
        metadata = None
    Base = _MockBase
    _HAS_SQLALCHEMY = False


def get_db() -> Generator:
    """
    FastAPI dependency yielding a SQLAlchemy session.
    Automatically closes the session when the HTTP request finishes.
    """
    if not _HAS_SQLALCHEMY or SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Helper function to initialize all database tables.
    Useful for local testing and standalone startup.
    """
    if not _HAS_SQLALCHEMY or engine is None:
        return

    # Import all models so metadata knows about them
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

