"""
simulation_runner.py — Central Orchestrator for Waste Flow Analysis Pipeline
Member 3: Tanishq (Core Algorithm & Simulation Scientist)

This is the single entry-point the API team (Vrinda) calls.
One function in → one clean dict out.

Pipeline:
  Step 1  queuing.py         →  per-node M/M/c metrics (utilization, queue, wait)
  Step 2  graph_analyzer.py  →  global max-flow, min-cut bottlenecks, centrality
  Step 3  simpy_engine.py    →  8-hour discrete-event time-series snapshots

Usage (from Vrinda's SimulationService):
    from backend.engine.simulation_runner import run_full_analysis

    result = run_full_analysis(payload)
    # result["node_metrics"]   → list[dict]  — one per facility node
    # result["graph_metrics"]  → dict        — max_flow, bottlenecks, centrality
    # result["time_series"]    → list[dict]  — 0.25-hr snapshots for frontend charts
"""

from __future__ import annotations

import json
import logging
import time
import traceback
from typing import Any

# ── Engine imports ────────────────────────────────────────────────────────────
from queuing import analyze_all_nodes, get_bottleneck_nodes
from graph_analyzer import analyze_network_capacity
from simpy_engine import run_time_series_simulation

logger = logging.getLogger(__name__)

# Node types that are processing facilities (eligible for M/M/c analysis)
_FACILITY_TYPES = {"transfer", "mrf", "landfill", "recycling", "processing"}

# Node types that are waste sources (start of the flow graph)
_SOURCE_TYPES = {"residential", "source"}

# Node types that are terminal sinks (end of the flow graph)
_SINK_TYPES = {"landfill", "recycling"}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _find_source_and_sink(nodes: list[dict]) -> tuple[str | None, str | None]:
    """
    Dynamically pick one source_node_id and one sink_node_id from the node list
    so analyze_network_capacity() always has valid IDs even if the caller doesn't
    provide them explicitly.

    Priority: first node matching _SOURCE_TYPES / _SINK_TYPES.
    Falls back to the first and last node ids if no typed nodes found.
    """
    source_id: str | None = None
    sink_id: str | None = None

    for node in nodes:
        node_type = node.get("type", "")
        nid = node.get("id")
        if not nid:
            continue
        if source_id is None and node_type in _SOURCE_TYPES:
            source_id = nid
        if node_type in _SINK_TYPES:
            sink_id = nid  # keep updating — last sink wins (deepest in graph)

    # Absolute fallback
    if nodes:
        if source_id is None:
            source_id = nodes[0].get("id")
        if sink_id is None:
            sink_id = nodes[-1].get("id")

    return source_id, sink_id


