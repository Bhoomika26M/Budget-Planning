from src.database.core import DATABASE_URL, engine


def test_local_database_defaults_to_sqlite():
    assert DATABASE_URL.startswith('sqlite')
    assert engine.url.get_backend_name() == 'sqlite'