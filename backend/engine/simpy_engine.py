"""
Discrete-Event Simulation Engine for Waste Flow Time-Series Generation.

Uses SimPy to simulate waste truck arrivals, queuing, and processing at facilities.
Generates time-series data for frontend visualization (queue lengths, server utilization).

Simulation Model:
- Each facility node = simpy.Resource with capacity = num_servers
- Trucks arrive as Poisson process (exponential inter-arrival times)
- Service times are exponentially distributed
- Monitoring process records state every 0.25 hours (15 minutes)

Author: Tanishq (Core Algorithm & Simulation Scientist)
"""

from __future__ import annotations

import random
from collections import defaultdict
from typing import Any

import simpy


def create_facility_resources(env: simpy.Environment, nodes: list[dict[str, Any]]) -> dict[str, simpy.Resource]:
    """
    Create SimPy resources for each facility node.
    
    Args:
        env: SimPy environment
        nodes: List of node dictionaries
    
    Returns:
        Dict mapping node_id to simpy.Resource
    """
    resources = {}
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            continue
        
        node_type = node.get("type", "unknown")
        # Only create resources for processing facilities (not residential sources)
        if node_type in ("transfer", "mrf", "landfill", "recycling", "processing"):
            num_servers = int(node.get("num_servers", 1))
            if num_servers <= 0:
                num_servers = 1
            resources[node_id] = simpy.Resource(env, capacity=num_servers)
    
    return resources


def truck_process(
    env: simpy.Environment,
    truck_id: int,
    node_id: str,
    resource: simpy.Resource,
    service_rate: float,
    travel_time: float,
    results: dict[str, list[dict]],
) -> simpy.Event:
    """
    Simulate a single truck arriving at a facility, waiting for service, and being processed.
    
    Args:
        env: SimPy environment
        truck_id: Unique truck identifier
        node_id: Facility node ID
        resource: SimPy resource for this facility
        service_rate: Service rate (tons/hour) per server
        travel_time: Time to travel to this facility (hours)
        results: Shared results dict to record completion events
    """
    # Travel to facility
    yield env.timeout(travel_time)
    
    arrival_time = env.now
    
    # Request a server (bay/dock)
    with resource.request() as request:
        yield request  # Wait for available server
        
        wait_time = env.now - arrival_time
        
        # Service time: exponential with mean 1/service_rate hours per ton
        # Assume each truck carries ~10 tons average
        truck_load = 10.0  # tons
        service_time = random.expovariate(service_rate / truck_load) if service_rate > 0 else 0
        
        yield env.timeout(service_time)
        
        # Record completion
        completion_time = env.now
        results["completions"].append({
            "truck_id": truck_id,
            "node_id": node_id,
            "arrival_time": round(arrival_time, 4),
            "wait_time": round(wait_time, 4),
            "service_time": round(service_time, 4),
            "completion_time": round(completion_time, 4),
        })


def truck_generator(
    env: simpy.Environment,
    node_id: str,
    resource: simpy.Resource,
    arrival_rate: float,
    service_rate: float,
    travel_time: float,
    results: dict[str, list[dict]],
    max_trucks: int = 1000,
) -> simpy.Event:
    """
    Generate trucks arriving at a facility as a Poisson process.
    
    Args:
        env: SimPy environment
        node_id: Facility node ID
        resource: SimPy resource for this facility
        arrival_rate: Trucks per hour (Poisson rate)
        service_rate: Service rate per server (tons/hour)
        travel_time: Travel time to facility (hours)
        results: Shared results dict
        max_trucks: Maximum trucks to generate (safety limit)
    """
    truck_count = 0
    while truck_count < max_trucks:
        # Exponential inter-arrival time
        inter_arrival = random.expovariate(arrival_rate) if arrival_rate > 0 else float('inf')
        yield env.timeout(inter_arrival)
        
        truck_count += 1
        env.process(truck_process(
            env, truck_count, node_id, resource, service_rate, travel_time, results
        ))


