"""
Interview router – /api/v1/interview

Endpoints:
  POST /start   – Initialise a new interview session (returns thread_id via SSE).
  POST /respond – Resume graph with candidate answer; streams AI question as SSE.
  GET  /state   – Inspect current graph state for a thread.
  GET  /report  – Return the final feedback report once interview is complete.

HITL flow:
  1. /start   → graph runs to first interrupt_before="human_input_node",
                returning the AI's first question via SSE.
  2. /respond → graph is resumed with the candidate's answer as a HumanMessage,
                runs until the next interrupt or END, streams next AI question.
  3. After MAX_QUESTIONS answers, graph exits to feedback_node, /report returns results.

Rate limiting: both /start and /respond are decorated with RATE_LIMIT_INTERVIEW
  (default 30/minute) — the most expensive routes (LLM call per request).

SSE uses FastAPI's native EventSourceResponse (FastAPI 0.135+ stable API).
"""

from __future__ import annotations

import json
import logging
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.sse import EventSourceResponse, format_sse_event
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.types import Command
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.config import settings
from app.limiter import limiter
from app.models import TokenPayload
from app.sanitize import sanitize_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])


# ── Request / Response models ─────────────────────────────────────────────────

class StartRequest(BaseModel):
    resume_text: str = Field(min_length=50, max_length=12_000)
    jd_text: str = Field(min_length=50, max_length=12_000)


class StartResponse(BaseModel):
    thread_id: str
    message: str


class RespondRequest(BaseModel):
    thread_id: str
    answer: str = Field(
        min_length=1,
        max_length=4_000,
        description="Candidate's answer to the current interview question.",
    )


# ── Helper: stream AI tokens from graph ──────────────────────────────────────

async def _stream_ai_question(
    thread_id: str,
    config: dict,
    input_payload,
) -> AsyncGenerator[bytes, None]:
    """
    Async generator that streams tokens from the graph as SSE events.

    Event types:
      token     – individual AI token chunk
      interrupt – graph paused at human_input_node (awaiting answer)
      done      – interview complete, contains feedback_report
      error     – clean error surface (LLM retry exhausted, graph crash, etc.)
    """
    import graph.interview_graph as _ig

    try:
        async for event in _ig.interview_graph.astream(
            input_payload,
            config=config,
            stream_mode="messages",   # yields (message_chunk, metadata) tuples
        ):
            # stream_mode="messages" yields (chunk, metadata) pairs
            if isinstance(event, tuple):
                chunk, metadata = event
                # Only stream AI message content tokens from the question node
                if (
                    isinstance(chunk, AIMessage)
                    and chunk.content
                    and metadata.get("langgraph_node") == "ask_question_node"
                ):
                    yield format_sse_event(
                        data_str=json.dumps(chunk.content),
                        event="token",
                    )

        # After streaming completes, check final graph state (async)
        snapshot = await _ig.interview_graph.aget_state(config)
        next_nodes = snapshot.next

        if not next_nodes:
            # Graph reached END → interview complete
            feedback = snapshot.values.get("feedback_report", {})
            yield format_sse_event(
                data_str=json.dumps({"feedback_report": feedback}),
                event="done",
            )
        elif "human_input_node" in next_nodes:
            # Graph paused at interrupt() inside human_input_node
            questions_asked = snapshot.values.get("questions_asked", 0)
            yield format_sse_event(
                data_str=json.dumps({
                    "thread_id": thread_id,
                    "questions_asked": questions_asked,
                    "max_questions": _ig.MAX_QUESTIONS,
                    "status": "awaiting_answer",
                }),
                event="interrupt",
            )

    except Exception as exc:
        logger.error("SSE stream error for thread=%s: %s", thread_id, exc)
        # Surface a clean error event instead of letting the connection hang
        yield format_sse_event(
            data_str=json.dumps({
                "error": str(exc),
                "thread_id": thread_id,
            }),
            event="error",
        )


# ── POST /start ───────────────────────────────────────────────────────────────

