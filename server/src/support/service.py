from sqlalchemy.orm import Session

from src.support.entity import Feedback, Issue


def create_feedback(db: Session, user, data):
    item = Feedback(
        user_id=user.id, user_name=user.name, user_email=user.email,
        type=data.type, message=data.message.strip(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def create_issue(db: Session, user, data):
    item = Issue(
        user_id=user.id, user_name=user.name, user_email=user.email,
        issue=data.issue.strip(), severity=data.severity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_feedback(db: Session):
    return db.query(Feedback).order_by(Feedback.created_at.desc(), Feedback.id.desc()).all()


def list_issues(db: Session):
    return db.query(Issue).order_by(Issue.created_at.desc(), Issue.id.desc()).all()
