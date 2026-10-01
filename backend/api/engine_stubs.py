"""
backend/api/engine_stubs.py
============================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : Realistic stub functions that stand in for Tanishq's queuing engine
          and Yash's AI optimizer until their modules are ready to integrate.

          These return hardcoded-but-realistic data so:
          - Amishi can build and test the full UI immediately.
          - The POST /simulate and POST /whatif endpoints return real-looking JSON.
          - Tanishq and Yash simply replace these stubs with real calls in Phase 4.

NO imports from backend/engine/ — zero merge conflicts guaranteed.
"""

from __future__ import annotations

from models.schemas import SimulationPayload


# ---------------------------------------------------------------------------
# Stub 1 — Queuing & Graph Simulation  (replaces Tanishq's engine)
# ---------------------------------------------------------------------------

def run_queuing_simulation(payload: SimulationPayload) -> dict:
    """
    Fake simulation result that looks like output from an M/M/c Erlang-C
    analysis + NetworkX max-flow/min-cut bottleneck detection.

    Returns
    -------
    dict with:
      - enriched_nodes : each node annotated with fake simulation metrics
      - bottleneck_ids : list of node ids flagged as bottlenecks
      - flow_summary   : total throughput and efficiency stats
      - queue_stats    : per-node queue depth and wait time estimates
    """

    enriched_nodes = []
    bottleneck_ids = []

    for node in payload.nodes:
        # Use real utilization from schema; add fake simulation-derived fields
        utilization = node.utilization
        is_bottleneck = node.is_bottleneck

        # Fake M/M/c derived metrics (realistic formulas without the math)
        avg_queue_length  = round(max(0.0, (utilization ** 2) / (1 - utilization + 0.01) * 1.5), 2)
        avg_wait_time_min = round(avg_queue_length / max(node.capacity, 1) * 60, 2)
        service_rate      = round(node.capacity / 24, 2)   # tonnes per hour
        arrival_rate      = round(node.current_load / 24, 2)

        if is_bottleneck:
            bottleneck_ids.append(node.id)

        enriched_nodes.append({
            "id":                node.id,
            "name":              node.name,
            "type":              node.type.value,
            "capacity":          node.capacity,
            "current_load":      node.current_load,
            "coordinates":       node.coordinates,
            "utilization_rate":  utilization,           # Amishi uses this for node colour
            "is_bottleneck":     is_bottleneck,         # Amishi uses this for pulseRed
            "avg_queue_length":  avg_queue_length,
            "avg_wait_time_min": avg_wait_time_min,
            "service_rate_tph":  service_rate,
            "arrival_rate_tph":  arrival_rate,
            "status":            "critical" if is_bottleneck else "normal",
        })

    # Fake max-flow / min-cut result (NetworkX stub)
    min_cut_edges = [
        e.id for e in payload.edges
        if e.status.value == "congested"
    ]

    return {
        "enriched_nodes": enriched_nodes,
        "bottleneck_ids": bottleneck_ids,
        "min_cut_edges":  min_cut_edges,
        "flow_summary": {
            "total_daily_throughput_tonnes": payload.total_daily_throughput(),
            "active_edges":   sum(1 for e in payload.edges if e.status.value == "active"),
            "congested_edges": sum(1 for e in payload.edges if e.status.value == "congested"),
            "inactive_edges": sum(1 for e in payload.edges if e.status.value == "inactive"),
            "network_efficiency_pct": round(
                (1 - len(bottleneck_ids) / max(len(payload.nodes), 1)) * 100, 1
            ),
        },
        "simulation_meta": {
            "engine":   "stub_v1 (replace with Tanishq's queuing engine in Phase 4)",
            "duration_days": payload.parameters.simulation_duration_days,
            "time_step_hours": payload.parameters.time_step_hours,
        },
    }


# ---------------------------------------------------------------------------
# Stub 2 — AI Optimizer Summary  (replaces Yash's LLM + optimizer engine)
# ---------------------------------------------------------------------------

