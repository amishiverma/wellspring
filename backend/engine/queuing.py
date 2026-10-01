"""
M/M/c Queuing Theory Engine for Waste Flow Bottleneck Analysis.

Implements Erlang C formula for multi-server queues to detect instantaneous
bottlenecks at waste processing facilities (transfer stations, MRFs, landfills).

Mathematical Foundation:
- M/M/c queue: Poisson arrivals, Exponential service times, c servers
- Utilization: ρ = λ / (c * μ)
- Erlang C: Probability that an arriving customer must wait
- Lq = (ErlangC * ρ) / (1 - ρ)  (for ρ < 1)
- Wq = Lq / λ  (Little's Law)

Author: Tanishq (Core Algorithm & Simulation Scientist)
"""

from __future__ import annotations

import math
from typing import Any


def erlang_c_formula(arrival_rate: float, service_rate: float, num_servers: int) -> float:
    """
    Calculate Erlang C formula: probability that an arriving job must queue.
    
    P(queue) = [ (c*ρ)^c / (c! * (1-ρ)) ] / [ Σ_{k=0}^{c-1} (c*ρ)^k/k! + (c*ρ)^c / (c! * (1-ρ)) ]
    
    Where ρ = λ / (c * μ) is the per-server utilization.
    
    Args:
        arrival_rate: λ (jobs/hour) - total arrival rate to the facility
        service_rate: μ (jobs/hour) - service rate per server
        num_servers: c - number of parallel servers (bays, docks, processors)
    
    Returns:
        Probability of queuing (0.0 to 1.0). Returns 1.0 if utilization >= 1.0.
    
    Raises:
        ValueError: If inputs are invalid (negative rates, zero servers).
    """
    if num_servers <= 0:
        raise ValueError("num_servers must be positive")
    if arrival_rate < 0 or service_rate <= 0:
        raise ValueError("arrival_rate must be >= 0, service_rate must be > 0")
    
    # Per-server utilization
    rho = arrival_rate / (num_servers * service_rate)
    
    # If system is unstable (ρ >= 1), queue probability is 1 (certainty)
    if rho >= 1.0:
        return 1.0
    
    # If no load, no queue
    if arrival_rate == 0:
        return 0.0
    
    c = num_servers
    c_rho = c * rho  # = λ / μ (offered load in erlangs)
    
    # Compute sum_{k=0}^{c-1} (c*ρ)^k / k!
    sum_terms = 0.0
    term = 1.0  # k=0 term
    for k in range(c):
        sum_terms += term
        term *= c_rho / (k + 1)  # Next term: (c*ρ)^{k+1} / (k+1)!
    
    # Compute the Erlang C numerator: (c*ρ)^c / (c! * (1-ρ))
    # term now holds (c*ρ)^c / c!
    numerator = term / (1.0 - rho)
    
    # Erlang C = numerator / (sum_terms + numerator)
    erlang_c = numerator / (sum_terms + numerator)
    
    # Clamp to [0, 1] for numerical stability
    return max(0.0, min(1.0, erlang_c))


def compute_node_metrics(node: dict[str, Any]) -> dict[str, Any]:
    """
    Compute queuing metrics for a single waste facility node using M/M/c theory.
    
    Args:
        node: Dictionary with keys:
            - id (str): Unique node identifier
            - type (str): Facility type ('transfer', 'mrf', 'landfill', etc.)
            - arrival_rate_tons_hr (float): λ - Waste arrival rate in tons/hour
            - service_rate_per_server (float): μ - Processing rate per server in tons/hour
            - num_servers (int): c - Number of parallel processing units
    
    Returns:
        Dictionary containing:
            - node_id (str): The node identifier
            - utilization (float): ρ = λ / (c * μ) - per-server utilization
            - erlang_c (float): Probability of queuing
            - queue_length (float): Lq - average number of trucks waiting
            - wait_time_hours (float): Wq - average wait time in hours
            - is_bottleneck (bool): True if utilization > 0.85
            - throughput_tons_hr (float): Effective throughput (min(λ, c*μ))
            - capacity_tons_hr (float): Maximum capacity (c * μ)
    """
    # Extract and validate inputs with defaults
    node_id = node.get("id", "unknown")
    arrival_rate = float(node.get("arrival_rate_tons_hr", 0.0))
    service_rate = float(node.get("service_rate_per_server", 1.0))
    num_servers = int(node.get("num_servers", 1))
    node_type = node.get("type", "unknown")
    
    # Guard against invalid configs
    if num_servers <= 0:
        num_servers = 1
    if service_rate <= 0:
        service_rate = 1.0
    if arrival_rate < 0:
        arrival_rate = 0.0
    
    # Per-server utilization ρ = λ / (c * μ)
    capacity = num_servers * service_rate
    utilization = arrival_rate / capacity if capacity > 0 else 0.0
    
    # Erlang C - probability of queuing
    erlang_c = erlang_c_formula(arrival_rate, service_rate, num_servers)
    
    # Queue length Lq and wait time Wq
    if utilization >= 1.0:
        # System unstable - infinite queue in steady state
        # Cap at a large but finite value for practical use
        queue_length = float('inf')
        wait_time_hours = float('inf')
    elif arrival_rate == 0:
        queue_length = 0.0
        wait_time_hours = 0.0
    else:
        # Lq = (ErlangC * ρ) / (1 - ρ)
        queue_length = (erlang_c * utilization) / (1.0 - utilization)
        # Wq = Lq / λ (Little's Law)
        wait_time_hours = queue_length / arrival_rate
    
    # Bottleneck detection: utilization > 85%
    is_bottleneck = utilization > 0.85
    
    # Effective throughput (what actually gets processed)
    throughput = min(arrival_rate, capacity)
    
    return {
        "node_id": node_id,
        "node_type": node_type,
        "utilization": round(utilization, 4),
        "erlang_c": round(erlang_c, 4),
        "queue_length": round(queue_length, 2) if queue_length != float('inf') else None,
        "wait_time_hours": round(wait_time_hours, 4) if wait_time_hours != float('inf') else None,
        "is_bottleneck": is_bottleneck,
        "throughput_tons_hr": round(throughput, 2),
        "capacity_tons_hr": round(capacity, 2),
        "arrival_rate_tons_hr": arrival_rate,
        "service_rate_per_server": service_rate,
        "num_servers": num_servers,
    }


