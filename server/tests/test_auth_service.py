def test_auth_service_fixture_has_user_identity(sample_user):
    assert sample_user['email'] == 'student@example.com'