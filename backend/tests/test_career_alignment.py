"""
Test career alignment endpoint (Intake Analysis) with fallbacks.
"""

from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient

# Ensure imports resolve from backend/
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault("SECRET_KEY", "testsecretkey-for-testing-only-32chars!!")

from main import app
from app.auth import create_access_token

client = TestClient(app, raise_server_exceptions=True)

def auth_headers(email: str = "testuser@example.com") -> dict:
    token = create_access_token(email)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module", autouse=True)
def start_app():
    with client:
        yield

def test_career_alignment_success():
    resume_text = (
        "Rajiv is a software engineer with 3 years of experience. "
        "Experienced in Python, Django, FastAPI, PostgreSQL, and AWS. "
        "Built multiple backend services and optimized query performance. "
        "Graduated with a BS in Computer Science."
    )
    jd_text = (
        "We are looking for a Software Engineer with 3+ years of experience "
        "working with Python, FastAPI, Docker, and AWS. "
        "Responsibilities include developing APIs and microservices. "
        "Familiarity with Kubernetes and CI/CD pipelines is a plus."
    )

    response = client.post(
        "/api/analysis/intake",
        json={
            "resume_text": resume_text,
            "jd_text": jd_text
        },
        headers=auth_headers()
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert "parsed_resume" in data
    assert "parsed_jd" in data
    assert "gap_report" in data

    gap = data["gap_report"]
    assert "match_score" in gap
    assert isinstance(gap["match_score"], int)
    assert 0 <= gap["match_score"] <= 100
    assert "missing_skills" in gap
    assert "matching_skills" in gap

    # Docker is in JD but missing in resume
    assert any("docker" in skill.lower() for skill in gap["missing_skills"])
    # Python, FastAPI, AWS are matching
    assert any("python" in skill.lower() for skill in gap["matching_skills"])

    print(f"\n✅ Career alignment analysis succeeded! Match Score: {gap['match_score']}%")
    print(f"   Missing skills: {gap['missing_skills']}")
    print(f"   Matching skills: {gap['matching_skills']}")
