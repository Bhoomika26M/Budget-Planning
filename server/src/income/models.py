
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class IncomeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    date: date
    description: Optional[str] = Field(default=None, max_length=255)


class IncomeUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    date: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=255)


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    amount: float
    date: date
    description: Optional[str]

    model_config = ConfigDict(from_attributes=True)
