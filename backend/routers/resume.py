"""
Resume upload router – POST /api/resume/upload

Flow:
  1. Authenticate via Bearer token (get_current_user dependency)
  2. Validate file extension, MIME type, and size
  3. Read bytes into memory (max 5 MB)
  4. Extract plain text via the extractor service
  5. Sanitize extracted text (strip control chars, cap length)
  6. Persist to MongoDB `resumes` collection (upsert per user)
  7. Return sanitized text + metadata to the client

Phase 2 design note:
  The sanitized resume_text is returned directly in the response so the
  LangGraph pipeline can use it as immediate node input without a DB look-up.
  A copy is also upserted to MongoDB for audit, history, and re-use.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import get_current_user
from app.database import get_database
from app.models import ResumeUploadResponse, TokenPayload
from app.sanitize import sanitize_text
from services.extractor import MAX_FILE_BYTES, extract_text, validate_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload a resume (PDF or DOCX) and extract its text",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF or DOCX resume file (max 5 MB)"),
    current_user: TokenPayload = Depends(get_current_user),
) -> ResumeUploadResponse:
    # ── 1. Read bytes ──────────────────────────────────────────────────────────
    data = await file.read()
    size = len(data)

    # ── 2. Validate before parsing ────────────────────────────────────────────
    validate_upload(
        filename=file.filename or "unknown",
        content_type=file.content_type or "",
        size=size,
    )

    # ── 3. Extract text ───────────────────────────────────────────────────────
    raw_text = extract_text(
        filename=file.filename or "unknown",
        content_type=file.content_type or "",
        data=data,
    )

    # ── 4. Sanitize ───────────────────────────────────────────────────────────
    clean_text = sanitize_text(raw_text)

    # ── 5. Persist (upsert per user) ──────────────────────────────────────────
    db = get_database()
    await db["resumes"].update_one(
        {"user_email": current_user.sub},
        {
            "$set": {
                "user_email": current_user.sub,
                "filename": file.filename,
                "content_type": file.content_type,
                "resume_text": clean_text,
                "char_count": len(clean_text),
            }
        },
        upsert=True,
    )
    logger.info(
        "Resume stored for user=%s filename=%s chars=%d",
        current_user.sub,
        file.filename,
        len(clean_text),
    )

    return ResumeUploadResponse(
        message="Resume uploaded and text extracted successfully.",
        filename=file.filename or "unknown",
        char_count=len(clean_text),
        resume_text=clean_text,
    )


@router.get(
    "/latest",
    summary="Retrieve the most recently uploaded resume text for the current user",
)
async def get_latest_resume(
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    db = get_database()
    doc = await db["resumes"].find_one({"user_email": current_user.sub})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload one first.",
        )
    return {
        "filename": doc["filename"],
        "char_count": doc["char_count"],
        "resume_text": doc["resume_text"],
    }
