"""
backend/api/routes/simulate.py
================================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : FastAPI router exposing POST /api/simulate and POST /api/whatif.
          Both endpoints accept a SimulationPayload and call stub functions
          from engine_stubs.py — no imports from backend/engine/.

Phase 4 migration path
-----------------------
  Replace the engine_stubs imports with real calls:
    from engine.queuing       import run_queuing_simulation   # Tanishq
    from engine.optimizer     import get_optimizer_results    # Yash
    from engine.co2_calculator import calculate_co2e          # Yash
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from api.engine_stubs import get_ai_optimizer_summary, run_queuing_simulation
from models.database import SimulationHistory, get_session
from models.schemas import SimulationPayload

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(tags=["Simulation"])


# ---------------------------------------------------------------------------
# POST /api/simulate
# ---------------------------------------------------------------------------

@router.post(
    "/simulate",
    summary="Run a full waste-flow simulation",
    description=(
        "Accepts a SimulationPayload (nodes + edges + parameters), runs the "
        "queuing simulation and AI optimizer stubs, persists the result to "
        "SQLite, and returns a unified JSON response."
    ),
    status_code=status.HTTP_200_OK,
)
async def simulate(
    payload: SimulationPayload,
    session: Session = Depends(get_session),
) -> dict:
    """
    Main simulation endpoint consumed by Amishi's frontend.

    Steps
    -----
    1. Validate incoming SimulationPayload (Pydantic handles this automatically).
    2. Call run_queuing_simulation() — returns enriched nodes + bottleneck data.
    3. Call get_ai_optimizer_summary() — returns recommendations + CO2e.
    4. Merge results into a single response dict.
    5. Persist input + output to SimulationHistory table.
    6. Return the merged dict.
    """
    try:
        # ── Step 2: Queuing simulation ─────────────────────────────────────
        sim_result = run_queuing_simulation(payload)

        # ── Step 3: AI optimizer summary ───────────────────────────────────
        ai_result = get_ai_optimizer_summary(payload)

        # ── Step 4: Merge into unified response ────────────────────────────
        response = {
            "status":    "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "simulation": sim_result,
            "optimizer":  ai_result,
        }

        # ── Step 5: Persist to DB ──────────────────────────────────────────
        record = SimulationHistory(
            input_payload_json=payload.model_dump_json(),
            output_payload_json=json.dumps(response, ensure_ascii=False),
        )
        session.add(record)
        session.commit()

        # ── Step 6: Return ─────────────────────────────────────────────────
        return response

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(exc)}",
        ) from exc


# ---------------------------------------------------------------------------
# POST /api/whatif
# ---------------------------------------------------------------------------

@router.post(
    "/whatif",
    summary="Run a what-if scenario simulation",
    description=(
        "Identical contract to /simulate but treats the payload as a "
        "what-if scenario (e.g., modified capacities or rerouted edges). "
        "Returns the same unified response shape so the frontend can diff "
        "baseline vs scenario results side-by-side."
    ),
    status_code=status.HTTP_200_OK,
)
async def whatif(
    payload: SimulationPayload,
    session: Session = Depends(get_session),
) -> dict:
    """
    What-if scenario endpoint.

    The frontend sends a *modified* SimulationPayload (e.g., Amishi's slider
    bumped a node capacity, or an edge was deactivated). We run the same
    pipeline and return results tagged as a scenario run so the UI can
    render a before/after comparison.
    """
    try:
        # ── Run the same pipeline as /simulate ────────────────────────────
        sim_result = run_queuing_simulation(payload)
        ai_result  = get_ai_optimizer_summary(payload)

        response = {
            "status":       "success",
            "scenario_type": "what_if",
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "simulation":   sim_result,
            "optimizer":    ai_result,
            "scenario_note": (
                "This is a what-if run. Compare enriched_nodes and "
                "co2e_estimate_kg against your baseline /simulate result."
            ),
        }

        # ── Persist scenario run separately ───────────────────────────────
        record = SimulationHistory(
            input_payload_json=payload.model_dump_json(),
            output_payload_json=json.dumps(response, ensure_ascii=False),
        )
        session.add(record)
        session.commit()

        return response

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"What-if simulation failed: {str(exc)}",
        ) from exc
