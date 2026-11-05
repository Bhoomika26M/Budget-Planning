from sqlalchemy import func
from sqlalchemy.orm import Session

from src.categories.entity import DEFAULT_CATEGORIES, Category


def ensure_default_categories(db: Session):
    if db.query(Category.id).first():
        return
    db.add_all(Category(name=name) for name in DEFAULT_CATEGORIES)
    db.commit()


def list_categories(db: Session):
    return db.query(Category).order_by(Category.id.asc()).all()


def find_by_name(db: Session, name: str):
    return db.query(Category).filter(func.lower(Category.name) == name.strip().lower()).first()


def create_category(db: Session, name: str):
    category = Category(name=name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def rename_category(db: Session, category: Category, name: str):
    category.name = name.strip()
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category):
    db.delete(category)
    db.commit()
