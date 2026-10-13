from fastapi.testclient import TestClient

from src.main import app


def test_root_endpoint_is_available():
    response = TestClient(app).get('/')

    assert response.status_code == 200