"""
Smoke tests for resume upload and job description endpoints.

Tests:
  1. PDF extraction returns 200 and non-empty text
  2. DOCX extraction returns 200 and non-empty text
  3. Unsupported file type (txt) returns 400
  4. File over 5 MB returns 400
  5. JD submit with valid text returns 200
  6. JD submit with text too short returns 422

Run with:
    cd backend
    SECRET_KEY=testsecret pytest tests/test_resume_jd.py -v
"""

from __future__ import annotations

import io
import os

import pytest
from fastapi.testclient import TestClient

# Ensure imports resolve from backend/
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault("SECRET_KEY", "testsecretkey-for-testing-only-32chars!!")

from main import app
from app.auth import create_access_token

# Use lifespan=True so the app startup hook (connect_to_mongo) runs during tests
client = TestClient(app, raise_server_exceptions=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def auth_headers(email: str = "testuser@example.com") -> dict:
    """Return Authorization headers with a valid access token."""
    token = create_access_token(email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module", autouse=True)
def start_app():
    """
    Wrap all tests in this module with the FastAPI lifespan so that
    connect_to_mongo() is called before any test runs.
    """
    with client:  # enters/exits lifespan automatically
        yield


# ── Test 1: PDF upload ────────────────────────────────────────────────────────

def test_pdf_upload_success():
    pdf_path = os.path.join(FIXTURES, "sample_resume.pdf")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/resume/upload",
            files={"file": ("sample_resume.pdf", f, "application/pdf")},
            headers=auth_headers(),
        )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["char_count"] > 0
    assert "John Doe" in data["resume_text"]
    assert data["filename"] == "sample_resume.pdf"
    print(f"\n✅ PDF extracted {data['char_count']} chars")
    print(f"   Preview: {data['resume_text'][:120]!r}")


# ── Test 2: DOCX upload ───────────────────────────────────────────────────────

def test_docx_upload_success():
    docx_path = os.path.join(FIXTURES, "sample_resume.docx")
    with open(docx_path, "rb") as f:
        response = client.post(
            "/api/resume/upload",
            files={
                "file": (
                    "sample_resume.docx",
                    f,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            headers=auth_headers(),
        )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["char_count"] > 0
    assert "Jane Smith" in data["resume_text"]
    print(f"\n✅ DOCX extracted {data['char_count']} chars")
    print(f"   Preview: {data['resume_text'][:120]!r}")


# ── Test 3: Unsupported file type → 400 ──────────────────────────────────────

def test_unsupported_file_type_returns_400():
    response = client.post(
        "/api/resume/upload",
        files={"file": ("resume.txt", io.BytesIO(b"plain text resume"), "text/plain")},
        headers=auth_headers(),
    )
    assert response.status_code == 400, response.text
    assert "Unsupported file type" in response.json()["detail"]
    print("\n✅ .txt correctly rejected with 400")


# ── Test 4: File over 5 MB → 400 ─────────────────────────────────────────────

def test_oversized_file_returns_400():
    big_file = io.BytesIO(b"A" * (5 * 1024 * 1024 + 1))  # 5 MB + 1 byte
    response = client.post(
        "/api/resume/upload",
        files={"file": ("big.pdf", big_file, "application/pdf")},
        headers=auth_headers(),
    )
    assert response.status_code == 400, response.text
    assert "too large" in response.json()["detail"].lower()
    print("\n✅ Oversized file correctly rejected with 400")


# ── Test 5: JD submit – valid ─────────────────────────────────────────────────

def test_jd_submit_success():
    jd_text = (
        "We are looking for a Senior Python Engineer with 5+ years of experience "
        "building scalable backend systems using FastAPI, MongoDB, and Docker. "
        "You will design and implement REST APIs, integrate AI/ML pipelines, "
        "and collaborate closely with the product team. Strong communication skills required."
    )
    response = client.post(
        "/api/jd/submit",
        json={"text": jd_text},
        headers=auth_headers(),
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["char_count"] == len(jd_text)
    assert data["jd_text"] == jd_text
    print(f"\n✅ JD accepted: {data['char_count']} chars")


# ── Test 6: JD too short → 422 ───────────────────────────────────────────────

def test_jd_too_short_returns_422():
    response = client.post(
        "/api/jd/submit",
        json={"text": "Too short."},
        headers=auth_headers(),
    )
    assert response.status_code == 422, response.text
    print("\n✅ Short JD correctly rejected with 422")


# ── Test 7: Unauthenticated upload → 403 ─────────────────────────────────────

def test_resume_upload_requires_auth():
    pdf_path = os.path.join(FIXTURES, "sample_resume.pdf")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/resume/upload",
            files={"file": ("sample_resume.pdf", f, "application/pdf")},
            # No Authorization header
        )
    assert response.status_code in (401, 403), response.text
    print(f"\n✅ Unauthenticated upload correctly rejected with {response.status_code}")
