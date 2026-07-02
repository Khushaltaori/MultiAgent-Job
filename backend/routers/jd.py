"""
Job description router – POST /api/jd/submit

Accepts pasted plain text (no file parsing).
Sanitizes and returns the clean text to the client.
Also persists to MongoDB for Phase 2 pipeline use.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status

from app.auth import get_current_user
from app.database import get_database
from app.models import JobDescriptionRequest, JobDescriptionResponse, TokenPayload
from app.sanitize import sanitize_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jd", tags=["job-description"])


@router.post(
    "/submit",
    response_model=JobDescriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a job description (pasted text)",
)
async def submit_job_description(
    body: JobDescriptionRequest,
    current_user: TokenPayload = Depends(get_current_user),
) -> JobDescriptionResponse:
    # Sanitize – Pydantic already enforced min/max length,
    # but we still strip control chars and cap at our global limit.
    clean_text = sanitize_text(body.text)

    # Persist (upsert per user – one active JD at a time)
    db = get_database()
    await db["job_descriptions"].update_one(
        {"user_email": current_user.sub},
        {
            "$set": {
                "user_email": current_user.sub,
                "jd_text": clean_text,
                "char_count": len(clean_text),
            }
        },
        upsert=True,
    )
    logger.info(
        "JD stored for user=%s chars=%d", current_user.sub, len(clean_text)
    )

    return JobDescriptionResponse(
        message="Job description accepted.",
        char_count=len(clean_text),
        jd_text=clean_text,
    )


@router.get(
    "/latest",
    summary="Retrieve the most recently submitted job description for the current user",
)
async def get_latest_jd(
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    db = get_database()
    doc = await db["job_descriptions"].find_one({"user_email": current_user.sub})
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No job description found. Please submit one first.",
        )
    return {
        "char_count": doc["char_count"],
        "jd_text": doc["jd_text"],
    }