@router.post(
    "/start",
    summary="Start a new mock interview session",
)
@limiter.limit(settings.RATE_LIMIT_INTERVIEW)
async def start_interview(
    request: Request,
    body: StartRequest,
    current_user: TokenPayload = Depends(get_current_user),
) -> EventSourceResponse:
    """
    Initialises the interview graph with sanitized resume + JD.
    Streams the first AI question as SSE tokens.
    Returns a thread_id in the interrupt event for use in /respond.
    """
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    # Double-sanitize at the API boundary (defence in depth)
    clean_resume = sanitize_text(body.resume_text)
    clean_jd = sanitize_text(body.jd_text)

    # Extract candidate name from JWT payload
    candidate_name = current_user.name or current_user.sub.split("@")[0] or "Candidate"

    initial_state = {
        "resume_text": clean_resume,
        "jd_text": clean_jd,
        "candidate_name": candidate_name,
        "parsed_resume": {},
        "parsed_jd": {},
        "gap_report": {},
        "chat_history": [],
        "questions_asked": 0,
        "feedback_report": {},
    }

    logger.info("START interview thread_id=%s user=%s", thread_id, current_user.sub)

    async def event_generator() -> AsyncGenerator[bytes, None]:
        # First, emit the thread_id so the client can store it
        yield format_sse_event(
            data_str=json.dumps({"thread_id": thread_id}),
            event="session",
        )
        async for event in _stream_ai_question(thread_id, config, initial_state):
            yield event

    return EventSourceResponse(event_generator())


# ── POST /respond ─────────────────────────────────────────────────────────────

@router.post(
    "/respond",
    summary="Submit candidate answer and receive the next question via SSE",
)
@limiter.limit(settings.RATE_LIMIT_INTERVIEW)
async def respond_to_interview(
    request: Request,
    body: RespondRequest,
    current_user: TokenPayload = Depends(get_current_user),
) -> EventSourceResponse:
    """
    Resume an interrupted graph with the candidate's answer.

    Flow:
      1. Sanitize the answer (prompt-injection defence).
      2. Inject it as a HumanMessage via Command(resume=...).
      3. Resume the graph — it passes through human_input_node,
         hits evaluation_router, then either asks another Q or generates feedback.
      4. Stream the next AI question or the final done event.
    """
    import graph.interview_graph as _ig

    config = {"configurable": {"thread_id": body.thread_id}}

    # Verify the session exists (async)
    try:
        snapshot = await _ig.interview_graph.aget_state(config)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{body.thread_id}' not found.",
        )

    if not snapshot.next:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This interview session has already ended. Retrieve /report for results.",
        )

    # Sanitize the answer before injecting into the graph
    clean_answer = sanitize_text(body.answer, max_length=4_000)

    # Prompt-injection defence: label the answer as candidate data
    human_msg = HumanMessage(
        content=f"[CANDIDATE ANSWER]\n{clean_answer}",
    )

    # Command(resume=...) is the correct LangGraph 1.x API to resume from interrupt
    resume_command = Command(
        resume={"chat_history": [human_msg]},
    )

    logger.info("RESUME interview thread_id=%s user=%s Q#%d",
                body.thread_id, current_user.sub,
                snapshot.values.get("questions_asked", 0))

    async def event_generator() -> AsyncGenerator[bytes, None]:
        async for event in _stream_ai_question(body.thread_id, config, resume_command):
            yield event

    return EventSourceResponse(event_generator())


# ── GET /state ────────────────────────────────────────────────────────────────

@router.get(
    "/state",
    summary="Inspect current graph state for a session (debug)",
)
async def get_interview_state(
    thread_id: str,
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    import graph.interview_graph as _ig

    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = await _ig.interview_graph.aget_state(config)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{thread_id}' not found.",
        )

    return {
        "thread_id": thread_id,
        "next_nodes": list(snapshot.next),
        "questions_asked": snapshot.values.get("questions_asked", 0),
        "gap_report": snapshot.values.get("gap_report", {}),
        "chat_history_length": len(snapshot.values.get("chat_history", [])),
        "is_complete": not snapshot.next,
    }


# ── GET /report ───────────────────────────────────────────────────────────────

@router.get(
    "/report",
    summary="Get the final feedback report after interview completes",
)
async def get_feedback_report(
    thread_id: str,
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    import graph.interview_graph as _ig

    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = await _ig.interview_graph.aget_state(config)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{thread_id}' not found.",
        )

    if snapshot.next:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail=(
                f"Interview still in progress. "
                f"{snapshot.values.get('questions_asked', 0)}/{_ig.MAX_QUESTIONS} questions answered."
            ),
        )

    feedback = snapshot.values.get("feedback_report", {})
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback report not yet generated.",
        )

    return {
        "thread_id": thread_id,
        "feedback_report": feedback,
        "gap_report": snapshot.values.get("gap_report", {}),
        "parsed_resume": snapshot.values.get("parsed_resume", {}),
        "parsed_jd": snapshot.values.get("parsed_jd", {}),
    }
