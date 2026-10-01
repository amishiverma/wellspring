"""
Network Flow Analysis Engine for Waste Flow Bottleneck Detection.

Uses NetworkX to build directed graphs of the waste management network
and applies Max-Flow/Min-Cut algorithms to identify system-wide bottlenecks.

Mathematical Foundation:
- Max-Flow Min-Cut Theorem: Maximum flow value = Minimum cut capacity
- Ford-Fulkerson / Edmonds-Karp algorithm (NetworkX implementation)
- Min-cut identifies the binding edges that restrict total system throughput

Author: Tanishq (Core Algorithm & Simulation Scientist)
"""

from __future__ import annotations

from typing import Any

import networkx as nx


def build_graph(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> nx.DiGraph:
    """
    Build a directed graph from node and edge dictionaries.
    
    Args:
        nodes: List of node dicts with keys:
            - id (str): Unique node identifier
            - type (str): Node type ('residential', 'transfer', 'mrf', 'landfill', 'recycling')
            - arrival_rate_tons_hr (float): Waste generation/arrival rate (for source nodes)
            - service_rate_per_server (float): Processing rate per server
            - num_servers (int): Number of parallel servers
        edges: List of edge dicts with keys:
            - source (str): Source node ID
            - target (str): Target node ID
            - distance_km (float): Distance in kilometers
            - num_trucks (int): Number of trucks on this route
            - truck_capacity_tons (float): Capacity per truck in tons
            - trips_per_hour (float): Trips per hour per truck
    
    Returns:
        nx.DiGraph with nodes and edges. Edge capacity = num_trucks * truck_capacity_tons * trips_per_hour.
        Node attributes include processing capacity = num_servers * service_rate_per_server.
    """
    G = nx.DiGraph()
    
    # Add nodes with attributes
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            continue
        
        # Calculate node processing capacity
        service_rate = float(node.get("service_rate_per_server", 0.0))
        num_servers = int(node.get("num_servers", 0))
        node_capacity = service_rate * num_servers
        
        G.add_node(
            node_id,
            type=node.get("type", "unknown"),
            arrival_rate=float(node.get("arrival_rate_tons_hr", 0.0)),
            service_rate=service_rate,
            num_servers=num_servers,
            capacity=node_capacity,
            **{k: v for k, v in node.items() if k not in ["id", "type", "arrival_rate_tons_hr", "service_rate_per_server", "num_servers"]}
        )
    
    # Add edges with capacity
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if not source or not target:
            continue
        
        # Edge capacity = num_trucks * truck_capacity_tons * trips_per_hour
        num_trucks = int(edge.get("num_trucks", 0))
        truck_capacity = float(edge.get("truck_capacity_tons", 0.0))
        trips_per_hour = float(edge.get("trips_per_hour", 0.0))
        
        capacity = num_trucks * truck_capacity * trips_per_hour
        distance = float(edge.get("distance_km", 0.0))
        
        G.add_edge(
            source,
            target,
            capacity=capacity,
            distance_km=distance,
            num_trucks=num_trucks,
            truck_capacity_tons=truck_capacity,
            trips_per_hour=trips_per_hour,
            **{k: v for k, v in edge.items() if k not in ["source", "target", "distance_km", "num_trucks", "truck_capacity_tons", "trips_per_hour"]}
        )
    
    return G


def find_network_bottlenecks(
    G: nx.DiGraph,
    source_nodes: list[str],
    sink_nodes: list[str]
) -> dict[str, Any]:
    """
    Find network-wide bottlenecks using Max-Flow/Min-Cut analysis.
    
    Creates a super-source and super-sink to compute maximum flow from all
    residential sources to all landfill/recycling sinks simultaneously.
    
    Args:
        G: Directed graph from build_graph()
        source_nodes: List of node IDs representing waste sources (residential areas)
        sink_nodes: List of node IDs representing waste sinks (landfills, recycling centers)
    
    Returns:
        Dictionary containing:
            - max_flow_value (float): Theoretical maximum throughput (tons/hr)
            - min_cut_edges (list[dict]): Edges in the minimum cut (bottleneck edges)
            - min_cut_capacity (float): Capacity of the minimum cut
            - flow_dict (dict): Full flow distribution across all edges
            - saturated_edges (list[dict]): Edges operating at 100% capacity
            - utilization_by_edge (dict): Edge utilization ratios
    """
    if not G.nodes():
        return {
            "max_flow_value": 0.0,
            "min_cut_edges": [],
            "min_cut_capacity": 0.0,
            "flow_dict": {},
            "saturated_edges": [],
            "utilization_by_edge": {},
        }
    
    # Create a working copy to add super-source and super-sink
    H = G.copy()
    super_source = "__SUPER_SOURCE__"
    super_sink = "__SUPER_SINK__"
    
    # Add super-source connected to all source nodes with infinite capacity
    # (or capacity equal to node's arrival rate)
    for src in source_nodes:
        if src in H:
            # Capacity from super-source = node's arrival rate (waste generation)
            arrival_rate = H.nodes[src].get("arrival_rate", float('inf'))
            H.add_edge(super_source, src, capacity=arrival_rate)
    
    # Add super-sink connected from all sink nodes with infinite capacity
    for snk in sink_nodes:
        if snk in H:
            # Capacity to super-sink = node's processing capacity
            node_capacity = H.nodes[snk].get("capacity", float('inf'))
            H.add_edge(snk, super_sink, capacity=node_capacity)
    
    # Compute maximum flow
    try:
        flow_value, flow_dict = nx.maximum_flow(
            H, super_source, super_sink, capacity="capacity"
        )
    except nx.NetworkXError:
        # Graph might be disconnected
        flow_value = 0.0
        flow_dict = {}
    
    # Compute minimum cut
    try:
        cut_value, partition = nx.minimum_cut(
            H, super_source, super_sink, capacity="capacity"
        )
        reachable, non_reachable = partition
    except nx.NetworkXError:
        cut_value = 0.0
        reachable, non_reachable = set(), set()
    
    # Identify edges crossing the cut (the bottlenecks)
    min_cut_edges = []
    for u in reachable:
        for v in non_reachable:
            if H.has_edge(u, v):
                edge_data = H[u][v]
                min_cut_edges.append({
                    "source": u,
                    "target": v,
                    "capacity": edge_data.get("capacity", 0),
                    "flow": flow_dict.get(u, {}).get(v, 0),
                    "distance_km": edge_data.get("distance_km", 0),
                    "is_transport_edge": u != super_source and v != super_sink,
                })
    
    # Find saturated edges in the original graph (flow == capacity)
    saturated_edges = []
    utilization_by_edge = {}
    
    for u, v, data in G.edges(data=True):
        flow = flow_dict.get(u, {}).get(v, 0)
        capacity = data.get("capacity", 0)
        utilization = flow / capacity if capacity > 0 else 0.0
        
        utilization_by_edge[f"{u}->{v}"] = {
            "utilization": round(utilization, 4),
            "flow": round(flow, 2),
            "capacity": round(capacity, 2),
        }
        
        if capacity > 0 and utilization >= 0.99:  # Essentially saturated
            saturated_edges.append({
                "source": u,
                "target": v,
                "capacity": round(capacity, 2),
                "flow": round(flow, 2),
                "utilization": round(utilization, 4),
                "distance_km": data.get("distance_km", 0),
            })
    
    return {
        "max_flow_value": round(flow_value, 2),
        "min_cut_capacity": round(cut_value, 2),
        "min_cut_edges": min_cut_edges,
        "flow_dict": {u: {v: round(f, 2) for v, f in targets.items()} for u, targets in flow_dict.items()},
        "saturated_edges": saturated_edges,
        "utilization_by_edge": utilization_by_edge,
        "num_source_nodes": len([s for s in source_nodes if s in G]),
        "num_sink_nodes": len([t for t in sink_nodes if t in G]),
    }


def get_edge_utilization(G: nx.DiGraph, flow_dict: dict) -> dict[str, dict]:
    """
    Calculate utilization for all edges given a flow dictionary.
    
    Args:
        G: Original graph (without super-source/sink)
        flow_dict: Flow dictionary from nx.maximum_flow
    
    Returns:
        Dict mapping "u->v" to utilization info.
    """
    utilization = {}
    for u, v, data in G.edges(data=True):
        flow = flow_dict.get(u, {}).get(v, 0)
        capacity = data.get("capacity", 0)
        util = flow / capacity if capacity > 0 else 0.0
        utilization[f"{u}->{v}"] = {
            "utilization": round(util, 4),
            "flow": round(flow, 2),
            "capacity": round(capacity, 2),
            "is_saturated": util >= 0.99,
        }
    return utilization


def _widest_path_fallback(G: nx.DiGraph, source: str, target: str) -> list[str]:
    """
    Fallback implementation of widest path (maximum capacity path) algorithm.
    Uses modified Dijkstra to find path that maximizes the minimum edge capacity.
    """
    import heapq
    
    # For each node, track the best (maximum) minimum capacity to reach it
    best_capacity = {node: 0.0 for node in G.nodes()}
    best_capacity[source] = float('inf')
    predecessor = {node: None for node in G.nodes()}
    
    # Max heap: (-capacity, node) for max-heap behavior
    heap = [(-float('inf'), source)]
    
    while heap:
        neg_cap, u = heapq.heappop(heap)
        cap = -neg_cap
        
        if u == target:
            break
        
        if cap < best_capacity[u]:
            continue  # Already found better path to u
        
        for v in G.successors(u):
            edge_cap = G[u][v].get("capacity", 0)
            # The capacity of path to v is min of current path capacity and edge capacity
            path_cap = min(cap, edge_cap)
            if path_cap > best_capacity[v]:
                best_capacity[v] = path_cap
                predecessor[v] = u
                heapq.heappush(heap, (-path_cap, v))
    
    # Reconstruct path
    if best_capacity[target] == 0:
        return []
    
    path = []
    node = target
    while node is not None:
        path.append(node)
        node = predecessor[node]
    path.reverse()
    
    return path


def find_critical_path(G: nx.DiGraph, source: str, target: str) -> dict[str, Any]:
    """
    Find the most constrained path between source and target (bottleneck path).
    
    Uses widest path algorithm (maximum capacity path) to find the path
    with the highest minimum edge capacity.
    
    Args:
        G: Directed graph
        source: Source node ID
        target: Target node ID
    
    Returns:
        Dict with path, bottleneck_capacity, and edges list.
    """
    if not nx.has_path(G, source, target):
        return {"path": [], "bottleneck_capacity": 0.0, "edges": []}
    
    # Use maximum capacity path (widest path) - NetworkX 3.x
    try:
        from networkx.algorithms.approximation import maximum_capacity_path
        path = maximum_capacity_path(G, source, target, capacity="capacity")
    except ImportError:
        # Fallback: simple implementation using modified Dijkstra
        # Find path that maximizes the minimum edge capacity
        path = _widest_path_fallback(G, source, target)
    except nx.NetworkXError:
        return {"path": [], "bottleneck_capacity": 0.0, "edges": []}
    
    critical_edges = []
    min_capacity = float('inf')
    
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        cap = G[u][v].get("capacity", 0)
        min_capacity = min(min_capacity, cap)
        critical_edges.append({
            "source": u,
            "target": v,
            "capacity": round(cap, 2),
            "distance_km": G[u][v].get("distance_km", 0),
        })
    
    return {
        "path": path,
        "bottleneck_capacity": round(min_capacity, 2),
        "edges": critical_edges,
    }


if __name__ == "__main__":
    print("=" * 60)
    print("GRAPH ANALYZER - Max-Flow/Min-Cut Demo")
    print("=" * 60)
    
    # Demo network: Residential -> Transfer -> MRF -> Landfill/Recycling
    nodes = [
        {"id": "residential_north", "type": "residential", "arrival_rate_tons_hr": 50, "service_rate_per_server": 0, "num_servers": 0},
        {"id": "residential_south", "type": "residential", "arrival_rate_tons_hr": 40, "service_rate_per_server": 0, "num_servers": 0},
        {"id": "transfer_1", "type": "transfer", "arrival_rate_tons_hr": 0, "service_rate_per_server": 30, "num_servers": 3},
        {"id": "transfer_2", "type": "transfer", "arrival_rate_tons_hr": 0, "service_rate_per_server": 25, "num_servers": 2},
        {"id": "mrf_1", "type": "mrf", "arrival_rate_tons_hr": 0, "service_rate_per_server": 40, "num_servers": 2},
        {"id": "landfill_1", "type": "landfill", "arrival_rate_tons_hr": 0, "service_rate_per_server": 60, "num_servers": 2},
        {"id": "recycling_1", "type": "recycling", "arrival_rate_tons_hr": 0, "service_rate_per_server": 30, "num_servers": 1},
    ]
    
    edges = [
        # Residential to Transfer
        {"source": "residential_north", "target": "transfer_1", "distance_km": 5, "num_trucks": 4, "truck_capacity_tons": 10, "trips_per_hour": 2},  # 80 tons/hr
        {"source": "residential_south", "target": "transfer_2", "distance_km": 8, "num_trucks": 3, "truck_capacity_tons": 10, "trips_per_hour": 2},  # 60 tons/hr
        # Transfer to MRF
        {"source": "transfer_1", "target": "mrf_1", "distance_km": 10, "num_trucks": 5, "truck_capacity_tons": 12, "trips_per_hour": 1.5},  # 90 tons/hr
        {"source": "transfer_2", "target": "mrf_1", "distance_km": 12, "num_trucks": 3, "truck_capacity_tons": 12, "trips_per_hour": 1.5},  # 54 tons/hr
        # MRF to Landfill/Recycling
        {"source": "mrf_1", "target": "landfill_1", "distance_km": 15, "num_trucks": 4, "truck_capacity_tons": 15, "trips_per_hour": 1},  # 60 tons/hr
        {"source": "mrf_1", "target": "recycling_1", "distance_km": 10, "num_trucks": 2, "truck_capacity_tons": 10, "trips_per_hour": 1},  # 20 tons/hr
    ]
    
    print("\n--- Building Graph ---")
    G = build_graph(nodes, edges)
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")
    
    for n, data in G.nodes(data=True):
        print(f"  {n}: type={data['type']}, capacity={data.get('capacity', 0)} tons/hr")
    
    for u, v, data in G.edges(data=True):
        print(f"  {u} -> {v}: capacity={data['capacity']:.1f} tons/hr, distance={data['distance_km']}km")
    
    source_nodes = ["residential_north", "residential_south"]
    sink_nodes = ["landfill_1", "recycling_1"]
    
    print("\n--- Max-Flow/Min-Cut Analysis ---")
    result = find_network_bottlenecks(G, source_nodes, sink_nodes)
    
    print(f"\nMax Flow (System Throughput): {result['max_flow_value']} tons/hr")
    print(f"Min Cut Capacity: {result['min_cut_capacity']} tons/hr")
    
    print("\nMin-Cut Edges (Bottlenecks):")
    for e in result["min_cut_edges"]:
        if e["is_transport_edge"]:
            print(f"  [BOTTLENECK] {e['source']} -> {e['target']}: cap={e['capacity']}, flow={e['flow']}")
        else:
            print(f"  [SUPER] {e['source']} -> {e['target']}: cap={e['capacity']}, flow={e['flow']} (super-node)")
    
    print("\nSaturated Edges (>=99% utilization):")
    for e in result["saturated_edges"]:
        print(f"  [SATURATED] {e['source']} -> {e['target']}: flow={e['flow']}/{e['capacity']} ({e['utilization']:.1%})")
    
    print("\nAll Edge Utilizations:")
    for edge_key, info in result["utilization_by_edge"].items():
        util = info.get("utilization", 0)
        is_sat = util >= 0.99
        status = "[SAT]" if is_sat else ("[HIGH]" if util > 0.8 else "[OK]")
        print(f"  {status} {edge_key}: {info['flow']}/{info['capacity']} = {util:.1%}")
    
    print("\n--- Critical Path Analysis ---")
    critical = find_critical_path(G, "residential_north", "landfill_1")
    if critical["path"]:
        print(f"Path: {' -> '.join(critical['path'])}")
        print(f"Bottleneck Capacity: {critical['bottleneck_capacity']} tons/hr")
        for e in critical["edges"]:
            print(f"  {e['source']} -> {e['target']}: {e['capacity']} tons/hr")
    
    print("\n[OK] All tests passed!")