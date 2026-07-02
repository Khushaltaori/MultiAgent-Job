"""
Intake analysis router – POST /api/analysis/intake

Accepts sanitized resume_text and jd_text,
runs them through the LangGraph pipeline, and returns
the structured gap report.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.models import TokenPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class IntakeRequest(BaseModel):
    resume_text: str = Field(min_length=50, max_length=12_000)
    jd_text: str = Field(min_length=50, max_length=12_000)


class IntakeResponse(BaseModel):
    parsed_resume: dict
    parsed_jd: dict
    gap_report: dict


@router.post(
    "/intake",
    response_model=IntakeResponse,
    summary="Run intake & gap analysis on resume + job description",
)
async def run_intake(
    body: IntakeRequest,
    current_user: TokenPayload = Depends(get_current_user),
) -> IntakeResponse:
    """
    Invoke the LangGraph pipeline:
      1. parse_resume_node  ─┐
                              ├─► gap_analysis_node
      2. parse_jd_node      ─┘

    Both parse nodes run in parallel; gap analysis runs after both complete.
    """
    # Import here to defer LLM instantiation until first request
    # (avoids failing at startup if GEMINI_API_KEY not yet set in dev)
    from graph.intake_graph import intake_graph

    try:
        result = await intake_graph.ainvoke(
            {
                "resume_text": body.resume_text,
                "jd_text": body.jd_text,
                "parsed_resume": {},
                "parsed_jd": {},
                "gap_report": {},
            }
        )
    except Exception as exc:
        logger.error("Intake graph failed for user=%s: %s", current_user.sub, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI pipeline error: {exc}",
        ) from exc

    return IntakeResponse(
        parsed_resume=result["parsed_resume"],
        parsed_jd=result["parsed_jd"],
        gap_report=result["gap_report"],
    )
