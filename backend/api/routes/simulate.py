"""
backend/api/routes/simulate.py
================================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : FastAPI router exposing POST /api/simulate and POST /api/whatif.
          Both endpoints call the real run_full_analysis() pipeline.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

# Ensure the engine directory is importable regardless of CWD
_ENGINE_DIR = Path(__file__).resolve().parent.parent.parent / "engine"
if str(_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(_ENGINE_DIR))

from simulation_runner import run_full_analysis  # type: ignore[import]
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
        "full 5-stage pipeline (M/M/c queuing → max-flow → CO2 KPIs → "
        "optimizer suggestions → SimPy DES), persists the result to SQLite, "
        "and returns a unified JSON response."
    ),
    status_code=status.HTTP_200_OK,
)
async def simulate(
    payload: SimulationPayload,
    session: Session = Depends(get_session),
) -> dict:
    """
    Main simulation endpoint consumed by the frontend.

    Steps
    -----
    1. Validate incoming SimulationPayload (Pydantic handles this automatically).
    2. Convert to plain dict via model_dump(mode='json') — avoids Pydantic
       object references leaking into the engine layer.
    3. Call run_full_analysis() — full 5-stage pipeline.
    4. Merge results into a single response dict.
    5. Persist input + output to SimulationHistory table.
    6. Return the merged dict.
    """
    try:
        # Convert Pydantic model → plain dict so engine receives raw dicts
        payload_dict = payload.model_dump(mode="json")

        # Run the full pipeline
        sim_result = run_full_analysis(payload_dict)

        # Build unified response
        response = {
            "status":    "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "simulation": sim_result,
        }

        # Persist to DB
        record = SimulationHistory(
            input_payload_json=payload.model_dump_json(),
            output_payload_json=json.dumps(response, ensure_ascii=False, default=str),
        )
        session.add(record)
        session.commit()

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

    The frontend sends a *modified* SimulationPayload (e.g., slider bumped a
    node capacity, or an edge was deactivated). We run the same pipeline and
    return results tagged as a scenario run so the UI can render a
    before/after comparison.
    """
    try:
        payload_dict = payload.model_dump(mode="json")

        sim_result = run_full_analysis(payload_dict)

        response = {
            "status":        "success",
            "scenario_type": "what_if",
            "timestamp":     datetime.now(timezone.utc).isoformat(),
            "simulation":    sim_result,
            "scenario_note": (
                "This is a what-if run. Compare environmental_metrics and "
                "optimizer_suggestions against your baseline /simulate result."
            ),
        }

        record = SimulationHistory(
            input_payload_json=payload.model_dump_json(),
            output_payload_json=json.dumps(response, ensure_ascii=False, default=str),
        )
        session.add(record)
        session.commit()

        return response

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"What-if simulation failed: {str(exc)}",
        ) from exc
