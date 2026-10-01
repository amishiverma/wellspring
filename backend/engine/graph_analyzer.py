"""
graph_analyzer.py — Max-Flow / Min-Cut Analysis for Waste Flow Network
Member 3: Tanishq (Core Algorithm & Simulation Scientist)

Standalone module. No FastAPI, no web routing.
Requires: networkx  (pip install networkx)

Output: plain Python dicts compatible with Vrinda's Pydantic models.

Network conventions:
  - Nodes of type 'source'              → connected FROM a virtual super-source
  - Nodes of type 'landfill' or
    'recycling'                         → connected TO a virtual super-sink
  - Edge capacity (tons/hr) = num_trucks * truck_capacity_tons * trips_per_hour
"""

import networkx as nx

# Virtual node labels — guaranteed not to collide with real node IDs
_SUPER_SOURCE = "__SUPER_SOURCE__"
_SUPER_SINK   = "__SUPER_SINK__"

# Types treated as sinks in the waste-flow network
_SINK_TYPES = {"landfill", "recycling"}
_SOURCE_TYPES = {"source"}

# Effectively-infinite capacity for super-source / super-sink edges
_INF_CAPACITY = 1_000_000.0


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _edge_capacity(edge: dict) -> float:
    """
    Derive edge capacity (tons/hr) from truck logistics parameters.

    capacity = num_trucks * truck_capacity_tons * trips_per_hour

    Falls back to an explicit 'capacity' field if logistics fields are absent.
    """
    if all(k in edge for k in ("num_trucks", "truck_capacity_tons", "trips_per_hour")):
        return (
            float(edge["num_trucks"])
            * float(edge["truck_capacity_tons"])
            * float(edge["trips_per_hour"])
        )
    # Direct override
    if "capacity" in edge:
        return float(edge["capacity"])
    raise ValueError(
        f"Edge {edge.get('source')} -> {edge.get('target')} has no capacity info. "
        "Provide (num_trucks, truck_capacity_tons, trips_per_hour) or a 'capacity' field."
    )