def _safe_node_metrics(nodes: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Run M/M/c analysis only on facility nodes. Gracefully skips any node
    that is missing required keys or has a zero/negative service rate.

    Returns
    -------
    all_metrics     : list[dict]  — metrics for every facility node
    bottleneck_list : list[dict]  — filtered to nodes with utilisation > 0.85
    """
    # Filter to facility nodes only; use .get() throughout to survive malformed dicts
    facility_nodes = [
        n for n in nodes
        if n.get("type", "") in _FACILITY_TYPES
        and float(n.get("service_rate_per_server", 0)) > 0
        and int(n.get("num_servers", 0)) > 0
    ]

    if not facility_nodes:
        return [], []

    try:
        all_metrics = analyze_all_nodes(facility_nodes)
        bottlenecks = get_bottleneck_nodes(all_metrics)
        return all_metrics, bottlenecks
    except Exception as exc:
        logger.error("queuing.analyze_all_nodes failed: %s", exc)
        return [], []


def _safe_graph_metrics(
    nodes: list[dict],
    edges: list[dict],
    source_id: str | None,
    sink_id: str | None,
) -> dict:
    """
    Run max-flow / min-cut analysis. Returns an empty-safe dict on any error.
    """
    if not nodes or not edges or source_id is None or sink_id is None:
        return {
            "max_flow": 0.0,
            "bottleneck_edges": [],
            "node_centrality": {},
            "saturated_edges": [],
            "utilization_by_edge": {},
            "min_cut_capacity": 0.0,
            "error": "Insufficient nodes/edges for graph analysis",
        }

    try:
        return analyze_network_capacity(
            nodes=nodes,
            edges=edges,
            source_node_id=source_id,
            sink_node_id=sink_id,
        )
    except Exception as exc:
        logger.error("graph_analyzer.analyze_network_capacity failed: %s", exc)
        return {
            "max_flow": 0.0,
            "bottleneck_edges": [],
            "node_centrality": {},
            "saturated_edges": [],
            "utilization_by_edge": {},
            "min_cut_capacity": 0.0,
            "error": str(exc),
        }


def _safe_time_series(
    nodes: list[dict],
    edges: list[dict],
    sim_time_hours: int,
) -> list[dict]:
    """
    Run SimPy discrete-event simulation. Returns empty list on any error.
    """
    if not nodes:
        return []

    try:
        return run_time_series_simulation(
            nodes=nodes,
            edges=edges,
            sim_time_hours=sim_time_hours,
        )
    except Exception as exc:
        logger.error("simpy_engine.run_time_series_simulation failed: %s", exc)
        return [{"error": str(exc)}]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_full_analysis(payload: dict, sim_time_hours: int = 8) -> dict:
    """
    Central orchestrator — runs the full 3-stage simulation pipeline and returns
    a single, serialisation-ready dictionary for Vrinda's Pydantic layer.

    Parameters
    ----------
    payload : dict
        Must contain exactly two keys:
            nodes : list[dict]
                Each node dict should have:
                    id                      (str)   — unique identifier
                    type                    (str)   — 'residential'|'transfer'|
                                                      'mrf'|'landfill'|'recycling'
                    arrival_rate_tons_hr    (float) — waste arrival rate tons/hr
                    service_rate_per_server (float) — processing rate per bay
                    num_servers             (int)   — number of parallel bays
            edges : list[dict]
                Each edge dict should have:
                    source              (str)   — origin node id
                    target              (str)   — destination node id
                    num_trucks          (int)   — trucks on this route
                    truck_capacity_tons (float) — tons per truck
                    trips_per_hour      (float) — trips per hour per truck
                    distance_km         (float) — route distance (optional)

    sim_time_hours : int
        SimPy simulation duration (default 8 hours / one shift).
        Must stay under ~24 hrs to keep API response < 2 s.

    Returns
    -------
    dict with four top-level keys:

        node_metrics : dict
            queuing_analysis  : list[dict]   — full M/M/c metrics per facility node
            bottleneck_nodes  : list[dict]   — subset with utilisation > 0.85
            total_facilities  : int
            total_bottlenecks : int

        graph_metrics : dict
            max_flow            (float)      — city-wide max throughput (tons/hr)
            min_cut_capacity    (float)      — same as max_flow (theorem check)
            bottleneck_edges    (list[dict]) — min-cut edges that restrict flow
            saturated_edges     (list[dict]) — edges at >= 99% utilisation
            utilization_by_edge (dict)       — per-edge flow/capacity breakdown
            node_centrality     (dict)       — betweenness centrality per node

        time_series : list[dict]
            One snapshot every 0.25 hours (15 min) for sim_time_hours duration.
            Each snapshot contains: time, {node_id}_queue, {node_id}_active,
            {node_id}_utilization for every facility node.

        meta : dict
            sim_time_hours   (int)
            total_nodes      (int)
            total_edges      (int)
            facility_count   (int)
            source_node_id   (str)
            sink_node_id     (str)
            duration_seconds (float) — wall-clock time for the full pipeline
            errors           (list)  — any non-fatal errors encountered
    """
    wall_start = time.perf_counter()
    errors: list[str] = []

    # ── Defensive extraction with .get() ─────────────────────────────────────
    nodes: list[dict] = payload.get("nodes", [])
    edges: list[dict] = payload.get("edges", [])

    if not isinstance(nodes, list):
        nodes = []
        errors.append("payload['nodes'] was not a list; defaulted to []")
    if not isinstance(edges, list):
        edges = []
        errors.append("payload['edges'] was not a list; defaulted to []")

    # Strip any node/edge dicts that don't at least have an 'id' field
    nodes = [n for n in nodes if isinstance(n, dict) and n.get("id")]
    edges = [e for e in edges if isinstance(e, dict) and e.get("source") and e.get("target")]

    # Identify source and sink IDs for graph analysis
    source_id, sink_id = _find_source_and_sink(nodes)

    # ── Step 1: M/M/c Queuing Analysis ───────────────────────────────────────
    logger.info("[Step 1] Running M/M/c queuing analysis on %d nodes ...", len(nodes))
    t1 = time.perf_counter()
    all_metrics, bottleneck_nodes = _safe_node_metrics(nodes)
    t1_done = time.perf_counter() - t1
    logger.info("[Step 1] Done in %.3f s — %d facilities, %d bottlenecks",
                t1_done, len(all_metrics), len(bottleneck_nodes))

    # ── Step 2: Max-Flow / Min-Cut Graph Analysis ─────────────────────────────
    logger.info("[Step 2] Running graph flow analysis (source=%s, sink=%s) ...",
                source_id, sink_id)
    t2 = time.perf_counter()
    graph_result = _safe_graph_metrics(nodes, edges, source_id, sink_id)
    t2_done = time.perf_counter() - t2
    if "error" in graph_result:
        errors.append(f"graph_metrics: {graph_result['error']}")
    logger.info("[Step 2] Done in %.3f s — max_flow=%.2f tons/hr",
                t2_done, graph_result.get("max_flow", 0.0))

    # ── Step 3: SimPy Discrete-Event Time-Series Simulation ───────────────────
    logger.info("[Step 3] Running SimPy simulation for %d hours ...", sim_time_hours)
    t3 = time.perf_counter()
    time_series = _safe_time_series(nodes, edges, sim_time_hours)
    t3_done = time.perf_counter() - t3
    if time_series and "error" in time_series[0]:
        errors.append(f"time_series: {time_series[0]['error']}")
        time_series = []
    logger.info("[Step 3] Done in %.3f s — %d snapshots generated",
                t3_done, len(time_series))

    # ── Step 4: Package the output ────────────────────────────────────────────
    wall_done = time.perf_counter() - wall_start

    return {
        "node_metrics": {
            "queuing_analysis": all_metrics,
            "bottleneck_nodes": bottleneck_nodes,
            "total_facilities": len(all_metrics),
            "total_bottlenecks": len(bottleneck_nodes),
        },
        "graph_metrics": graph_result,
        "time_series": time_series,
        "meta": {
            "sim_time_hours": sim_time_hours,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "facility_count": len(all_metrics),
            "source_node_id": source_id,
            "sink_node_id": sink_id,
            "duration_seconds": round(wall_done, 4),
            "errors": errors,
        },
    }


def generate_llm_context_string(simulation_results: dict) -> str:
    """
    Convert the full run_full_analysis() output into a concise natural-language
    string optimised for injection into an LLM prompt (OpenAI / Gemini).

    The Yash (AI Engineer) team can call this function directly and pass the
    returned string as the user-content block of a chat message:

        context = generate_llm_context_string(run_full_analysis(payload))
        messages = [
            {"role": "system", "content": CITY_PLANNER_SYSTEM_PROMPT},
            {"role": "user",   "content": context},
        ]
        response = openai.chat.completions.create(model="gpt-4o", messages=messages)

    Output Format
    -------------
    A single, structured plain-text string with four sections:

        Simulation Results:
          Network Overview   — max flow, node/edge counts, runtime
          Bottleneck Nodes   — facility id, utilisation %, queue length, wait time
          Critical Edges     — min-cut edges that restrict total throughput
          Simulation Trend   — queue growth from first to last 15-min snapshot

    Example Output
    --------------
    'Simulation Results: The city waste network has a maximum throughput of
    80.0 tons/hr (max-flow / min-cut value). Analysis covered 7 nodes and 6
    transport edges over an 8-hour simulation.

    Bottleneck Facilities (utilisation > 85%):
      - mrf_1 [mrf]: 162.5% utilisation, queue=INFINITE, wait=INFINITE
      - transfer_2 [transfer]: 120.0% utilisation, queue=INFINITE, wait=INFINITE
      - transfer_1 [transfer]: 88.9% utilisation, queue=6.38 trucks, wait=0.08 hrs

    Critical Restricted Edges (minimum cut — removing these collapses the network):
      - mrf_1 → recycling_1: capacity=20.0 t/hr, flow=20.0 t/hr (100% saturated)
      - mrf_1 → landfill_1: capacity=60.0 t/hr, flow=60.0 t/hr (100% saturated)

    Time-Series Trend (SimPy 8-hr DES, sampled every 15 min):
      t=0.0h: transfer_1_queue=0, mrf_1_queue=0
      t=7.75h: transfer_1_queue=49, mrf_1_queue=30
      Queue growth indicates persistent congestion at upstream facilities.'

    Parameters
    ----------
    simulation_results : dict
        The dictionary returned by run_full_analysis(). Uses .get() throughout
        so partial / malformed results produce gracefully degraded strings.

    Returns
    -------
    str
        Concise, information-dense plain-text context string.
        Always returns a non-empty string, even if results are empty.
    """
    lines: list[str] = []

    # ── 1. Network Overview ───────────────────────────────────────────────────
    meta         = simulation_results.get("meta", {})
    graph        = simulation_results.get("graph_metrics", {})
    node_metrics = simulation_results.get("node_metrics", {})
    time_series  = simulation_results.get("time_series", [])

    max_flow       = graph.get("max_flow", 0.0)
    total_nodes    = meta.get("total_nodes", 0)
    total_edges    = meta.get("total_edges", 0)
    sim_time       = meta.get("sim_time_hours", 8)
    duration       = meta.get("duration_seconds", 0.0)
    pipeline_errs  = meta.get("errors", [])

    lines.append(
        f"Simulation Results: The city waste network has a maximum throughput of "
        f"{max_flow} tons/hr (Max-Flow / Min-Cut theorem, Edmonds-Karp algorithm). "
        f"Analysis covered {total_nodes} nodes and {total_edges} transport edges "
        f"over a {sim_time}-hour simulation (computed in {duration}s)."
    )
    if pipeline_errs:
        lines.append(f"  [Pipeline warnings: {'; '.join(pipeline_errs)}]")

    # ── 2. Bottleneck Facilities ──────────────────────────────────────────────
    bottlenecks = node_metrics.get("bottleneck_nodes", [])
    total_bots  = node_metrics.get("total_bottlenecks", 0)
    total_facs  = node_metrics.get("total_facilities", 0)

    lines.append(
        f"\nBottleneck Facilities ({total_bots} of {total_facs} facilities "
        f"have utilisation > 85%):"
    )
    if bottlenecks:
        for b in bottlenecks:
            nid   = b.get("node_id",  "unknown")
            ntype = b.get("node_type", "?")
            util  = b.get("utilization", 0.0)
            ql    = b.get("queue_length")
            wt    = b.get("wait_time_hours")
            ql_str = f"{ql} trucks" if ql is not None else "INFINITE"
            wt_str = f"{wt} hrs"   if wt is not None else "INFINITE"
            lines.append(
                f"  - {nid} [{ntype}]: {util * 100:.1f}% utilisation, "
                f"queue={ql_str}, wait={wt_str}"
            )
    else:
        lines.append("  - No bottleneck facilities detected. Network is healthy.")

    # ── 3. Critical Restricted Edges (Min-Cut) ────────────────────────────────
    cut_edges = graph.get("bottleneck_edges", [])
    lines.append(
        f"\nCritical Restricted Edges (minimum cut — "
        f"{len(cut_edges)} edge(s) that limit total network throughput):"
    )
    if cut_edges:
        for e in cut_edges:
            src  = e.get("source", "?")
            tgt  = e.get("target", "?")
            cap  = e.get("capacity", 0.0)
            flow = e.get("flow", 0.0)
            util = (flow / cap * 100) if cap > 0 else 0.0
            transport = e.get("is_transport_edge", True)
            tag  = "" if transport else " [virtual]"
            lines.append(
                f"  - {src} → {tgt}{tag}: "
                f"capacity={cap} t/hr, flow={flow} t/hr ({util:.0f}% saturated)"
            )
    else:
        lines.append("  - No critical edges identified.")

    # ── 4. Node Centrality Highlights ────────────────────────────────────────
    centrality = graph.get("node_centrality", {})
    if centrality:
        # Top 3 most central nodes (most critical to flow routing)
        top_central = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:3]
        central_str = ", ".join(
            f"{nid} (score={score:.3f})" for nid, score in top_central
        )
        lines.append(
            f"\nMost Structurally Critical Nodes (betweenness centrality): {central_str}"
        )

    # ── 5. Time-Series Trend ──────────────────────────────────────────────────
    if time_series and len(time_series) >= 2:
        first_snap = time_series[0]
        last_snap  = time_series[-1]

        # Extract queue fields for all facility nodes from first and last snapshot
        def _queue_summary(snap: dict) -> str:
            pairs = [
                f"{k.replace('_queue', '')}={v}"
                for k, v in snap.items()
                if k.endswith("_queue")
            ]
            return ", ".join(pairs) if pairs else "no facility queues"

        t_start = first_snap.get("time", 0.0)
        t_end   = last_snap.get("time",  sim_time)
        lines.append(
            f"\nTime-Series Trend (SimPy {sim_time}-hr DES, "
            f"sampled every 15 min — {len(time_series)} snapshots):"
        )
        lines.append(f"  t={t_start}h: {_queue_summary(first_snap)}")
        lines.append(f"  t={t_end}h:  {_queue_summary(last_snap)}")

        # Check if queues are growing (compare queue values first vs last)
        growing = any(
            last_snap.get(k, 0) > first_snap.get(k, 0)
            for k in last_snap if k.endswith("_queue")
        )
        trend = (
            "Queue lengths are growing — persistent congestion detected."
            if growing else
            "Queue lengths are stable — network reached steady state."
        )
        lines.append(f"  Trend: {trend}")
    else:
        lines.append("\nTime-Series: No simulation data available.")

    # ── Final assembly ────────────────────────────────────────────────────────
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Local end-to-end test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        datefmt="%H:%M:%S",
    )

    # ── Full mock payload ─────────────────────────────────────────────────────
    #
    #   residential_north ──(80 t/hr)──► transfer_1 ──┐
    #                                                   ├──(90 t/hr)──► mrf_1 ──(60 t/hr)──► landfill_1
    #   residential_south ──(60 t/hr)──► transfer_2 ──┘         └──(20 t/hr)──► recycling_1
    #
    MOCK_PAYLOAD: dict[str, Any] = {
        "nodes": [
            # ── Source zones (residential) ────────────────────────────────────
            {
                "id": "residential_north",
                "type": "residential",
                "arrival_rate_tons_hr": 50,
                "service_rate_per_server": 0,
                "num_servers": 0,
            },
            {
                "id": "residential_south",
                "type": "residential",
                "arrival_rate_tons_hr": 40,
                "service_rate_per_server": 0,
                "num_servers": 0,
            },
            # ── Transfer stations ─────────────────────────────────────────────
            {
                "id": "transfer_1",
                "type": "transfer",
                "arrival_rate_tons_hr": 80,    # 4 trucks * 10 t * 2 trips/hr
                "service_rate_per_server": 30,  # tons/hr per bay
                "num_servers": 3,               # 3 processing bays
            },
            {
                "id": "transfer_2",
                "type": "transfer",
                "arrival_rate_tons_hr": 60,
                "service_rate_per_server": 25,
                "num_servers": 2,
            },
            # ── Material Recovery Facility ────────────────────────────────────
            {
                "id": "mrf_1",
                "type": "mrf",
                "arrival_rate_tons_hr": 130,   # high load — expect bottleneck
                "service_rate_per_server": 40,
                "num_servers": 2,              # total capacity 80 t/hr < 130 → saturated
            },
            # ── Terminal sinks ────────────────────────────────────────────────
            {
                "id": "landfill_1",
                "type": "landfill",
                "arrival_rate_tons_hr": 0,
                "service_rate_per_server": 60,
                "num_servers": 2,
            },
            {
                "id": "recycling_1",
                "type": "recycling",
                "arrival_rate_tons_hr": 0,
                "service_rate_per_server": 30,
                "num_servers": 1,
            },
        ],
        "edges": [
            # residential_north → transfer_1: 4 trucks * 10 t * 2 trips = 80 t/hr
            {"source": "residential_north", "target": "transfer_1",
             "distance_km": 5,  "num_trucks": 4, "truck_capacity_tons": 10, "trips_per_hour": 2},
            # residential_south → transfer_2: 3 trucks * 10 t * 2 trips = 60 t/hr
            {"source": "residential_south", "target": "transfer_2",
             "distance_km": 8,  "num_trucks": 3, "truck_capacity_tons": 10, "trips_per_hour": 2},
            # transfer_1 → mrf_1: 5 trucks * 12 t * 1.5 trips = 90 t/hr
            {"source": "transfer_1",        "target": "mrf_1",
             "distance_km": 10, "num_trucks": 5, "truck_capacity_tons": 12, "trips_per_hour": 1.5},
            # transfer_2 → mrf_1: 3 trucks * 12 t * 1.5 trips = 54 t/hr
            {"source": "transfer_2",        "target": "mrf_1",
             "distance_km": 12, "num_trucks": 3, "truck_capacity_tons": 12, "trips_per_hour": 1.5},
            # mrf_1 → landfill_1: 4 trucks * 15 t * 1 trip = 60 t/hr  ← bottleneck
            {"source": "mrf_1",             "target": "landfill_1",
             "distance_km": 15, "num_trucks": 4, "truck_capacity_tons": 15, "trips_per_hour": 1},
            # mrf_1 → recycling_1: 2 trucks * 10 t * 1 trip = 20 t/hr  ← bottleneck
            {"source": "mrf_1",             "target": "recycling_1",
             "distance_km": 10, "num_trucks": 2, "truck_capacity_tons": 10, "trips_per_hour": 1},
        ],
    }

    # ── Run the full pipeline ─────────────────────────────────────────────────
    print("=" * 65)
    print("  SIMULATION RUNNER — End-to-End Pipeline Test")
    print("=" * 65)

    result = run_full_analysis(MOCK_PAYLOAD, sim_time_hours=8)

    # ── Pretty-print the result (truncate time_series for readability) ────────
    display = {
        "node_metrics": result["node_metrics"],
        "graph_metrics": result["graph_metrics"],
        "time_series_sample": {
            "first_3_snapshots": result["time_series"][:3],
            "last_2_snapshots":  result["time_series"][-2:],
            "total_snapshots":   len(result["time_series"]),
        },
        "meta": result["meta"],
    }

    print(json.dumps(display, indent=2, default=str))

    # ── Sanity assertions ─────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  ASSERTIONS")
    print("=" * 65)

    # 1. node_metrics — mrf_1 should be saturated (rho = 130/80 = 1.625)
    mrf_metrics = next(
        (m for m in result["node_metrics"]["queuing_analysis"] if m.get("node_id") == "mrf_1"),
        None,
    )
    assert mrf_metrics is not None, "mrf_1 not found in queuing_analysis"
    assert mrf_metrics["utilization"] > 1.0, (
        f"mrf_1 utilization should be > 1.0, got {mrf_metrics['utilization']}"
    )
    assert mrf_metrics["is_bottleneck"], "mrf_1 should be flagged as bottleneck"
    print(f"  [PASS] mrf_1 utilization = {mrf_metrics['utilization']} (> 1.0, saturated)")

    # 2. node_metrics — bottleneck list should be non-empty
    assert len(result["node_metrics"]["bottleneck_nodes"]) > 0, "No bottlenecks detected"
    print(f"  [PASS] {result['node_metrics']['total_bottlenecks']} bottleneck node(s) found")

    # 3. graph_metrics — max_flow should be positive
    assert result["graph_metrics"]["max_flow"] > 0, "max_flow should be > 0"
    print(f"  [PASS] max_flow = {result['graph_metrics']['max_flow']} tons/hr")

    # 4. graph_metrics — min-cut edges should exist
    assert len(result["graph_metrics"]["bottleneck_edges"]) > 0, "No min-cut edges found"
    print(f"  [PASS] {len(result['graph_metrics']['bottleneck_edges'])} min-cut (bottleneck) edge(s)")

    # 5. time_series — should have snapshots
    assert len(result["time_series"]) > 0, "time_series is empty"
    print(f"  [PASS] {len(result['time_series'])} time-series snapshots generated")

    # 6. meta — no fatal errors
    if result["meta"]["errors"]:
        print(f"  [WARN] Non-fatal errors: {result['meta']['errors']}")
    else:
        print("  [PASS] No errors in meta.errors")

    print(f"\n  Pipeline completed in {result['meta']['duration_seconds']} seconds")
    print("=" * 65)
    print("  ALL ASSERTIONS PASSED — simulation_runner.py is ready")
    print("=" * 65)
