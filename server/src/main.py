from fastapi import FastAPI

# Initialize the FastAPI application
app = FastAPI(title="Test Backend API")


# Define a health-check / root endpoint
@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "FastAPI backend is working perfectly!",
    }


# Define a simple dynamic endpoint
@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello, {name}! Your API connection is functional."}