def get_ai_optimizer_summary(payload: SimulationPayload) -> dict:
    """
    Fake AI summary that looks like output from Yash's GPT/Gemini prompt
    and the rule-based heuristics optimizer.

    Returns
    -------
    dict with:
      - ai_summary        : hardcoded 3-bullet City Planner narrative
      - recommendations   : list of prioritised action cards (rule-based stubs)
      - co2e_estimate_kg  : fake CO2e emission total for the network
      - cost_estimate_inr : fake daily transport cost in INR
    """

    # Fake CO2e — emission_factor * throughput * avg_distance
    avg_distance = (
        sum(e.distance for e in payload.edges) / max(len(payload.edges), 1)
    )
    total_throughput = payload.total_daily_throughput()
    co2e_kg = round(
        total_throughput * avg_distance * payload.parameters.emission_factor_kg_per_km,
        2,
    )

    # Fake fuel cost
    total_km = sum(e.distance for e in payload.edges)
    litres_used = round(total_km / payload.parameters.fuel_efficiency_km_per_litre, 2)
    cost_inr    = round(litres_used * payload.parameters.diesel_price_per_litre, 2)

    # Rule-based stub recommendations (mirrors Yash's heuristic engine spec)
    recommendations = []
    for node in payload.nodes:
        if node.utilization >= 0.90:
            recommendations.append({
                "node_id":    node.id,
                "node_name":  node.name,
                "action":     "Add Processing Bay",
                "priority":   "HIGH",
                "reason":     f"Utilization at {node.utilization * 100:.1f}% — severe bottleneck risk.",
                "est_saving_co2_kg_day": round(co2e_kg * 0.12, 2),
                "est_saving_inr_day":    round(cost_inr * 0.10, 2),
            })
        elif node.utilization >= 0.85:
            recommendations.append({
                "node_id":    node.id,
                "node_name":  node.name,
                "action":     "Reroute 15% Inflow to Adjacent Node",
                "priority":   "MEDIUM",
                "reason":     f"Utilization at {node.utilization * 100:.1f}% — approaching critical threshold.",
                "est_saving_co2_kg_day": round(co2e_kg * 0.05, 2),
                "est_saving_inr_day":    round(cost_inr * 0.04, 2),
            })

    # Hardcoded 3-bullet AI City Planner summary (will be LLM-generated in Phase 4)
    bottleneck_names = [
        n.name for n in payload.nodes if n.is_bottleneck
    ]
    summary_bullets = [
        f"• CRITICAL CAPACITY BREACH: {', '.join(bottleneck_names[:2])} are operating above "
        f"85% capacity. Immediate rerouting or capacity expansion is advised to prevent "
        f"overflow events within the next 48 hours.",

        f"• EMISSION HOTSPOT: The network is generating an estimated {co2e_kg:,.1f} kg of CO₂e "
        f"daily across {len(payload.edges)} transport links. Switching 3 congested routes to "
        f"electric vehicles could reduce emissions by up to 18%.",

        f"• OPTIMIZATION OPPORTUNITY: {len(payload.edges) - sum(1 for e in payload.edges if e.status.value == 'inactive')} "
        f"of {len(payload.edges)} edges are active. Activating the Chembur→Govandi bypass "
        f"(edge_005) could relieve Wadala Transfer Station pressure by ~20 tonnes/day.",
    ]

    return {
        "ai_summary": {
            "model":   "stub_v1 (replace with Gemini/GPT in Phase 4)",
            "persona": "City Waste Planning Advisor",
            "bullets": summary_bullets,
        },
        "recommendations":   recommendations,
        "co2e_estimate_kg":  co2e_kg,
        "cost_estimate_inr": cost_inr,
        "optimizer_meta": {
            "engine":    "rule_based_stub_v1",
            "rules_fired": len(recommendations),
        },
    }
