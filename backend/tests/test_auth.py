"""
Smoke tests for /api/v1/auth/register and /api/v1/auth/login.

Run with:
    cd backend
    pytest tests/test_auth.py -v

Requirements:
    - A running MongoDB instance (mongodb://localhost:27017 by default).
    - An .env file (or env vars) with SECRET_KEY set.

The tests use FastAPI's built-in TestClient (httpx-backed), which works
synchronously even for async routes, so no pytest-asyncio config is needed here.
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=True)

@pytest.fixture(scope="module", autouse=True)
def start_app():
    """
    Wrap all tests in this module with the FastAPI lifespan so that
    connect_to_mongo() is called before any test runs.
    """
    with client:
        yield

# ── fixtures ──────────────────────────────────────────────────────────────────

TEST_EMAIL = "smoketest_user@example.com"
TEST_PASSWORD = "Str0ngP@ssw0rd!"


@pytest.fixture(autouse=True)
def cleanup_test_user():
    """
    Remove the test user before each test so every run starts clean.
    Uses the internal DB handle – this is acceptable in integration smoke tests.
    """
    from app.database import get_database

    import asyncio

    async def _delete():
        from pymongo import AsyncMongoClient
        from app.config import settings
        local_client = AsyncMongoClient(
            settings.MONGO_URI,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=10000,
        )
        try:
            db = local_client[settings.MONGO_DB_NAME]
            await db["users"].delete_many({"email": TEST_EMAIL})
        finally:
            await local_client.aclose()

    # Run cleanup before the test
    asyncio.get_event_loop().run_until_complete(_delete())
    yield
    # Run cleanup after the test as well
    asyncio.get_event_loop().run_until_complete(_delete())


# ── Test 1: Successful registration ──────────────────────────────────────────

def test_register_success():
    """POST /register with valid credentials returns 201 and the user's email."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == TEST_EMAIL
    assert "created_at" in data
    # hashed_password must never appear in the response
    assert "hashed_password" not in data
    assert "password" not in data


# ── Test 2: Duplicate registration → 409 ─────────────────────────────────────

def test_register_duplicate_returns_409():
    """Registering the same email twice must return 409 Conflict, not 500."""
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}

    # First registration
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201, r1.text

    # Second registration – must be 409
    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409, r2.text
    assert "already exists" in r2.json()["detail"].lower()


# ── Test 3: Login returns access token and sets refresh cookie ────────────────

def test_login_success():
    """
    After registering, POST /login should return a JSON access_token
    and set an HTTP-only refresh_token cookie.
    """
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, response.text

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Refresh cookie must be present
    assert "refresh_token" in response.cookies


# ── curl equivalents (printed to stdout for manual verification) ──────────────

def test_print_curl_commands():
    """
    Not a real assertion – prints the equivalent curl commands so the developer
    can reproduce each scenario from the terminal.
    """
    base = "http://localhost:8000"
    print("\n\n── curl smoke commands ─────────────────────────────────────────")
    print(
        f"# 1. Register\n"
        f'curl -s -X POST {base}/api/v1/auth/register \\\n'
        f'  -H "Content-Type: application/json" \\\n'
        f'  -d \'{{"email":"{TEST_EMAIL}","password":"{TEST_PASSWORD}"}}\' | python3 -m json.tool\n'
    )
    print(
        f"# 2. Register same email again (expect 409)\n"
        f'curl -s -X POST {base}/api/v1/auth/register \\\n'
        f'  -H "Content-Type: application/json" \\\n'
        f'  -d \'{{"email":"{TEST_EMAIL}","password":"{TEST_PASSWORD}"}}\' | python3 -m json.tool\n'
    )
    print(
        f"# 3. Login (returns access token + sets refresh cookie)\n"
        f'curl -s -c cookies.txt -X POST {base}/api/v1/auth/login \\\n'
        f'  -H "Content-Type: application/json" \\\n'
        f'  -d \'{{"email":"{TEST_EMAIL}","password":"{TEST_PASSWORD}"}}\' | python3 -m json.tool\n'
    )
    print("────────────────────────────────────────────────────────────────\n")
    assert True  # always pass
