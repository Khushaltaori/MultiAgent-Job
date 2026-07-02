"""
Pydantic models for User and Token domains.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Persisted user document ───────────────────────────────────────────────────

class UserInDB(BaseModel):
    """Represents the document stored in MongoDB."""

    id: str | None = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    model_config = {"populate_by_name": True}


# ── Registration / login request bodies ──────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Public user representation (no hashed_password) ──────────────────────────

class UserPublic(BaseModel):
    email: EmailStr
    created_at: datetime


# ── Token models ──────────────────────────────────────────────────────────────

class Token(BaseModel):
    """JSON response returned on a successful login."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload."""

    sub: str  # user email or id
    exp: int
    type: str  # "access" | "refresh"


# ── Resume document ───────────────────────────────────────────────────────────

class ResumeDocument(BaseModel):
    """MongoDB document storing extracted resume text for a user."""

    user_email: str
    filename: str
    content_type: str
    resume_text: str                          # sanitized extracted text
    char_count: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class ResumeUploadResponse(BaseModel):
    """Response returned after a successful resume upload."""

    message: str
    filename: str
    char_count: int
    resume_text: str                          # Phase 2 design note: returned to
    # the client so the LangGraph pipeline can pass it directly as a node input,
    # avoiding a second round-trip to MongoDB. The document is ALSO persisted in
    # MongoDB under the user's email for audit / re-use.


# ── Job description ───────────────────────────────────────────────────────────

class JobDescriptionRequest(BaseModel):
    """Request body for pasted job description text."""

    text: str = Field(
        min_length=50,
        max_length=20_000,
        description="Full job description text (50–20 000 characters).",
    )


class JobDescriptionResponse(BaseModel):
    """Response after a JD is accepted."""

    message: str
    char_count: int
    jd_text: str                              # sanitized text returned to client
