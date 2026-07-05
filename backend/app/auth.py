"""
Authentication utilities:
  - password hashing / verification (bcrypt directly – passlib is unmaintained
    and incompatible with bcrypt 4.x)
  - JWT creation & decoding (PyJWT – replaces unmaintained python-jose)
  - get_current_user FastAPI dependency
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import hashlib
import hmac

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.models import TokenPayload

# ── Password helpers ──────────────────────────────────────────────────────────
# bcrypt silently truncates at 72 bytes; we SHA-256 pre-hash so long passwords
# are handled safely without any information loss.

_ENCODING = "utf-8"


def _prehash(plain: str) -> bytes:
    """SHA-256 digest encoded as hex → always 64 ASCII bytes (< bcrypt 72-byte limit)."""
    return hashlib.sha256(plain.encode(_ENCODING)).hexdigest().encode(_ENCODING)


def hash_password(plain: str) -> str:
    hashed = bcrypt.hashpw(_prehash(plain), bcrypt.gensalt())
    return hashed.decode(_ENCODING)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_prehash(plain), hashed.encode(_ENCODING))


# ── JWT helpers ───────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=True)


def _make_token(subject: str, token_type: str, expire_delta: timedelta, extra: dict | None = None) -> str:
    """Create a signed JWT with PyJWT (HS256)."""
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expire_delta,
        **(extra or {}),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, name: str = "") -> str:
    return _make_token(
        subject,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra={"name": name},
    )


def create_refresh_token(subject: str) -> str:
    return _make_token(
        subject,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT.
    Raises HTTP 401 on any failure (expired, bad sig, malformed).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        raw = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return TokenPayload(**raw)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credentials_exception


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> TokenPayload:
    """
    Dependency that protects routes by validating the Bearer token.
    Returns the decoded payload (contains `sub` = user email).

    Usage:
        @router.get("/me")
        async def me(user: TokenPayload = Depends(get_current_user)):
            ...
    """
    payload = decode_token(credentials.credentials)
    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload
