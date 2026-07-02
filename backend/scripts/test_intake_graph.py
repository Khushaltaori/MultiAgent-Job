#!/usr/bin/env python3
"""
Quick smoke test for the LangGraph Intake & Gap Analysis pipeline.

Confirms:
  1. Graph compiles without errors.
  2. Fan-out: parse_resume_node AND parse_jd_node both run.
  3. Fan-in: gap_analysis_node receives both outputs before running.
  4. Final state contains all three expected keys.

Run with:
    cd backend
    source .venv/bin/activate
    GEMINI_API_KEY=AIza... python scripts/test_intake_graph.py

The script prints each stage result and exits 0 on success, 1 on failure.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("smoke_test")

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Set required env vars before importing settings
os.environ.setdefault("SECRET_KEY", "test-secret-not-used-here")
# GEMINI_API_KEY must be set in the environment or .env

# ── Sample inputs ─────────────────────────────────────────────────────────────

SAMPLE_RESUME = """
John Doe
Software Engineer | john@example.com | github.com/johndoe

SUMMARY
Backend engineer with 4 years of experience building scalable APIs and
data pipelines using Python, FastAPI, and MongoDB.

SKILLS
Python, FastAPI, MongoDB, Docker, Redis, PostgreSQL, REST APIs, Git,
Pytest, SQLAlchemy, basic React.js

EXPERIENCE
Senior Software Engineer – TechCorp (2022–present)
  - Designed and shipped 3 microservices handling 50k req/day
  - Reduced API latency by 40% via Redis caching layer

Software Engineer – StartupXYZ (2020–2022)
  - Built ETL pipelines using Python and Apache Airflow
  - Maintained PostgreSQL schemas for analytics team

EDUCATION
B.Sc. Computer Science – State University, 2020
""".strip()

SAMPLE_JD = """
Senior Python Engineer – AI Platform Team

We are building an AI-powered coaching platform and need a senior engineer
to own the backend infrastructure.

Requirements:
  - 5+ years Python backend experience
  - Strong FastAPI or Django REST Framework skills
  - Experience with LangChain, LangGraph, or similar LLM orchestration
  - MongoDB or PostgreSQL database design
  - Docker, Kubernetes, CI/CD pipelines
  - Excellent communication and mentoring skills

Nice to have:
  - Experience with OpenAI API or similar LLMs
  - Frontend exposure (React, Next.js)

Company: AI Coach Inc.
""".strip()


# ── Main test runner ──────────────────────────────────────────────────────────

async def main() -> None:
    logger.info("=== Intake & Gap Analysis Smoke Test ===")

    # Lazy import — triggers LLM instantiation with the real key
    from graph.intake_graph import intake_graph, GraphState

    # Verify graph topology before invoking
    logger.info("Graph nodes: %s", list(intake_graph.nodes))

    initial_state: GraphState = {
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_JD,
        "parsed_resume": {},
        "parsed_jd": {},
        "gap_report": {},
    }

    logger.info("Invoking graph (fan-out → parse nodes run in parallel) ...")
    final_state = await intake_graph.ainvoke(initial_state)

    # ── Assertions ────────────────────────────────────────────────────────────
    assert "parsed_resume" in final_state and final_state["parsed_resume"], \
        "FAIL: parsed_resume is empty"
    assert "parsed_jd" in final_state and final_state["parsed_jd"], \
        "FAIL: parsed_jd is empty"
    assert "gap_report" in final_state and final_state["gap_report"], \
        "FAIL: gap_report is empty"

    pr = final_state["parsed_resume"]
    pj = final_state["parsed_jd"]
    gr = final_state["gap_report"]

    assert isinstance(pr.get("skills"), list) and len(pr["skills"]) > 0, \
        "FAIL: no skills extracted from resume"
    assert isinstance(pj.get("required_skills"), list) and len(pj["required_skills"]) > 0, \
        "FAIL: no required_skills extracted from JD"
    assert 0 <= gr.get("match_score", -1) <= 100, \
        "FAIL: match_score out of range"
    assert isinstance(gr.get("missing_skills"), list), \
        "FAIL: missing_skills not a list"

    # ── Print results ─────────────────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("✅ PARSED RESUME")
    print(json.dumps(pr, indent=2))

    print("\n✅ PARSED JD")
    print(json.dumps(pj, indent=2))

    print("\n✅ GAP REPORT")
    print(json.dumps(gr, indent=2))

    print("\n" + "═" * 60)
    print(f"✅ All assertions passed — match_score: {gr['match_score']}%")
    print(f"   Missing skills ({len(gr['missing_skills'])}): {gr['missing_skills']}")
    print(f"   Experience gap: {gr.get('experience_gap')}")
    print(f"   Recommendation: {gr.get('recommendation', '')[:120]}...")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
        sys.exit(0)
    except AssertionError as e:
        logger.error("❌ Assertion failed: %s", e)
        sys.exit(1)
    except Exception as e:
        logger.exception("❌ Unexpected error: %s", e)
        sys.exit(1)
