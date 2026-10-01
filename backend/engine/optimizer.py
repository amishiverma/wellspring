"""
optimizer.py
============
Rule-based heuristics engine for the Waste Flow Digital Twin.

Consumes the bottleneck analysis output from Tanishq's graph_analyzer and
produces a prioritised list of actionable suggestions for the UI (Amishi)
and the /api/explain LLM route (Yash).

Design philosophy: every rule is an isolated, testable function.
The orchestrator `generate_suggestions` just composes them.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Any, TypedDict

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Priority ordering (lower int = higher urgency; used for sorting)
# ---------------------------------------------------------------------------

class Priority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"

_PRIORITY_ORDER: dict[Priority, int] = {
    Priority.CRITICAL: 0,
    Priority.HIGH:     1,
    Priority.MEDIUM:   2,
    Priority.LOW:      3,
}

# ---------------------------------------------------------------------------
# Suggestion TypedDict  (Pydantic-compatible shape expected by Vrinda's models)
# ---------------------------------------------------------------------------

class Suggestion(TypedDict):
    type: str                        # Rule identifier, e.g. "CAPACITY_UPGRADE"
    target_node_id: str              # ID of the affected node
    action: str                      # Short imperative title shown in the UI
    detail: str                      # Full human-readable description
    estimated_co2_reduction_pct: float  # e.g. 8.0  → "8% CO2 reduction"
    priority: str                    # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

# ---------------------------------------------------------------------------
# Thresholds (centralised — easy to tune without touching rule logic)
# ---------------------------------------------------------------------------

# Rule 1 – Capacity Upgrade
_CAPACITY_HIGH_THRESHOLD:     float = 0.85
_CAPACITY_CRITICAL_THRESHOLD: float = 1.00
_CAPACITY_CO2_REDUCTION_PCT:  float = 8.0

# Rule 2 – Route Rebalance
_REBALANCE_THRESHOLD:         float = 0.90
_REBALANCE_CO2_REDUCTION_PCT: float = 5.0

# Rule 3 – MRF Shift
_MRF_THRESHOLD:               float = 0.80
_MRF_CO2_REDUCTION_PCT:       float = 15.0

# ---------------------------------------------------------------------------
# Individual rule functions
# ---------------------------------------------------------------------------

def _rule_capacity_upgrade(
    node_id: str,
    label: str,
    node_type: str,
    utilization: float,
) -> Suggestion | None:
    """Rule 1 — Capacity Upgrade.

    Triggers when a node is overloaded (utilization > 0.85).
    Escalates to CRITICAL when the node is saturated (utilization > 1.0).
    """
    if utilization <= _CAPACITY_HIGH_THRESHOLD:
        return None

    priority = (
        Priority.CRITICAL
        if utilization > _CAPACITY_CRITICAL_THRESHOLD
        else Priority.HIGH
    )

    return Suggestion(
        type="CAPACITY_UPGRADE",
        target_node_id=node_id,
        action=f"Add 1 processing bay to {label}",
        detail=(
            f"{label} is operating at {utilization:.0%} utilization "
            f"({'saturated — waste backlog imminent' if utilization > 1.0 else 'near capacity'}). "
            f"Adding a processing bay is projected to reduce CO2 by "
            f"{_CAPACITY_CO2_REDUCTION_PCT:.0f}% by eliminating idle-truck emissions."
        ),
        estimated_co2_reduction_pct=_CAPACITY_CO2_REDUCTION_PCT,
        priority=priority.value,
    )


def _rule_route_rebalance(
    node_id: str,
    label: str,
    node_type: str,
    utilization: float,
) -> Suggestion | None:
    """Rule 2 — Route Rebalance.

    Triggers on transfer stations that are congested (utilization > 0.90).
    """
    if node_type.lower() != "transfer":
        return None
    if utilization <= _REBALANCE_THRESHOLD:
        return None

    return Suggestion(
        type="ROUTE_REBALANCE",
        target_node_id=node_id,
        action=f"Redirect 20% of incoming trucks from {label} to an alternate facility",
        detail=(
            f"Transfer station {label} is at {utilization:.0%} utilization. "
            f"Diverting 20% of truck volume to a secondary facility will reduce "
            f"dwell time and cut idling emissions by ~{_REBALANCE_CO2_REDUCTION_PCT:.0f}%."
        ),
        estimated_co2_reduction_pct=_REBALANCE_CO2_REDUCTION_PCT,
        priority=Priority.HIGH.value,
    )


def _rule_mrf_schedule(
    node_id: str,
    label: str,
    node_type: str,
    utilization: float,
) -> Suggestion | None:
    """Rule 3 — MRF Evening Shift.

    Triggers on sorting / MRF nodes that exceed 80% utilization.
    Waste overflows from an overloaded MRF go directly to landfill —
    hence the CO2 hit is disproportionately large.
    """
    if node_type.lower() not in {"sorting", "mrf"}:
        return None
    if utilization <= _MRF_THRESHOLD:
        return None

    return Suggestion(
        type="MRF_SCHEDULE",
        target_node_id=node_id,
        action=f"Add an evening shift at {label} to prevent landfill bypass",
        detail=(
            f"MRF/sorting facility {label} is at {utilization:.0%} utilization. "
            f"Without an evening shift, overflow waste is routed directly to landfill, "
            f"generating methane. An added shift is projected to reduce CO2 by "
            f"~{_MRF_CO2_REDUCTION_PCT:.0f}%."
        ),
        estimated_co2_reduction_pct=_MRF_CO2_REDUCTION_PCT,
        priority=Priority.CRITICAL.value,
    )


# Registry of all rules — add new rules here without touching the orchestrator
_RULES = [
    _rule_capacity_upgrade,
    _rule_route_rebalance,
    _rule_mrf_schedule,
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_suggestions(
    nodes: list[dict[str, Any]],
    bottleneck_results: dict[str, Any],
) -> list[Suggestion]:
    """Generate prioritised optimisation suggestions for the waste flow graph.

    Parameters
    ----------
    nodes:
        Node descriptors from the graph (same shape as co2_calculator input).
        Required keys per node: ``id``, ``type``.
        Optional key: ``label`` (falls back to ``id`` if absent).
    bottleneck_results:
        Output from Tanishq's graph_analyzer / queuing engine.
        Must contain ``node_metrics`` — a mapping of
        ``node_id`` → ``{"utilization": float, ...}``.

    Returns
    -------
    list[Suggestion]
        Deduplicated suggestions sorted by priority
        (CRITICAL → HIGH → MEDIUM → LOW).
        Returns an empty list if no rules trigger.

    Raises
    ------
    TypeError
        If ``nodes`` is not a list or ``bottleneck_results`` is not a dict.
    """
    # --- Input validation ---
    if not isinstance(nodes, list):
        raise TypeError(f"'nodes' must be a list, got {type(nodes).__name__!r}")
    if not isinstance(bottleneck_results, dict):
        raise TypeError(
            f"'bottleneck_results' must be a dict, got "
            f"{type(bottleneck_results).__name__!r}"
        )

    node_metrics: dict[str, dict[str, Any]] = bottleneck_results.get(
        "node_metrics", {}
    )

    suggestions: list[Suggestion] = []

    for node in nodes:
        node_id: str = node.get("id", "")
        if not node_id:
            logger.warning("Skipping node with missing 'id': %s", node)
            continue

        node_type: str = (node.get("type") or "").lower().strip()
        label: str = node.get("label") or node.get("name") or node_id

        metrics: dict[str, Any] = node_metrics.get(node_id, {})
        if not metrics:
            logger.debug(
                "No bottleneck metrics found for node '%s'; skipping rules.", node_id
            )
            continue

        # utilization must be a non-negative float
        raw_util = metrics.get("utilization", 0.0)
        try:
            utilization = float(raw_util)
        except (TypeError, ValueError):
            logger.warning(
                "Node '%s' has non-numeric utilization '%s'; skipping.", node_id, raw_util
            )
            continue

        if utilization < 0.0:
            logger.warning(
                "Node '%s' has negative utilization %.4f; treating as 0.", node_id, utilization
            )
            utilization = 0.0

        # Apply every rule and collect non-None results
        for rule_fn in _RULES:
            result = rule_fn(node_id, label, node_type, utilization)
            if result is not None:
                suggestions.append(result)
                logger.info(
                    "[%s] Rule '%s' triggered for node '%s' (utilization=%.2f)",
                    result["priority"],
                    result["type"],
                    node_id,
                    utilization,
                )

    # Sort by priority (CRITICAL first), then by CO2 reduction descending
    suggestions.sort(
        key=lambda s: (
            _PRIORITY_ORDER.get(Priority(s["priority"]), 99),
            -s["estimated_co2_reduction_pct"],
        )
    )

    logger.info(
        "optimizer: %d suggestion(s) generated from %d node(s).",
        len(suggestions),
        len(nodes),
    )
    return suggestions