"""
backend/main.py
===============
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : FastAPI application entrypoint — CORS, lifespan (DB init),
          health check, and router mounting point for all API routes.

Run     : uvicorn backend.main:app --reload --port 8000
          OR from the backend/ folder:
          uvicorn main:app --reload --port 8000

NOTE    : Zero imports from backend/engine/ — engine integration is Phase 3.
"""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure backend directory is in sys.path regardless of execution CWD
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from api.routes.simulate import router as simulate_router
from api.routes.explain import router as explain_router
from models.database import create_db_and_tables


# ---------------------------------------------------------------------------
# Lifespan — runs startup & shutdown logic (modern FastAPI pattern)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    Startup  : Creates SQLite tables if they don't already exist.
    Shutdown : (placeholder) clean up connections / background tasks here.
    """
    # ── Startup ──────────────────────────────────────────────────────────
    print("[startup] Creating database tables...")
    create_db_and_tables()
    print("[startup] Database ready. waste_twin.db is live.")

    yield  # application runs here

    # ── Shutdown ─────────────────────────────────────────────────────────
    print("[shutdown] Waste Flow API shutting down.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Waste Flow Digital Twin API",
    description=(
        "Backend API for the Waste Flow Bottleneck Analyzer. "
        "Provides simulation, bottleneck detection, CO2e calculations, "
        "and what-if scenario analysis for a waste management digital twin."
    ),
    version="1.0.0",
    contact={
        "name": "Vrinda (API Architect) — TSEC Minithon",
    },
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS Middleware — allow all origins for local Vite frontend dev
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # hackathon mode — open to all origins
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],          # Content-Type, Authorization, etc.
)


# ---------------------------------------------------------------------------
# Global Exception Handlers
# NOTE: Registered AFTER CORSMiddleware so CORS headers are always present
#       on error responses — Amishi's frontend will never see a CORS-blocked
#       error, even on 422 / 500.
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Catches Pydantic / FastAPI validation failures (HTTP 422).
    Returns a clean JSON body instead of FastAPI's default nested error shape.

    Triggered when:
    - A required field is missing in the POST body
    - A field value fails a Pydantic validator (e.g. current_load > capacity)
    - Wrong data type is sent
    """
    # Flatten Pydantic's nested error list into a readable string
    details = "; ".join(
        f"{' -> '.join(str(loc) for loc in err['loc'])}: {err['msg']}"
        for err in exc.errors()
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error":   True,
            "message": f"Validation failed — {details}",
            "hint":    "Check your request body matches the SimulationPayload schema.",
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    Catches any unhandled Python exception (HTTP 500).
    Prevents raw tracebacks from leaking to the frontend.

    Logs the error type and message; Tanishq / Yash should add
    proper logging (e.g. structlog / loguru) in their engine modules.
    """
    print(f"[ERROR] Unhandled exception on {request.method} {request.url}: {exc!r}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error":   True,
            "message": f"Internal server error — {type(exc).__name__}: {exc}",
            "hint":    "Check server logs for the full traceback.",
        },
    )


# ---------------------------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    tags=["Infrastructure"],
    summary="API health check",
    response_description="Returns alive status and API version",
)
async def health_check() -> dict:
    """
    Simple liveness probe.

    Returns
    -------
    JSON with `status` and `version` keys.
    Amishi can ping this on app load to confirm the backend is reachable.
    """
    return {
        "status": "API is alive",
        "version": "1.0.0",
        "project": "Waste Flow Digital Twin",
    }


# ---------------------------------------------------------------------------
# Root redirect → docs (quality-of-life for the hackathon demo)
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {"message": "Waste Flow API is running. Visit /docs for Swagger UI."}


# ---------------------------------------------------------------------------
# Future router mounts (Phase 3 — DO NOT uncomment until engine is ready)
# ---------------------------------------------------------------------------
# Phase 3 — simulate router is live
app.include_router(simulate_router, prefix="/api")

# Phase 4 — explain router is live
app.include_router(explain_router, prefix="/api")
