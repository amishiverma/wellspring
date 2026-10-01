"""
co2_calculator.py
=================
Environmental KPI calculator for the Waste Flow Digital Twin.

Emission factors sourced from:
  - Diesel     : IPCC / DEFRA transport emission factors (~2.68 kg CO2e / litre)
  - Grid elec. : India average grid emission factor      (~0.85 kg CO2e / kWh)
  - Landfill   : EPA solid-waste emission factors        (~50  kg CO2e / tonne)

All flow rates are in **tonnes per hour**; distances in **km**.
These units match Vrinda's Pydantic data contracts.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Emission Constants
# ---------------------------------------------------------------------------
DIESEL_CO2_PER_LITER: float = 2.68          # kg CO2e per litre of diesel burned
KWH_CO2_PER_UNIT: float = 0.85              # kg CO2e per kWh of electricity
METHANE_CO2_PER_TON_LANDFILL: float = 50.0  # kg CO2e per tonne landfill-disposed

# Node types that represent final diversion (not landfill)
DIVERSION_NODE_TYPES: frozenset[str] = frozenset({"recycling", "compost", "wte", "sorting"})

# Node type that incurs methane emissions
LANDFILL_NODE_TYPE: str = "disposal"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_edge_flow(
    edge: dict[str, Any],
    flow_dict: dict[str, float],
) -> float:
    """Return the solved flow (tonnes/hr) for *edge*.

    Priority:
      1. flow_dict[edge_id]          – value from the solver / simulation layer
      2. edge["flow_tons_per_hour"]  – static annotation on the edge itself
      3. 0.0                         – fallback (logged as a warning)
    """
    edge_id: str | None = edge.get("id")
    if edge_id and edge_id in flow_dict:
        return float(flow_dict[edge_id])
    fallback: float = float(edge.get("flow_tons_per_hour", 0.0))
    if fallback == 0.0:
        logger.warning(
            "Edge '%s' has no flow value in flow_dict or on the edge itself; "
            "defaulting to 0.0 t/hr.",
            edge_id,
        )
    return fallback


def _get_node_flow(
    node: dict[str, Any],
    flow_dict: dict[str, float],
) -> float:
    """Return the throughput (tonnes/hr) for *node*.

    Priority:
      1. flow_dict[node_id]
      2. node["flow_tons_per_hour"]
      3. 0.0
    """
    node_id: str | None = node.get("id")
    if node_id and node_id in flow_dict:
        return float(flow_dict[node_id])
    fallback: float = float(node.get("flow_tons_per_hour", 0.0))
    if fallback == 0.0:
        logger.warning(
            "Node '%s' has no flow value in flow_dict or on the node itself; "
            "defaulting to 0.0 t/hr.",
            node_id,
        )
    return fallback


# ---------------------------------------------------------------------------
# Edge (transport) emissions
# ---------------------------------------------------------------------------

def _calculate_edge_emissions(
    edge: dict[str, Any],
    flow_dict: dict[str, float],
) -> dict[str, Any]:
    """Compute transport fuel use and CO2 for a single edge / route.

    Expected edge keys (all optional; defaults shown below):
      id                 : str
      source / target    : str   (node ids)
      distance_km        : float  (default 0.0)
      num_trucks         : int | float  (default 1)
      trips_per_hour     : float  (default 1.0)
      fuel_liters_per_km : float  (default 0.0)

    Formula:
      fuel_liters_per_hour = distance_km × num_trucks × trips_per_hour
                             × fuel_liters_per_km
      co2_kg_per_hour      = fuel_liters_per_hour × DIESEL_CO2_PER_LITER
    """
    edge_id: str = edge.get("id", "unknown_edge")
    distance_km: float = float(edge.get("distance_km", 0.0))
    num_trucks: float = float(edge.get("num_trucks", 1))
    trips_per_hour: float = float(edge.get("trips_per_hour", 1.0))
    fuel_liters_per_km: float = float(edge.get("fuel_liters_per_km", 0.0))

    fuel_liters_per_hour: float = (
        distance_km * num_trucks * trips_per_hour * fuel_liters_per_km
    )
    co2_kg_per_hour: float = fuel_liters_per_hour * DIESEL_CO2_PER_LITER

    return {
        "edge_id": edge_id,
        "source": edge.get("source", ""),
        "target": edge.get("target", ""),
        "distance_km": distance_km,
        "num_trucks": num_trucks,
        "trips_per_hour": trips_per_hour,
        "fuel_liters_per_km": fuel_liters_per_km,
        "fuel_liters_per_hour": round(fuel_liters_per_hour, 4),
        "transport_co2_kg_per_hour": round(co2_kg_per_hour, 4),
    }


# ---------------------------------------------------------------------------
# Node (facility) emissions
# ---------------------------------------------------------------------------

def _calculate_node_emissions(
    node: dict[str, Any],
    flow_dict: dict[str, float],
) -> dict[str, Any]:
    """Compute facility energy + methane CO2 for a single node.

    Expected node keys (all optional; defaults shown below):
      id                 : str
      type               : str  one of:
                             "source" | "transfer" | "processing" |
                             "recycling" | "compost" | "wte" | "disposal"
      energy_kwh_per_ton : float  electrical energy intensity (default 0.0)
      flow_tons_per_hour : float  resolved via _get_node_flow (default 0.0)

    Formulae:
      energy_co2  = flow × energy_kwh_per_ton × KWH_CO2_PER_UNIT
      methane_co2 = flow × METHANE_CO2_PER_TON_LANDFILL   (disposal only)
    """
    node_id: str = node.get("id", "unknown_node")
    node_type: str = (node.get("type") or "").lower().strip()
    energy_kwh_per_ton: float = float(node.get("energy_kwh_per_ton", 0.0))
    flow_tons_per_hour: float = _get_node_flow(node, flow_dict)

    # Energy-related CO2
    energy_co2_kg_per_hour: float = (
        flow_tons_per_hour * energy_kwh_per_ton * KWH_CO2_PER_UNIT
    )

    # Methane CO2 (landfill only)
    methane_co2_kg_per_hour: float = 0.0
    is_landfill: bool = node_type == LANDFILL_NODE_TYPE
    if is_landfill:
        methane_co2_kg_per_hour = flow_tons_per_hour * METHANE_CO2_PER_TON_LANDFILL

    total_node_co2: float = energy_co2_kg_per_hour + methane_co2_kg_per_hour

    # Diversion contribution (feeds into Landfill Diversion Rate)
    is_diversion: bool = node_type in DIVERSION_NODE_TYPES
    diverted_tons_per_hour: float = flow_tons_per_hour if is_diversion else 0.0

    return {
        "node_id": node_id,
        "node_type": node_type,
        "flow_tons_per_hour": round(flow_tons_per_hour, 4),
        "energy_kwh_per_ton": energy_kwh_per_ton,
        "energy_co2_kg_per_hour": round(energy_co2_kg_per_hour, 4),
        "methane_co2_kg_per_hour": round(methane_co2_kg_per_hour, 4),
        "total_node_co2_kg_per_hour": round(total_node_co2, 4),
        "is_landfill": is_landfill,
        "is_diversion": is_diversion,
        "diverted_tons_per_hour": round(diverted_tons_per_hour, 4),
    }


# ---------------------------------------------------------------------------
# Landfill Diversion Rate
# ---------------------------------------------------------------------------

def _calculate_diversion_rate(
    node_breakdowns: list[dict[str, Any]],
    nodes: list[dict[str, Any]],
    flow_dict: dict[str, float],
) -> float:
    """Compute the Landfill Diversion Rate as a percentage.

    Formula:
        rate (%) = (Σ flow at diversion nodes / Σ flow at source nodes) × 100

    Returns 0.0 — not ZeroDivisionError — when total source waste is zero.
    """
    total_diverted: float = sum(
        nb["diverted_tons_per_hour"] for nb in node_breakdowns
    )

    # Source nodes are waste-generation points (type == "source")
    total_source: float = sum(
        _get_node_flow(n, flow_dict)
        for n in nodes
        if (n.get("type") or "").lower().strip() == "source"
    )

    if total_source <= 0.0:
        logger.warning(
            "Total source waste flow is 0 or not found; "
            "landfill_diversion_rate will be reported as 0.0%%."
        )
        return 0.0

    rate: float = (total_diverted / total_source) * 100.0
    # Clamp to [0, 100] — floating-point noise can push slightly outside
    return round(min(max(rate, 0.0), 100.0), 2)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_environmental_kpis(
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    flow_dict: dict[str, float],
) -> dict[str, Any]:
    """Compute environmental KPIs for the Waste Flow Digital Twin.

    Parameters
    ----------
    nodes : list[dict]
        Facility / node descriptors.  Minimum required keys per node:
        ``id``, ``type``, ``energy_kwh_per_ton``.
    edges : list[dict]
        Route / edge descriptors.  Minimum required keys per edge:
        ``id``, ``source``, ``target``, ``distance_km``,
        ``num_trucks``, ``trips_per_hour``, ``fuel_liters_per_km``.
    flow_dict : dict[str, float]
        Mapping of  node_id | edge_id  →  flow in tonnes/hr.
        Produced by the simulation / graph-solver layer (Tanishq's engine).

    Returns
    -------
    dict with keys:
        ``total_co2_kg_per_hour``      : float
        ``total_fuel_liters_per_hour`` : float
        ``landfill_diversion_rate``    : float   (percentage, 0–100)
        ``edge_breakdown``             : list[dict]
        ``node_breakdown``             : list[dict]
        ``summary``                    : dict  (headline numbers + savings)

    Raises
    ------
    TypeError
        If any argument has the wrong type (fast-fail for bad API calls).
    """
    # --- Input validation (fast-fail) ---
    if not isinstance(nodes, list):
        raise TypeError(f"'nodes' must be a list, got {type(nodes).__name__!r}")
    if not isinstance(edges, list):
        raise TypeError(f"'edges' must be a list, got {type(edges).__name__!r}")
    if not isinstance(flow_dict, dict):
        raise TypeError(f"'flow_dict' must be a dict, got {type(flow_dict).__name__!r}")

    # --- 1. Edge (transport) emissions ---
    edge_breakdown: list[dict[str, Any]] = [
        _calculate_edge_emissions(edge, flow_dict) for edge in edges
    ]
    total_fuel_liters_per_hour: float = sum(
        eb["fuel_liters_per_hour"] for eb in edge_breakdown
    )
    total_transport_co2: float = sum(
        eb["transport_co2_kg_per_hour"] for eb in edge_breakdown
    )

    # --- 2. Node (facility) emissions ---
    node_breakdown: list[dict[str, Any]] = [
        _calculate_node_emissions(node, flow_dict) for node in nodes
    ]
    total_node_co2: float = sum(
        nb["total_node_co2_kg_per_hour"] for nb in node_breakdown
    )

    # --- Aggregate totals ---
    total_co2_kg_per_hour: float = total_transport_co2 + total_node_co2

    # --- 3. Landfill Diversion Rate ---
    landfill_diversion_rate: float = _calculate_diversion_rate(
        node_breakdowns=node_breakdown,
        nodes=nodes,
        flow_dict=flow_dict,
    )

    # --- Bonus: "Emissions Saved" vs. 100 % landfill baseline ---
    # Baseline = if all source waste went straight to landfill (methane only)
    total_source_flow: float = sum(
        nb["flow_tons_per_hour"]
        for nb in node_breakdown
        if nb["node_type"] == "source"
    )
    baseline_landfill_co2: float = total_source_flow * METHANE_CO2_PER_TON_LANDFILL
    emissions_saved_kg_per_hour: float = max(
        baseline_landfill_co2 - total_node_co2, 0.0
    )

    # Rough cost saving proxy: €45 / tonne CO2e (EU-ETS spot, for hackathon UI)
    cost_saved_eur_per_hour: float = round(
        emissions_saved_kg_per_hour / 1_000.0 * 45.0, 2
    )

    summary: dict[str, Any] = {
        "total_co2_kg_per_hour": round(total_co2_kg_per_hour, 2),
        "total_fuel_liters_per_hour": round(total_fuel_liters_per_hour, 2),
        "transport_co2_kg_per_hour": round(total_transport_co2, 2),
        "facility_co2_kg_per_hour": round(total_node_co2, 2),
        "landfill_diversion_rate_pct": landfill_diversion_rate,
        "emissions_saved_vs_full_landfill_kg_per_hour": round(
            emissions_saved_kg_per_hour, 2
        ),
        "estimated_cost_saved_eur_per_hour": cost_saved_eur_per_hour,
    }

    # --- 4. Return full result ---
    return {
        "total_co2_kg_per_hour": round(total_co2_kg_per_hour, 2),
        "total_fuel_liters_per_hour": round(total_fuel_liters_per_hour, 2),
        "landfill_diversion_rate": landfill_diversion_rate,
        "edge_breakdown": edge_breakdown,
        "node_breakdown": node_breakdown,
        "summary": summary,
    }
