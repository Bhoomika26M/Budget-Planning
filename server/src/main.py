from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database.core import Base, engine
from src.reports.controller import router as reports_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


app.include_router(reports_router)


@app.get("/")
def root():
    return {"message": "FastAPI is working!"}