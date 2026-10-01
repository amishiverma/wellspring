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

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
# from api.routes import simulate, whatif, explain
# app.include_router(simulate.router, prefix="/api")
# app.include_router(whatif.router,   prefix="/api")
# app.include_router(explain.router,  prefix="/api")