def monitor_process(
    env: simpy.Environment,
    resources: dict[str, simpy.Resource],
    interval: float,
    time_series: list[dict],
) -> simpy.Event:
    """
    Monitor process that records queue lengths and server utilization at regular intervals.
    
    Args:
        env: SimPy environment
        resources: Dict of node_id -> simpy.Resource
        interval: Recording interval in hours (e.g., 0.25 for 15 min)
        time_series: List to append snapshots to
    """
    while True:
        yield env.timeout(interval)
        
        snapshot = {"time": round(env.now, 4)}
        
        for node_id, resource in resources.items():
            snapshot[f"{node_id}_queue"] = len(resource.queue)
            snapshot[f"{node_id}_active"] = resource.count
            snapshot[f"{node_id}_capacity"] = resource.capacity
            snapshot[f"{node_id}_utilization"] = round(resource.count / resource.capacity, 4) if resource.capacity > 0 else 0.0
        
        time_series.append(snapshot)


def run_simulation(
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    sim_time_hours: int = 8,
    monitor_interval_hours: float = 0.25,
    random_seed: int = 42,
) -> list[dict[str, Any]]:
    """
    Run discrete-event simulation of waste flow network.
    
    Args:
        nodes: List of node dictionaries with keys:
            - id (str): Unique node identifier
            - type (str): Node type ('residential', 'transfer', 'mrf', 'landfill', 'recycling')
            - arrival_rate_tons_hr (float): Waste arrival rate in tons/hour
            - service_rate_per_server (float): Processing rate per server in tons/hour
            - num_servers (int): Number of parallel servers
        edges: List of edge dictionaries with keys:
            - source (str): Source node ID
            - target (str): Target node ID
            - distance_km (float): Distance in kilometers
            - num_trucks (int): Number of trucks on this route
            - truck_capacity_tons (float): Capacity per truck in tons
            - trips_per_hour (float): Trips per hour per truck
        sim_time_hours: Total simulation time in hours
        monitor_interval_hours: Recording interval in hours (default 0.25 = 15 min)
        random_seed: Random seed for reproducibility
    
    Returns:
        List of time-series snapshots, each containing:
            - time: Simulation time (hours)
            - {node_id}_queue: Number of trucks waiting
            - {node_id}_active: Number of active servers
            - {node_id}_capacity: Total server capacity
            - {node_id}_utilization: Server utilization ratio
    """
    # Set random seed for reproducibility
    random.seed(random_seed)
    
    # Create SimPy environment
    env = simpy.Environment()
    
    # Create resources for processing facilities
    resources = create_facility_resources(env, nodes)
    
    # Build adjacency for travel times
    # Average truck speed: 30 km/h
    TRUCK_SPEED_KMH = 30.0
    
    edge_travel_times = {}
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        distance = float(edge.get("distance_km", 0.0))
        if source and target:
            travel_time = distance / TRUCK_SPEED_KMH
            edge_travel_times[(source, target)] = travel_time
    
    # Shared results storage
    results = {
        "completions": [],
        "time_series": [],
    }
    
    # Start monitor process
    env.process(monitor_process(env, resources, monitor_interval_hours, results["time_series"]))
    
    # Start truck generators for each facility
    # For residential nodes: generate trucks that travel to transfer stations
    # For processing nodes: trucks arrive from upstream
    
    # Map: target facility -> list of (source, edge_data)
    incoming_edges = defaultdict(list)
    for edge in edges:
        target = edge.get("target")
        if target:
            incoming_edges[target].append(edge)
    
    # For each processing facility, calculate total arrival rate from incoming edges
    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type", "unknown")
        
        if node_id not in resources:
            continue  # Not a processing facility
        
        resource = resources[node_id]
        service_rate = float(node.get("service_rate_per_server", 1.0))
        
        # Calculate total arrival rate from incoming edges
        total_arrival_rate = 0.0
        avg_travel_time = 0.0
        edge_count = 0
        
        for edge in incoming_edges.get(node_id, []):
            source = edge.get("source")
            num_trucks = int(edge.get("num_trucks", 0))
            truck_capacity = float(edge.get("truck_capacity_tons", 10.0))
            trips_per_hour = float(edge.get("trips_per_hour", 1.0))
            
            # Arrival rate in trucks/hour
            edge_arrival_rate = num_trucks * trips_per_hour
            total_arrival_rate += edge_arrival_rate
            
            # Travel time
            travel_time = edge_travel_times.get((source, node_id), 0.0)
            avg_travel_time += travel_time
            edge_count += 1
        
        if edge_count > 0:
            avg_travel_time /= edge_count
        
        # If no incoming edges but has arrival_rate_tons_hr, use that
        if total_arrival_rate == 0.0:
            arrival_tons = float(node.get("arrival_rate_tons_hr", 0.0))
            # Convert tons/hr to trucks/hr assuming 10 tons/truck
            total_arrival_rate = arrival_tons / 10.0
            avg_travel_time = 0.1  # Default short travel time
        
        if total_arrival_rate > 0:
            env.process(truck_generator(
                env, node_id, resource, total_arrival_rate, service_rate,
                avg_travel_time, results
            ))
    
    # Run simulation
    env.run(until=sim_time_hours)
    
    # Add initial snapshot at time 0 if not present
    if not results["time_series"] or results["time_series"][0]["time"] > 0:
        initial_snapshot = {"time": 0.0}
        for node_id, resource in resources.items():
            initial_snapshot[f"{node_id}_queue"] = 0
            initial_snapshot[f"{node_id}_active"] = 0
            initial_snapshot[f"{node_id}_capacity"] = resource.capacity
            initial_snapshot[f"{node_id}_utilization"] = 0.0
        results["time_series"].insert(0, initial_snapshot)
    
    return results["time_series"]


