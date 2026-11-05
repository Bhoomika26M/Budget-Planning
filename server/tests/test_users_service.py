from src.admin.service import update_user
from src.entities.user import User


class FakeSession:
    def commit(self):
        pass

    def refresh(self, _obj):
        pass


def test_plan_change_updates_role():
    user = User(role="student", plan="free")
    update_user(FakeSession(), user, {"plan": "premium"})
    assert user.role == "premium"
    assert user.plan_since is not None


def test_role_change_sets_matching_plan():
    user = User(role="premium", plan="premium")
    update_user(FakeSession(), user, {"role": "student"})
    assert user.plan == "free"
    assert user.plan_renewal is None


def test_admin_keeps_role_when_plan_changes():
    user = User(role="admin", plan="enterprise")
    update_user(FakeSession(), user, {"plan": "free"})
    assert user.role == "admin"
