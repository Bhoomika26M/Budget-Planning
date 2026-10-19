from sqlalchemy.orm import Session


def get_monthly_summary(db: Session):
    return {
        "monthly_data": []
    }