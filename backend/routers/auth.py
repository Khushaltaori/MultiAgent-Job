"""
Auth router – /api/v1/auth
Endpoints: POST /register, POST /login

Rate limiting: applied per IP via slowapi.
Refresh token: stored in a secure, HTTP-only, SameSite=Lax cookie.
Access token:  returned in the JSON body.
"""

from __future__ import annotations

from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

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
        name=body.name,
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

    return UserPublic(email=doc.email, name=doc.name, created_at=doc.created_at)


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

    stored_name: str = raw.get("name", "")
    access_token = create_access_token(body.email, name=stored_name)
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


# ── OAuth2 Configuration & Routes ─────────────────────────────────────────────

from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import secrets

oauth = OAuth()

if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
    oauth.register(
        name="github",
        client_id=settings.GITHUB_CLIENT_ID,
        client_secret=settings.GITHUB_CLIENT_SECRET,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        userinfo_url="https://api.github.com/user",
        client_kwargs={"scope": "user:email"},
    )


@router.get("/google/login", summary="Initiate Google OAuth2 flow")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or settings.GOOGLE_CLIENT_ID == "your-google-client-id":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured on this server.",
        )
    redirect_uri = "http://localhost:8000/api/v1/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", summary="Google OAuth2 callback")
async def google_callback(request: Request, response: Response):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or settings.GOOGLE_CLIENT_ID == "your-google-client-id":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured on this server.",
        )
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authorization failed: {exc}",
        )
    
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve Google user info.",
        )
    
    email = user_info.get("email")
    name = user_info.get("name", "") or user_info.get("given_name", "") or "Google User"
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google profile did not contain an email.",
        )

    logger.warning("GOOGLE CALLBACK SUCCESS: email=%s, name=%s", email, name)

    db = get_database()
    user = await db["users"].find_one({"email": email})
    if not user:
        from app.models import UserInDB
        from app.auth import hash_password
        random_pwd = secrets.token_hex(16)
        user_doc = UserInDB(
            email=email,
            name=name,
            hashed_password=hash_password(random_pwd),
        )
        await db["users"].insert_one(user_doc.model_dump(exclude={"id"}))
        stored_name = name
    else:
        stored_name = user.get("name", "") or name

    access_token = create_access_token(email, name=stored_name)
    refresh_token = create_refresh_token(email)

    frontend_redirect_url = f"http://localhost:5173/?token={access_token}"
    redirect_resp = RedirectResponse(url=frontend_redirect_url)

    redirect_resp.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=int(timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
        path="/api/v1/auth",
    )
    return redirect_resp


@router.get("/github/login", summary="Initiate GitHub OAuth2 flow")
async def github_login(request: Request):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET or settings.GITHUB_CLIENT_ID == "your-github-client-id":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth is not configured on this server.",
        )
    redirect_uri = "http://localhost:8000/api/v1/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback", summary="GitHub OAuth2 callback")
async def github_callback(request: Request, response: Response):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET or settings.GITHUB_CLIENT_ID == "your-github-client-id":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth is not configured on this server.",
        )
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub authorization failed: {exc}",
        )

    access_token_str = token.get("access_token")
    if not access_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve GitHub access token.",
        )

    import httpx
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"token {access_token_str}", "Accept": "application/vnd.github.v3+json"}
        user_res = await client.get("https://api.github.com/user", headers=headers)
        if user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve GitHub user profile.",
            )
        user_info = user_res.json()
        
        email = user_info.get("email")
        if not email:
            emails_res = await client.get("https://api.github.com/user/emails", headers=headers)
            if emails_res.status_code == 200:
                emails_list = emails_res.json()
                for item in emails_list:
                    if item.get("primary") and item.get("verified"):
                        email = item.get("email")
                        break
                if not email and emails_list:
                    email = emails_list[0].get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub profile did not contain a verified email.",
        )

    name = user_info.get("name") or user_info.get("login") or "GitHub User"

    logger.warning("GITHUB CALLBACK SUCCESS: email=%s, name=%s", email, name)

    db = get_database()
    user = await db["users"].find_one({"email": email})
    if not user:
        from app.models import UserInDB
        from app.auth import hash_password
        random_pwd = secrets.token_hex(16)
        user_doc = UserInDB(
            email=email,
            name=name,
            hashed_password=hash_password(random_pwd),
        )
        await db["users"].insert_one(user_doc.model_dump(exclude={"id"}))
        stored_name = name
    else:
        stored_name = user.get("name", "") or name

    access_token = create_access_token(email, name=stored_name)
    refresh_token = create_refresh_token(email)

    frontend_redirect_url = f"http://localhost:5173/?token={access_token}"
    redirect_resp = RedirectResponse(url=frontend_redirect_url)

    redirect_resp.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=int(timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
        path="/api/v1/auth",
    )
    return redirect_resp
