from sqlalchemy.orm import Session

from src.notifications.service import create_notification
from src.savings.entity import SavingsContribution, SavingsGoal

MILESTONES = (25, 50, 75)


def _clean(value):
    return value.strip() or None if isinstance(value, str) else value


def create_goal(db: Session, user_id: int, data):
    values = data.model_dump()
    values["name"] = values["name"].strip()
    values["note"] = _clean(values.get("note"))
    values["emoji"] = (values.get("emoji") or "🎯").strip() or "🎯"

    goal = SavingsGoal(user_id=user_id, **values)
    goal.completed = goal.saved >= goal.target
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def list_goals(db: Session, user_id: int):
    return (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id)
        .order_by(SavingsGoal.id.asc())
        .all()
    )


def find_goal(db: Session, user_id: int, goal_id: int):
    return (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == user_id,
        )
        .first()
    )


def update_goal(db: Session, goal, data):
    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        if field == "name" and value is not None:
            value = value.strip()
            if not value:
                raise ValueError("Goal name cannot be empty.")
        elif field == "note":
            value = _clean(value)
        elif field in ("target", "saved", "emoji", "color") and value is None:
            continue

        setattr(goal, field, value)

    # A goal is complete once saved >= target (also when the target is lowered).
    if "completed" not in changes:
        goal.completed = goal.saved >= goal.target

    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal):
    db.query(SavingsContribution).filter(
        SavingsContribution.goal_id == goal.id,
        SavingsContribution.user_id == goal.user_id,
    ).delete(synchronize_session=False)

    db.delete(goal)
    db.commit()


def _progress(goal) -> float:
    return (goal.saved / goal.target * 100) if goal.target else 0


def add_contribution(db: Session, goal, user_id: int, data):
    contribution = SavingsContribution(
        user_id=user_id,
        goal_id=goal.id,
        amount=data.amount,
        date=data.date,
        note=_clean(data.note),
    )

    before = _progress(goal)
    try:
        goal.saved += data.amount
        goal.completed = goal.saved >= goal.target
        db.add(contribution)
        db.commit()
        db.refresh(contribution)
        db.refresh(goal)
    except Exception:
        db.rollback()
        raise

    after = _progress(goal)

    # Goal milestone / completion notifications
    if goal.completed and before < 100:
        create_notification(
            db, user_id, "success",
            f"🎉 Goal Achieved — {goal.name}",
            f"You reached your ₹{goal.target:,.0f} target for {goal.name}. Amazing discipline!",
            color="#22c55e", key=f"goal-complete-{goal.id}",
        )
    else:
        for milestone in MILESTONES:
            if before < milestone <= after:
                create_notification(
                    db, user_id, "success",
                    "Goal Milestone!",
                    f"You've saved {milestone}% of your {goal.name}. Keep going!",
                    color="#22c55e", key=f"goal-milestone-{goal.id}-{milestone}",
                )

    return _decorate(contribution, goal)


def _decorate(contribution, goal):
    contribution.goal_name = goal.name
    contribution.goal_emoji = goal.emoji or "🎯"
    return contribution


def list_contributions(db: Session, goal_id: int, user_id: int):
    goal = find_goal(db, user_id, goal_id)
    rows = (
        db.query(SavingsContribution)
        .filter(
            SavingsContribution.goal_id == goal_id,
            SavingsContribution.user_id == user_id,
        )
        .order_by(
            SavingsContribution.date.desc(),
            SavingsContribution.id.desc(),
        )
        .all()
    )
    return [_decorate(row, goal) for row in rows]


def list_all_contributions(db: Session, user_id: int, limit: int = 200):
    rows = (
        db.query(SavingsContribution, SavingsGoal)
        .join(SavingsGoal, SavingsGoal.id == SavingsContribution.goal_id)
        .filter(SavingsContribution.user_id == user_id)
        .order_by(SavingsContribution.date.desc(), SavingsContribution.id.desc())
        .limit(limit)
        .all()
    )
    return [_decorate(contribution, goal) for contribution, goal in rows]
