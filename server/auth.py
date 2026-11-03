from fastapi import APIRouter, HTTPException
from models import UserRegister, UserLogin
from database import users

router = APIRouter()

@router.post("/register")
def register(user: UserRegister):

    for u in users:
        if u["email"] == user.email:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

    users.append(user.dict())

    return {
        "message": "User Registered Successfully"
    }


@router.post("/login")
def login(user: UserLogin):

    for u in users:
        if (
            u["email"] == user.email
            and
            u["password"] == user.password
        ):
            return {
                "message": "Login Successful"
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid Credentials"
    )