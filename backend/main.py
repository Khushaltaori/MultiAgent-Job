"""
FastAPI application entry point.

Wires together:
  - Lifespan (MongoDB connect / disconnect)
  - CORS middleware (Next.js origin, credentials=True)
  - SlowAPI rate-limit middleware + exception handler
  - Auth router
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

logger = logging.getLogger(__name__)

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.limiter import limiter
from routers.auth import router as auth_router
from routers.resume import router as resume_router
from routers.jd import router as jd_router
from routers.analysis import router as analysis_router
from routers.interview import router as interview_router


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / shutdown hooks."""
    # 1. MongoDB
    await connect_to_mongo()

    # 2. Redis checkpointer — recompile interview_graph with AsyncRedisSaver.
    #    Falls back to the MemorySaver dev graph if Redis is unreachable.
    import graph.interview_graph as _ig
    try:
        redis_cp = await _ig.get_redis_checkpointer()
        _ig.interview_graph = _ig.graph_builder.compile(
            checkpointer=redis_cp,
        )
        logger.info("interview_graph compiled with AsyncRedisSaver")
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Redis unavailable (%s) — interview_graph using MemorySaver fallback", exc
        )

    yield

    # Shutdown
    await close_mongo_connection()


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Job Coach API",
    description="Backend for the AI-powered job coaching platform.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach limiter to the app state (required by slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
# credentials=True is required for the browser to send/receive the refresh cookie.
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # needed for HTTP-only cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(analysis_router)
app.include_router(interview_router)


# ── Health-check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"], include_in_schema=False)
async def health() -> dict:
    return {"status": "ok"}
