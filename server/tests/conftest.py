import pytest


@pytest.fixture
def sample_user():
    return {'email': 'student@example.com', 'name': 'Student'}