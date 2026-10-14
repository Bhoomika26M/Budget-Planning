from src.database.core import Base, engine

from .transaction_model import Transaction


def create_dashboard_tables():
    Base.metadata.create_all(bind=engine)