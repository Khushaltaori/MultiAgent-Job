"""
tests/test_hitl_checkpoint.py
==============================

Tests the interrupt → resume cycle using MemorySaver (no Redis required in CI).

Patching strategy:
  - `parse_resume_node`, `parse_jd_node`, `gap_analysis_node`, and `feedback_node`
    all call `_llm_structured.with_structured_output(Schema).invoke(messages)`.
  - `ask_question_node` calls `_invoke_llm_with_retry(_llm, messages)`.
  - We skip the parse/gap/feedback nodes entirely by providing pre-populated
    state fields in INITIAL_STATE (the graph only runs nodes whose inputs aren't
    already satisfied, but LangGraph always re-runs from START on first invoke).

Better approach: provide a fully pre-populated initial state so parse_resume_node
and parse_jd_node see non-empty parsed_resume/parsed_jd — BUT LangGraph still
runs all nodes because START fans out unconditionally.

Correct fix: patch `_llm_structured.with_structured_output` to return a mock
that calls `.invoke()` and returns the right Pydantic object, AND patch
`_invoke_llm_with_retry` for the `_llm` ask_question call.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

import graph.interview_graph as _ig
from graph.interview_graph import (
    FeedbackReport,
    GapReport,
    ParsedJD,
    ParsedResume,
)


# ── Mock Pydantic return values ───────────────────────────────────────────────

_MOCK_RESUME = ParsedResume(
    skills=["python", "fastapi", "mongodb"],
    experience_level="mid",
    years_of_experience=3,
    summary="Mid-level Python engineer",
)

_MOCK_JD = ParsedJD(
    role_title="Senior Python Engineer",
    required_skills=["fastapi", "redis", "docker", "postgresql"],
    experience_required="5+ years",
    company_name="Acme Corp",
)

_MOCK_GAP = GapReport(
    match_score=55,
    matching_skills=["python", "fastapi"],
    missing_skills=["redis", "docker", "postgresql"],
    experience_gap="underqualified",
    recommendation="Focus on cloud infra skills.",
)

_MOCK_FEEDBACK = FeedbackReport(
    overall_score=72,
    strengths=["Good Python fundamentals"],
    areas_for_improvement=["Docker", "Redis"],
    per_question_feedback=["Good", "Needs depth", "Adequate"],
    final_recommendation="Hire with reservations.",
)

_MOCK_AI_QUESTION = AIMessage(content="What is your experience with Redis?")


# ── Mock LLM factory ──────────────────────────────────────────────────────────

def _make_mock_structured_llm():
    """
    Returns a mock for _llm_structured where .with_structured_output(Schema)
    returns a runnable whose .invoke() returns the correct mock Pydantic object.
    """
    schema_to_mock = {
        ParsedResume: _MOCK_RESUME,
        ParsedJD: _MOCK_JD,
        GapReport: _MOCK_GAP,
        FeedbackReport: _MOCK_FEEDBACK,
    }

    def _with_structured_output(schema):
        mock_runnable = MagicMock()
        mock_runnable.invoke.return_value = schema_to_mock.get(schema, _MOCK_RESUME)
        return mock_runnable

    mock = MagicMock()
    mock.with_structured_output.side_effect = _with_structured_output
    mock.invoke.return_value = _MOCK_AI_QUESTION
    return mock


def _make_mock_llm():
    """Returns a mock for _llm whose .invoke() returns a fresh AIMessage each call.
    
    CRITICAL: Must return a NEW AIMessage object (with a unique ID) on every call.
    The add_messages reducer deduplicates by message ID, so reusing the same
    AIMessage object would silently drop Q2, Q3, etc. from chat_history.
    """
    call_count = {"n": 0}

    def _fresh_invoke(messages):
        call_count["n"] += 1
        return AIMessage(content=f"Interview question #{call_count['n']}: Tell me about your Redis experience.")

    mock = MagicMock()
    mock.invoke.side_effect = _fresh_invoke
    return mock


# ── Graph factory with mocked LLMs ───────────────────────────────────────────

def _make_test_graph_with_mocks():
    """
    Builds the interview graph with MemorySaver and returns
    (graph, mock_llm, mock_llm_structured) for test assertions.
    """
    mock_llm = _make_mock_llm()
    mock_structured = _make_mock_structured_llm()
    checkpointer = MemorySaver()

    with (
        patch.object(_ig, "_llm", mock_llm),
        patch.object(_ig, "_llm_structured", mock_structured),
    ):
        graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )

    return graph, mock_llm, mock_structured


# ── Test data ─────────────────────────────────────────────────────────────────

INITIAL_STATE = {
    "resume_text": "Software engineer with 3 years Python and FastAPI experience.",
    "jd_text": "Senior Python Engineer. Must have FastAPI, Redis, Docker, PostgreSQL.",
    "parsed_resume": {},
    "parsed_jd": {},
    "gap_report": {},
    "chat_history": [],
    "questions_asked": 0,
    "feedback_report": {},
}


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_interrupt_persists_state():
    """
    Starting the graph should hit the interrupt_before=human_input_node,
    checkpoint state, and return with next=['human_input_node'].
    """
    mock_llm = _make_mock_llm()
    mock_structured = _make_mock_structured_llm()
    checkpointer = MemorySaver()
    config = {"configurable": {"thread_id": "test-interrupt-001"}}

    with (
        patch.object(_ig, "_llm", mock_llm),
        patch.object(_ig, "_llm_structured", mock_structured),
    ):
        graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )
        await graph.ainvoke(INITIAL_STATE, config=config)
        snapshot = await graph.aget_state(config)

    assert "human_input_node" in snapshot.next, (
        f"Expected interrupt at human_input_node, got next={snapshot.next}"
    )
    assert snapshot.values.get("questions_asked", 0) == 1, (
        "questions_asked should be 1 after first AI question"
    )
    history = snapshot.values.get("chat_history", [])
    assert len(history) == 1, f"Expected 1 AI message in history, got {len(history)}"
    assert isinstance(history[0], AIMessage)


@pytest.mark.asyncio
async def test_resume_increments_question():
    """
    Resuming with a human answer should increment questions_asked to 2
    and produce chat_history = [AI Q1, Human A1, AI Q2].
    """
    mock_llm = _make_mock_llm()
    mock_structured = _make_mock_structured_llm()
    checkpointer = MemorySaver()
    config = {"configurable": {"thread_id": "test-resume-001"}}

    with (
        patch.object(_ig, "_llm", mock_llm),
        patch.object(_ig, "_llm_structured", mock_structured),
    ):
        graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )

        # Start → first interrupt
        await graph.ainvoke(INITIAL_STATE, config=config)

        # Resume with answer
        human_answer = HumanMessage(content="[CANDIDATE ANSWER]\nI used Redis for caching.")
        await graph.ainvoke(Command(resume={"chat_history": [human_answer]}), config=config)

        snapshot = await graph.aget_state(config)

    assert snapshot.values.get("questions_asked", 0) == 2
    history = snapshot.values.get("chat_history", [])
    assert len(history) == 3, f"Expected [AI, Human, AI], got {len(history)} messages"
    assert isinstance(history[0], AIMessage)
    assert isinstance(history[1], HumanMessage)
    assert isinstance(history[2], AIMessage)


@pytest.mark.asyncio
async def test_state_persists_across_interrupt_resume():
    """
    gap_report and parsed_jd must be identical before and after the
    interrupt/resume boundary — the critical serialization test.
    """
    mock_llm = _make_mock_llm()
    mock_structured = _make_mock_structured_llm()
    checkpointer = MemorySaver()
    config = {"configurable": {"thread_id": "test-persist-001"}}

    with (
        patch.object(_ig, "_llm", mock_llm),
        patch.object(_ig, "_llm_structured", mock_structured),
    ):
        graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )

        await graph.ainvoke(INITIAL_STATE, config=config)
        snapshot_before = await graph.aget_state(config)

        human_answer = HumanMessage(content="[CANDIDATE ANSWER]\nI used PostgreSQL.")
        await graph.ainvoke(
            Command(resume={"chat_history": [human_answer]}), config=config
        )
        snapshot_after = await graph.aget_state(config)

    assert snapshot_before.values.get("gap_report") == snapshot_after.values.get("gap_report"), (
        "gap_report must survive the interrupt/resume boundary unchanged"
    )
    assert snapshot_after.values.get("parsed_jd", {}).get("role_title") == "Senior Python Engineer", (
        "parsed_jd.role_title must survive checkpoint serialization"
    )


@pytest.mark.asyncio
async def test_full_interview_completes():
    """
    Three complete Q&A cycles must route to feedback_node (END),
    and feedback_report must be populated with overall_score.
    """
    mock_llm = _make_mock_llm()
    mock_structured = _make_mock_structured_llm()
    checkpointer = MemorySaver()
    config = {"configurable": {"thread_id": "test-full-001"}}

    answers = [
        "I used Redis for session caching in production.",
        "I deployed with Docker Compose and Kubernetes.",
        "I designed PostgreSQL schemas for e-commerce.",
    ]

    with (
        patch.object(_ig, "_llm", mock_llm),
        patch.object(_ig, "_llm_structured", mock_structured),
    ):
        graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )

        await graph.ainvoke(INITIAL_STATE, config=config)

        for answer in answers:
            snapshot = await graph.aget_state(config)
            if not snapshot.next:
                break
            human_msg = HumanMessage(content=f"[CANDIDATE ANSWER]\n{answer}")
            await graph.ainvoke(
                Command(resume={"chat_history": [human_msg]}), config=config
            )

        final = await graph.aget_state(config)

    assert not final.next, (
        f"Graph should be at END, but next={final.next}"
    )
    feedback = final.values.get("feedback_report", {})
    assert feedback, "feedback_report must be populated at END"
    assert "overall_score" in feedback, "feedback_report must contain overall_score"
