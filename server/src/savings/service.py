
from sqlalchemy.orm import Session

from src.savings.entity import SavingsGoal, SavingsContribution


def create_goal(db: Session, user_id: int, data):
    values = data.model_dump()
    values["name"] = values["name"].strip()
    values["note"] = values["note"].strip() or None if values["note"] else None

    goal = SavingsGoal(user_id=user_id, **values)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def list_goals(db: Session, user_id: int):
    return (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id)
        .order_by(SavingsGoal.id.desc())
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
        elif field == "note" and value is not None:
            value = value.strip() or None

        setattr(goal, field, value)

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


def add_contribution(db: Session, goal, user_id: int, data):
    contribution = SavingsContribution(
        user_id=user_id,
        goal_id=goal.id,
        amount=data.amount,
        date=data.date,
        note=data.note.strip() or None if data.note else None,
    )

    try:
        goal.saved += data.amount
        db.add(contribution)
        db.commit()
        db.refresh(contribution)
        db.refresh(goal)
        return contribution
    except Exception:
        db.rollback()
        raise


def list_contributions(db: Session, goal_id: int, user_id: int):
    return (
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
