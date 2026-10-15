from fastapi import APIRouter

from src.budgets.controller import (
    router as budget_router,
)


api_router = APIRouter(
    prefix='/api'
)

api_router.include_router(
    budget_router
)