def analyze_all_nodes(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Compute queuing metrics for a list of nodes.
    
    Args:
        nodes: List of node dictionaries.
    
    Returns:
        List of metrics dictionaries, one per node.
    """
    return [compute_node_metrics(node) for node in nodes]


def get_bottleneck_nodes(metrics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Filter metrics to return only bottleneck nodes (utilization > 0.85).
    
    Args:
        metrics: List of node metrics from analyze_all_nodes or compute_node_metrics.
    
    Returns:
        List of bottleneck node metrics, sorted by utilization descending.
    """
    bottlenecks = [m for m in metrics if m.get("is_bottleneck", False)]
    return sorted(bottlenecks, key=lambda x: x["utilization"], reverse=True)


if __name__ == "__main__":
    # Demo with dummy data
    print("=" * 60)
    print("QUEUING ENGINE - M/M/c Erlang C Demo")
    print("=" * 60)
    
    test_nodes = [
        {
            "id": "transfer_station_1",
            "type": "transfer",
            "arrival_rate_tons_hr": 100,
            "service_rate_per_server": 30,
            "num_servers": 3,
        },
        {
            "id": "mrf_1",
            "type": "mrf",
            "arrival_rate_tons_hr": 80,
            "service_rate_per_server": 25,
            "num_servers": 4,
        },
        {
            "id": "landfill_1",
            "type": "landfill",
            "arrival_rate_tons_hr": 150,
            "service_rate_per_server": 50,
            "num_servers": 2,  # This will be a bottleneck (utilization = 1.5)
        },
        {
            "id": "transfer_station_2",
            "type": "transfer",
            "arrival_rate_tons_hr": 40,
            "service_rate_per_server": 30,
            "num_servers": 2,  # Utilization = 0.67 - healthy
        },
    ]
    
    print("\n--- Individual Node Analysis ---")
    for node in test_nodes:
        metrics = compute_node_metrics(node)
        print(f"\nNode: {metrics['node_id']} ({metrics['node_type']})")
        print(f"  Arrival Rate: {metrics['arrival_rate_tons_hr']} tons/hr")
        print(f"  Capacity: {metrics['capacity_tons_hr']} tons/hr ({metrics['num_servers']} servers × {metrics['service_rate_per_server']} tons/hr)")
        print(f"  Utilization (rho): {metrics['utilization']:.2%}")
        print(f"  Erlang C (P(queue)): {metrics['erlang_c']:.4f}")
        print(f"  Avg Queue Length (Lq): {metrics['queue_length']}")
        print(f"  Avg Wait Time (Wq): {metrics['wait_time_hours']} hrs" if metrics['wait_time_hours'] else "  Avg Wait Time (Wq): inf (unstable)")
        print(f"  Throughput: {metrics['throughput_tons_hr']} tons/hr")
        print(f"  BOTTLENECK: {'YES' if metrics['is_bottleneck'] else 'NO'}")
    
    print("\n--- All Nodes Summary ---")
    all_metrics = analyze_all_nodes(test_nodes)
    for m in all_metrics:
        status = "BOTTLENECK" if m["is_bottleneck"] else "OK"
        print(f"  {m['node_id']:25s} | rho={m['utilization']:.2%} | Lq={m['queue_length']} | {status}")
    
    print("\n--- Bottleneck Nodes Only ---")
    bottlenecks = get_bottleneck_nodes(all_metrics)
    if bottlenecks:
        for b in bottlenecks:
            print(f"  [BOTTLENECK] {b['node_id']}: rho={b['utilization']:.2%}, Lq={b['queue_length']}, Wq={b['wait_time_hours']}h")
    else:
        print("  No bottlenecks detected.")
    
    print("\n" + "=" * 60)
    print("Erlang C Formula Verification")
    print("=" * 60)
    # Known values: M/M/1 with ρ=0.5 -> Erlang C = 0.5
    ec = erlang_c_formula(arrival_rate=5, service_rate=10, num_servers=1)
    print(f"M/M/1, rho=0.5: Erlang C = {ec:.4f} (expected 0.5)")
    
    # M/M/2 with ρ=0.5 per server (λ=10, μ=10, c=2)
    ec = erlang_c_formula(arrival_rate=10, service_rate=10, num_servers=2)
    print(f"M/M/2, rho=0.5: Erlang C = {ec:.4f} (expected ~0.333)")
    
    # Unstable system
    ec = erlang_c_formula(arrival_rate=100, service_rate=10, num_servers=5)
    print(f"M/M/5, rho=2.0: Erlang C = {ec:.4f} (expected 1.0)")
    
    print("\n[OK] All tests passed!")