def run_simulation_simple(
    nodes: list[dict[str, Any]],
    sim_time_hours: int = 8,
    monitor_interval_hours: float = 0.25,
    random_seed: int = 42,
) -> list[dict[str, Any]]:
    """
    Simplified simulation: each facility operates independently with its own arrival rate.
    Useful for testing individual node queuing behavior.
    
    Args:
        nodes: List of node dictionaries
        sim_time_hours: Simulation duration
        monitor_interval_hours: Recording interval
        random_seed: Random seed
    
    Returns:
        Time-series snapshots
    """
    random.seed(random_seed)
    env = simpy.Environment()
    
    resources = create_facility_resources(env, nodes)
    results = {"time_series": []}
    
    env.process(monitor_process(env, resources, monitor_interval_hours, results["time_series"]))
    
    for node in nodes:
        node_id = node.get("id")
        if node_id not in resources:
            continue
        
        resource = resources[node_id]
        arrival_rate = float(node.get("arrival_rate_tons_hr", 0.0)) / 10.0  # trucks/hr
        service_rate = float(node.get("service_rate_per_server", 1.0))
        
        if arrival_rate > 0:
            env.process(truck_generator(
                env, node_id, resource, arrival_rate, service_rate, 0.0, {"completions": [], "time_series": []}
            ))
    
    env.run(until=sim_time_hours)
    
    # Add initial snapshot
    if not results["time_series"] or results["time_series"][0]["time"] > 0:
        initial_snapshot = {"time": 0.0}
        for node_id, resource in resources.items():
            initial_snapshot[f"{node_id}_queue"] = 0
            initial_snapshot[f"{node_id}_active"] = 0
            initial_snapshot[f"{node_id}_capacity"] = resource.capacity
            initial_snapshot[f"{node_id}_utilization"] = 0.0
        results["time_series"].insert(0, initial_snapshot)
    
    return results["time_series"]