def _build_graph(nodes: list[dict], edges: list[dict]) -> nx.DiGraph:
    """
    Construct a directed NetworkX graph with super-source and super-sink.

    Parameters
    ----------
    nodes : list of node dicts (must have 'id' and 'type')
    edges : list of edge dicts (must have 'source', 'target', and capacity fields)

    Returns
    -------
    nx.DiGraph with capacity attributes on all edges
    """
    G = nx.DiGraph()

    # Index nodes by id for type lookups
    node_map = {n["id"]: n for n in nodes}

    # Add real nodes
    for node in nodes:
        G.add_node(node["id"], **node)

    # Add virtual terminals
    G.add_node(_SUPER_SOURCE, type="virtual")
    G.add_node(_SUPER_SINK,   type="virtual")

    # Add real edges with computed capacities
    for edge in edges:
        cap = _edge_capacity(edge)
        G.add_edge(edge["source"], edge["target"], capacity=cap)

    # Connect super-source → every source node (infinite capacity)
    for node in nodes:
        if node.get("type") in _SOURCE_TYPES:
            G.add_edge(_SUPER_SOURCE, node["id"], capacity=_INF_CAPACITY)

    # Connect every sink node → super-sink (infinite capacity)
    for node in nodes:
        if node.get("type") in _SINK_TYPES:
            G.add_edge(node["id"], _SUPER_SINK, capacity=_INF_CAPACITY)

    return G


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_max_flow(nodes: list[dict], edges: list[dict]) -> dict:
    """
    Compute the maximum throughput of the city waste-flow network and identify
    the minimum-cut edges (the hardest bottlenecks limiting flow).

    Uses the Edmonds-Karp implementation of the Ford-Fulkerson method via
    NetworkX's nx.maximum_flow (algorithm='edmonds_karp').

    Parameters
    ----------
    nodes : list[dict]
        Each dict must contain:
            id   (str | int)  — unique node identifier
            type (str)        — one of: 'source', 'transfer', 'sorting',
                                'landfill', 'recycling', etc.
        Optional fields are passed through as node attributes.

    edges : list[dict]
        Each dict must contain:
            source (str | int)  — origin node id
            target (str | int)  — destination node id

        Capacity is derived from ONE of:
            Option A (preferred):
                num_trucks          (int)   — trucks on this route
                truck_capacity_tons (float) — tons per truck
                trips_per_hour      (float) — trips per hour
            Option B (fallback):
                capacity (float)    — direct tons/hr override

    Returns
    -------
    dict with:
        max_flow_tons_per_hour (float)
            — absolute maximum throughput of the entire city network

        flow_on_edges (dict)
            — dict of dicts: flow_on_edges[u][v] = actual flow (tons/hr)
              on each edge at maximum flow (excludes super-source/sink edges)

        min_cut_value (float)
            — same as max_flow_tons_per_hour (max-flow min-cut theorem)

        minimum_cut_edges (list[dict])
            — edges that form the minimum cut, i.e., the bottleneck edges
              whose removal would disconnect source(s) from sink(s)
              Each entry: {"source": u, "target": v, "capacity": cap, "flow": f}

        node_types (dict)
            — node_id -> node type string (for debugging / frontend labelling)

    Raises
    ------
    nx.NetworkXUnbounded
        If no source or no sink nodes are found (degenerate network).
    ValueError
        If an edge is missing required capacity information.
    """
    if not nodes:
        return {
            "max_flow_tons_per_hour": 0.0,
            "flow_on_edges": {},
            "min_cut_value": 0.0,
            "minimum_cut_edges": [],
            "node_types": {},
        }

    G = _build_graph(nodes, edges)

    # Compute max-flow using Edmonds-Karp (guaranteed polynomial time)
    flow_value, flow_dict = nx.maximum_flow(
        G, _SUPER_SOURCE, _SUPER_SINK, flow_func=nx.algorithms.flow.edmonds_karp
    )

    # Compute min-cut partition: (source_side_set, sink_side_set)
    cut_value, (source_side, sink_side) = nx.minimum_cut(
        G, _SUPER_SOURCE, _SUPER_SINK, flow_func=nx.algorithms.flow.edmonds_karp
    )

    # Identify minimum-cut edges: edges from source_side → sink_side
    minimum_cut_edges = []
    for u in source_side:
        for v in sink_side:
            if G.has_edge(u, v):
                # Skip virtual super-source / super-sink connectors
                if u == _SUPER_SOURCE or v == _SUPER_SINK:
                    continue
                cap = G[u][v]["capacity"]
                actual_flow = flow_dict.get(u, {}).get(v, 0.0)
                minimum_cut_edges.append({
                    "source": u,
                    "target": v,
                    "capacity_tons_per_hour": round(cap, 4),
                    "flow_tons_per_hour": round(actual_flow, 4),
                    "utilization": round(actual_flow / cap, 4) if cap > 0 else 0.0,
                })

    # Sort by utilization descending (most constrained edges first)
    minimum_cut_edges.sort(key=lambda e: e["utilization"], reverse=True)

    # Strip virtual nodes from flow output
    clean_flow: dict = {}
    for u, targets in flow_dict.items():
        if u in (_SUPER_SOURCE, _SUPER_SINK):
            continue
        for v, f in targets.items():
            if v in (_SUPER_SOURCE, _SUPER_SINK):
                continue
            if f > 0:
                clean_flow.setdefault(str(u), {})[str(v)] = round(f, 4)

    # Node type map for the frontend / Pydantic layer
    node_types = {n["id"]: n.get("type", "unknown") for n in nodes}

    return {
        "max_flow_tons_per_hour": round(flow_value, 4),
        "flow_on_edges": clean_flow,
        "min_cut_value": round(cut_value, 4),
        "minimum_cut_edges": minimum_cut_edges,
        "node_types": node_types,
    }
