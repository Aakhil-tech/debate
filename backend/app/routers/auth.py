
from fastapi import APIRouter, HTTPException, Depends

from app.db import repo
from app.db.errors import AuthError
from app.auth import create_access_token, get_current_user
from app.models.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserProfile,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, summary="Register new user")
async def register(body: RegisterRequest):
    existing = await repo().get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        user = await repo().register_user(body.email, body.password, body.handle)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token(user["id"], body.email)
    return TokenResponse(access_token=token, user=UserProfile(**user))


@router.post("/login", response_model=TokenResponse, summary="Login")
async def login(body: LoginRequest):
    try:
        user = await repo().authenticate_user(body.email, body.password)
    except AuthError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user["id"], body.email)
    return TokenResponse(access_token=token, user=UserProfile(**user))


@router.get("/me", response_model=UserProfile, summary="Get current user profile")
async def me(current_user: dict = Depends(get_current_user)):
    return UserProfile(**current_user)


@router.post("/logout", summary="Logout (client-side token drop)")
async def logout():
    return {"message": "Logged out. Discard your token."}