def run_time_series_simulation(
    nodes: list[dict],
    edges: list[dict],
    sim_time_hours: int = 8,
) -> list[dict]:
    """
    Run a discrete-event time-series simulation of the waste-flow network.

    This is the primary public entry-point for Phase 2.
    Internally delegates to run_simulation() which builds the full SimPy
    environment with truck generators, facility resources, and the
    snapshot-collector monitor process.

    Simulation model
    ----------------
    - Each facility node (transfer / mrf / landfill / recycling) becomes a
      simpy.Resource(env, capacity=num_servers).
    - Trucks arrive as a Poisson process (exponential inter-arrivals) at a
      rate derived from the incoming edges: rate = num_trucks * trips_per_hour.
    - Service times are exponentially distributed with mean = truck_load / service_rate.
    - A snapshot_collector process yields every 0.25 hours (15 min) and
      records len(resource.queue) and resource.count for each facility.
    - Simulation runs for sim_time_hours then returns all snapshots.

    Parameters
    ----------
    nodes : list[dict]
        Each dict must have:
            id                      (str)   — unique node identifier
            type                    (str)   — 'residential'|'transfer'|'mrf'|
                                              'landfill'|'recycling'
            arrival_rate_tons_hr    (float) — waste generation rate (source nodes)
            service_rate_per_server (float) — tons/hr per processing bay
            num_servers             (int)   — number of parallel bays

    edges : list[dict]
        Each dict must have:
            source              (str)   — origin node id
            target              (str)   — destination node id
            num_trucks          (int)   — trucks on this route
            trips_per_hour      (float) — trips per hour per truck
        Optional:
            distance_km         (float) — used to compute truck travel time
            truck_capacity_tons (float) — tons per truck (default 10)

    sim_time_hours : int
        Total simulation duration in hours. Default 8 (one working shift).
        Must finish in < 2 seconds for API use; keep to <= 24 for typical networks.

    Returns
    -------
    list[dict]
        Time-series snapshots, one every 0.25 h, plus t=0 initial state.
        Each snapshot dict contains:
            time                     (float) — simulation time in hours
            {node_id}_queue          (int)   — trucks currently waiting
            {node_id}_active         (int)   — trucks currently being served
            {node_id}_capacity       (int)   — total server bays
            {node_id}_utilization    (float) — active / capacity ratio
        Only facility nodes appear (not residential source nodes).
    """
    return run_simulation(
        nodes=nodes,
        edges=edges,
        sim_time_hours=sim_time_hours,
        monitor_interval_hours=0.25,  # snapshot every 15 min
        random_seed=42,               # reproducible by default
    )


