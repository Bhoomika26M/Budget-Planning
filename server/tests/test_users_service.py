from src.entities import User


def test_user_stores_profile_fields():
    user = User(email='student@example.com', name='Student')

    assert user.email == 'student@example.com'
    assert user.name == 'Student'