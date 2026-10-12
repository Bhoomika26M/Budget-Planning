from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.income.controller import router as income_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(income_router)


@app.get("/")
def root():
    return {"message": "FastAPI is working!"}