if __name__ == "__main__":
    print("=" * 60)
    print("SIMPY ENGINE - Discrete Event Simulation Demo")
    print("=" * 60)

    # ── MINIMAL 3-node / 2-edge demo (as specified) ─────────────────────────
    #
    #   source_zone ──(6 trucks/hr)──► transfer_hub ──(4 trucks/hr)──► landfill_X
    #
    print("\n--- MINIMAL 3-node, 2-edge demo (run_time_series_simulation) ---")

    mini_nodes = [
        {"id": "source_zone",  "type": "residential", "arrival_rate_tons_hr": 60,
         "service_rate_per_server": 0,  "num_servers": 0},
        {"id": "transfer_hub", "type": "transfer",    "arrival_rate_tons_hr": 0,
         "service_rate_per_server": 20, "num_servers": 3},
        {"id": "landfill_X",   "type": "landfill",    "arrival_rate_tons_hr": 0,
         "service_rate_per_server": 15, "num_servers": 2},
    ]
    mini_edges = [
        # 6 truck-trips/hr into transfer_hub
        {"source": "source_zone",  "target": "transfer_hub",
         "distance_km": 5, "num_trucks": 3, "truck_capacity_tons": 10, "trips_per_hour": 2},
        # 4 truck-trips/hr into landfill_X
        {"source": "transfer_hub", "target": "landfill_X",
         "distance_km": 8, "num_trucks": 2, "truck_capacity_tons": 10, "trips_per_hour": 2},
    ]

    mini_series = run_time_series_simulation(mini_nodes, mini_edges, sim_time_hours=4)

    print(f"  Snapshots generated : {len(mini_series)}  (expected ~17 for 4 h at 0.25 h interval)")
    print("  First 4 snapshots:")
    for snap in mini_series[:4]:
        parts = [f"t={snap['time']:.2f}h"]
        for k, v in snap.items():
            if k != "time" and ("queue" in k or "util" in k):
                parts.append(f"{k}={v}")
        print("    " + " | ".join(parts))
    print("  Last 2 snapshots:")
    for snap in mini_series[-2:]:
        parts = [f"t={snap['time']:.2f}h"]
        for k, v in snap.items():
            if k != "time" and ("queue" in k or "util" in k):
                parts.append(f"{k}={v}")
        print("    " + " | ".join(parts))
    assert len(mini_series) >= 16, f"Expected >= 16 snapshots, got {len(mini_series)}"
    print("  [ASSERT PASSED] snapshot count >= 16")
    
    # Demo nodes
    nodes = [
        {"id": "residential_north", "type": "residential", "arrival_rate_tons_hr": 50, "service_rate_per_server": 0, "num_servers": 0},
        {"id": "residential_south", "type": "residential", "arrival_rate_tons_hr": 40, "service_rate_per_server": 0, "num_servers": 0},
        {"id": "transfer_1", "type": "transfer", "arrival_rate_tons_hr": 0, "service_rate_per_server": 30, "num_servers": 3},
        {"id": "transfer_2", "type": "transfer", "arrival_rate_tons_hr": 0, "service_rate_per_server": 25, "num_servers": 2},
        {"id": "mrf_1", "type": "mrf", "arrival_rate_tons_hr": 0, "service_rate_per_server": 40, "num_servers": 2},
        {"id": "landfill_1", "type": "landfill", "arrival_rate_tons_hr": 0, "service_rate_per_server": 60, "num_servers": 2},
    ]
    
    edges = [
        {"source": "residential_north", "target": "transfer_1", "distance_km": 5, "num_trucks": 4, "truck_capacity_tons": 10, "trips_per_hour": 2},
        {"source": "residential_south", "target": "transfer_2", "distance_km": 8, "num_trucks": 3, "truck_capacity_tons": 10, "trips_per_hour": 2},
        {"source": "transfer_1", "target": "mrf_1", "distance_km": 10, "num_trucks": 5, "truck_capacity_tons": 12, "trips_per_hour": 1.5},
        {"source": "transfer_2", "target": "mrf_1", "distance_km": 12, "num_trucks": 3, "truck_capacity_tons": 12, "trips_per_hour": 1.5},
        {"source": "mrf_1", "target": "landfill_1", "distance_km": 15, "num_trucks": 4, "truck_capacity_tons": 15, "trips_per_hour": 1},
    ]
    
    print("\n--- Running Full Network Simulation (8 hours) ---")
    print("Monitoring every 0.25 hours (15 minutes)...")
    
    time_series = run_simulation(nodes, edges, sim_time_hours=8, monitor_interval_hours=0.25, random_seed=42)
    
    print(f"\nGenerated {len(time_series)} snapshots")
    print("\nFirst 5 snapshots:")
    for snap in time_series[:5]:
        # Pretty print key metrics
        parts = [f"t={snap['time']:.2f}h"]
        for k, v in snap.items():
            if k != "time" and ("queue" in k or "util" in k):
                parts.append(f"{k}={v}")
        print("  " + " | ".join(parts))
    
    print("\nLast 5 snapshots:")
    for snap in time_series[-5:]:
        parts = [f"t={snap['time']:.2f}h"]
        for k, v in snap.items():
            if k != "time" and ("queue" in k or "util" in k):
                parts.append(f"{k}={v}")
        print("  " + " ".join(parts))
    
    # Summary stats
    print("\n--- Summary Statistics ---")
    for node in nodes:
        node_id = node.get("id")
        if node_id in ["transfer_1", "transfer_2", "mrf_1", "landfill_1"]:
            queues = [s.get(f"{node_id}_queue", 0) for s in time_series]
            utils = [s.get(f"{node_id}_utilization", 0) for s in time_series]
            actives = [s.get(f"{node_id}_active", 0) for s in time_series]
            
            avg_queue = sum(queues) / len(queues) if queues else 0
            max_queue = max(queues) if queues else 0
            avg_util = sum(utils) / len(utils) if utils else 0
            avg_active = sum(actives) / len(actives) if actives else 0
            
            print(f"  {node_id}: avg_queue={avg_queue:.2f}, max_queue={max_queue}, avg_util={avg_util:.1%}, avg_active={avg_active:.1f}")
    
    print("\n--- Running Simple Independent Node Simulation ---")
    simple_series = run_simulation_simple(nodes, sim_time_hours=4, monitor_interval_hours=0.25, random_seed=42)
    print(f"Generated {len(simple_series)} snapshots")
    
    for snap in simple_series[:3]:
        parts = [f"t={snap['time']:.2f}h"]
        for k, v in snap.items():
            if k != "time" and ("queue" in k or "util" in k):
                parts.append(f"{k}={v}")
        print("  " + " | ".join(parts))
    
    print("\n[OK] All tests passed!")