import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./budgetbuddy.db')


class Base(DeclarativeBase):
	pass


engine = create_engine(
	DATABASE_URL,
	connect_args={'check_same_thread': False}
	if DATABASE_URL.startswith('sqlite')
	else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

__all__ = ['Base', 'DATABASE_URL', 'SessionLocal', 'engine']