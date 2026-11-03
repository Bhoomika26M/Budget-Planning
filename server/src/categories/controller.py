from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user
from src.categories.models import CategoryResponse
from src.categories.service import list_categories
from src.database.core import get_db

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    return list_categories(db)
