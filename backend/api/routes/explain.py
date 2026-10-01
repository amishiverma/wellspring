"""
backend/api/routes/explain.py
==============================
Author  : Yash (AI Engineer)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : FastAPI router exposing POST /api/explain.
          Accepts simulation results dict, calls generate_executive_summary()
          from llm_explainer.py, returns a 3-bullet AI summary.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

# Ensure the engine directory is importable regardless of CWD
_ENGINE_DIR = Path(__file__).resolve().parent.parent.parent / "engine"
if str(_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(_ENGINE_DIR))

from llm_explainer import generate_executive_summary  # type: ignore[import]

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(tags=["AI Explainer"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    """
    Payload for the /explain endpoint.

    bottleneck_data:
        The `node_metrics` + `graph_metrics` sub-dict from /simulate response.
        Any JSON-serializable dict is accepted — the LLM will extract what it needs.
    suggestions:
        The `optimizer_suggestions` list from /simulate response.
        Top-5 items are forwarded to the model; the rest are ignored.
    api_key:
        Optional OpenAI secret key.  If absent or empty, the fallback
        mock summary is returned instantly — safe for live demos.
    """
    bottleneck_data: dict[str, Any] = Field(
        default_factory=dict,
        description="node_metrics + graph_metrics from the /simulate response",
    )
    suggestions: list[dict[str, Any]] = Field(
        default_factory=list,
        description="optimizer_suggestions list from the /simulate response",
    )
    api_key: str | None = Field(
        default=None,
        description="OpenAI API key. Leave empty to use fallback mock summary.",
    )


class ExplainResponse(BaseModel):
    summary: str


# ---------------------------------------------------------------------------
# POST /api/explain
# ---------------------------------------------------------------------------

@router.post(
    "/explain",
    summary="Generate an AI executive summary of the simulation results",
    description=(
        "Accepts bottleneck data and optimizer suggestions from a prior "
        "/simulate call, then calls the LLM Explainer to produce 3 short, "
        "punchy bullet points summarising the waste flow crisis and remedies. "
        "Falls back to a realistic mock summary when no API key is provided — "
        "safe for live hackathon demos."
    ),
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
)
async def explain(body: ExplainRequest) -> ExplainResponse:
    """
    AI Executive Summary endpoint.

    Steps
    -----
    1. Extract bottleneck_data, suggestions, and optional api_key from body.
    2. Call generate_executive_summary() — never raises; always returns a string.
    3. Return {"summary": text}.
    """
    try:
        summary_text = generate_executive_summary(
            bottleneck_data=body.bottleneck_data,
            suggestions=body.suggestions,
            api_key=body.api_key,
        )
        return ExplainResponse(summary=summary_text)

    except Exception as exc:
        # generate_executive_summary() is designed never to raise, but we guard
        # defensively so the demo endpoint is always reachable.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM explainer failed: {str(exc)}",
        ) from exc
