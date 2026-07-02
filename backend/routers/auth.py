"""
Auth router – /api/v1/auth
Endpoints: POST /register, POST /login

Rate limiting: applied per IP via slowapi.
Refresh token: stored in a secure, HTTP-only, SameSite=Lax cookie.
Access token:  returned in the JSON body.
"""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from pymongo.errors import DuplicateKeyError

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import settings
from app.database import get_database
from app.limiter import limiter
from app.models import Token, UserInDB, UserPublic, UserRegisterRequest, UserLoginRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_REFRESH_COOKIE = "refresh_token"


# ── /register ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register(
    request: Request,  # required by slowapi
    body: UserRegisterRequest,
) -> UserPublic:
    db = get_database()
    doc = UserInDB(
        email=body.email,
        hashed_password=hash_password(body.password),
    )

    try:
        await db["users"].insert_one(
            doc.model_dump(exclude={"id"})
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    return UserPublic(email=doc.email, created_at=doc.created_at)


# ── /login ────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate and receive tokens",
)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,  # required by slowapi
    response: Response,
    body: UserLoginRequest,
) -> Token:
    db = get_database()
    raw = await db["users"].find_one({"email": body.email})

    if raw is None or not verify_password(body.password, raw["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    access_token = create_access_token(body.email)
    refresh_token = create_refresh_token(body.email)

    # Set the refresh token as a secure, HTTP-only cookie
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",  # True in production
        samesite="lax",
        max_age=int(timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
        path="/api/v1/auth",  # scope cookie to auth routes only
    )

    return Token(access_token=access_token)


# ── /refresh ──────────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=Token,
    summary="Issue a new access token using the refresh cookie",
)
async def refresh_access_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=_REFRESH_COOKIE),
) -> Token:
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided.",
        )

    payload = decode_token(refresh_token)
    if payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    new_access = create_access_token(payload.sub)
    return Token(access_token=new_access)


# ── /logout ───────────────────────────────────────────────────────────────────

@router.post("/logout", summary="Clear the refresh token cookie")
async def logout(response: Response) -> dict:
    response.delete_cookie(key=_REFRESH_COOKIE, path="/api/v1/auth")
    return {"detail": "Logged out successfully."}
