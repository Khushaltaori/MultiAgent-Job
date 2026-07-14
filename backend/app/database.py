"""
MongoDB connection manager using PyMongo's native async driver.
Motor is deprecated (EOL May 2026); we use pymongo.AsyncMongoClient instead.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# pyrefly: ignore [missing-import]
from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure

from app.config import settings

logger = logging.getLogger(__name__)

# ── module-level singletons (created once, reused across requests) ────────────
_client: AsyncMongoClient | None = None


async def connect_to_mongo() -> None:
    """Open the async MongoDB connection and ensure required indexes."""
    global _client
    _client = AsyncMongoClient(
        settings.MONGO_URI,
        tlsAllowInvalidCertificates=True,   # handles Atlas SSL handshake issues on strict networks
        serverSelectionTimeoutMS=10_000,     # fail fast instead of 30 s default
    )

    # Verify the connection is alive
    try:
        await _client.admin.command("ping")
        logger.info("MongoDB connected ✓")
    except Exception as exc:
        # Warn but do NOT crash – AI endpoints work without DB; auth endpoints will fail gracefully
        logger.warning(
            "MongoDB ping failed (%s). Server will start; DB-dependent routes may error.", exc
        )
        return

    # Enforce unique index on users.email
    db = _client[settings.MONGO_DB_NAME]
    await db["users"].create_index("email", unique=True)
    logger.info("Unique index on users.email ensured ✓")


async def close_mongo_connection() -> None:
    """Close the MongoDB connection gracefully."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
        logger.info("MongoDB connection closed")


def get_database():
    """
    Return the active async database handle.
    Raises RuntimeError if called before connect_to_mongo().
    """
    if _client is None:
        raise RuntimeError(
            "Database client not initialised. "
            "Call connect_to_mongo() during application startup."
        )
    return _client[settings.MONGO_DB_NAME]


@asynccontextmanager
async def lifespan_db() -> AsyncGenerator[None, None]:
    """AsyncContextManager for use with FastAPI lifespan."""
    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()
