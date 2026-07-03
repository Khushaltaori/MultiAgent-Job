"""
tests/test_llm_retry.py
=======================

Tests that:
  1. Transient LLM errors trigger tenacity retry (with correct attempt count).
  2. After retry exhaustion, the SSE stream yields a clean `event: error` chunk
     rather than hanging the connection or crashing the graph silently.

Uses unittest.mock to patch _llm.invoke — no external API calls made.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.checkpoint.memory import MemorySaver

import graph.interview_graph as _ig


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_config(thread_id: str = "retry-test-thread") -> dict:
    return {"configurable": {"thread_id": thread_id}}


MINIMAL_STATE = {
    "resume_text": "Python engineer with 3 years experience.",
    "jd_text": "Looking for a senior Python dev.",
    "parsed_resume": {
        "skills": ["python"],
        "experience_level": "mid",
        "years_of_experience": 3,
        "summary": "Mid-level engineer",
    },
    "parsed_jd": {
        "role_title": "Senior Python Dev",
        "required_skills": ["python", "docker"],
        "experience_required": "5+ years",
        "company_name": "Test Corp",
    },
    "gap_report": {
        "match_score": 50,
        "matching_skills": ["python"],
        "missing_skills": ["docker"],
        "experience_gap": "underqualified",
        "recommendation": "Learn Docker.",
    },
    "chat_history": [],
    "questions_asked": 0,
    "feedback_report": {},
}


# ── Test 1: Retry logic engages on transient errors ───────────────────────────

def test_llm_timeout_triggers_retry():
    """
    Patch _llm.invoke to raise TimeoutError twice then succeed.
    Confirms tenacity retried and the final result is an AIMessage.
    """
    call_count = {"n": 0}
    success_response = AIMessage(content="What is your Docker experience?")

    def _flaky_invoke(messages):
        call_count["n"] += 1
        if call_count["n"] < 3:
            raise TimeoutError(f"Simulated LLM timeout (attempt {call_count['n']})")
        return success_response

    with patch.object(_ig, "_llm") as mock_llm:
        mock_llm.invoke.side_effect = _flaky_invoke

        # Directly test _invoke_llm_with_retry
        result = _ig._invoke_llm_with_retry(
            mock_llm,
            [SystemMessage(content="You are an interviewer.")]
        )

    assert call_count["n"] == 3, (
        f"Expected 3 total attempts (2 failures + 1 success), got {call_count['n']}"
    )
    assert isinstance(result, AIMessage), "Result should be AIMessage after successful retry"
    assert result.content == "What is your Docker experience?"


# ── Test 2: Retry exhaustion raises after max attempts ────────────────────────

def test_llm_exhausted_raises_after_max_attempts():
    """
    Patch _llm.invoke to always raise TimeoutError.
    Confirms tenacity re-raises after 3 attempts (stop_after_attempt(3)).
    """
    call_count = {"n": 0}

    def _always_fail(messages):
        call_count["n"] += 1
        raise TimeoutError("Simulated persistent LLM failure")

    with patch.object(_ig, "_llm") as mock_llm:
        mock_llm.invoke.side_effect = _always_fail

        with pytest.raises(TimeoutError, match="Simulated persistent LLM failure"):
            _ig._invoke_llm_with_retry(
                mock_llm,
                [SystemMessage(content="You are an interviewer.")]
            )

    assert call_count["n"] == 3, (
        f"Expected exactly 3 attempts before raising, got {call_count['n']}"
    )


# ── Test 3: SSE stream emits clean error event on graph crash ─────────────────

@pytest.mark.asyncio
async def test_llm_exhausted_emits_sse_error_event():
    """
    Simulates LLM failure during graph execution and confirms the SSE
    stream yields an `event: error` chunk rather than hanging.

    Uses a compiled test graph (MemorySaver) with a patched _llm that
    always raises — the _stream_ai_question helper should catch the
    exception from the graph and yield a clean error SSE event.
    """
    # Build a real graph with MemorySaver
    checkpointer = MemorySaver()

    # Patch structured LLM for parse/gap nodes to succeed
    class _StructuredSuccess:
        def with_structured_output(self, schema):
            class _M:
                def __init__(self, s):
                    self._s = s
                def invoke(self, msgs):
                    fields = {}
                    for name, field in self._s.model_fields.items():
                        ann = field.annotation
                        import typing
                        origin = getattr(ann, "__origin__", None)
                        if origin is list:
                            fields[name] = ["python"]
                        elif ann is int:
                            fields[name] = 1
                        else:
                            fields[name] = "mock"
                    return self._s(**fields)
            return _M(schema)

        def invoke(self, messages):
            raise TimeoutError("Simulated ask_question_node LLM failure")

    with (
        patch.object(_ig, "_llm_structured", _StructuredSuccess()),
        patch.object(_ig, "_llm", _StructuredSuccess()),
    ):
        test_graph = _ig.graph_builder.compile(
            checkpointer=checkpointer,
        )

        # Temporarily swap the module-level graph
        original = _ig.interview_graph
        _ig.interview_graph = test_graph

        try:
            from routers.interview import _stream_ai_question

            thread_id = "retry-sse-test-001"
            config = _make_config(thread_id)

            events = []
            async for raw_event in _stream_ai_question(thread_id, config, MINIMAL_STATE):
                events.append(raw_event)

            # At least one event must be an `event: error`
            all_text = b"".join(events).decode()
            assert "event: error" in all_text, (
                f"Expected 'event: error' in SSE output, got:\n{all_text}"
            )

            # The error payload must be valid JSON with an 'error' key
            error_lines = [
                line for line in all_text.splitlines()
                if line.startswith("data:")
                and "event: error" in all_text  # confirm context
            ]
            # Find the data line immediately after 'event: error'
            lines = all_text.splitlines()
            for i, line in enumerate(lines):
                if line.strip() == "event: error":
                    data_line = lines[i + 1] if i + 1 < len(lines) else ""
                    assert data_line.startswith("data:"), (
                        f"Expected data line after error event, got: {data_line}"
                    )
                    payload = json.loads(data_line[len("data:"):].strip())
                    assert "error" in payload, (
                        f"Error SSE payload must have 'error' key, got: {payload}"
                    )
                    break

        finally:
            _ig.interview_graph = original


# ── Test 4: Empty message guard ───────────────────────────────────────────────

def test_empty_message_list_raises_value_error():
    """
    _invoke_llm_with_retry should raise ValueError immediately (no LLM call)
    when given an empty messages list. Prevents silent crashes.
    """
    mock_llm = MagicMock()

    with pytest.raises(ValueError, match="No messages to send to LLM"):
        _ig._invoke_llm_with_retry(mock_llm, [])

    mock_llm.invoke.assert_not_called()
