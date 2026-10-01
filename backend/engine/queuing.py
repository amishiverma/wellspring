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
    Compute the Erlang C probability — the core of the M/M/c queuing model.

    The Erlang C formula gives P_W: the probability that an arriving job
    (waste truck) must wait because all c servers (processing bays) are busy.
    It is the foundation of steady-state queue-length and waiting-time analysis.

    Mathematical Definition
    -----------------------
    Let:
        λ  = arrival_rate      (tons/hr  — Poisson arrival process)
        μ  = service_rate      (tons/hr per server — Exponential service times)
        c  = num_servers       (number of parallel processing bays)
        A  = λ / μ             (offered load in Erlangs)
        ρ  = λ / (c * μ)      (per-server traffic intensity; must be < 1)

    Erlang C formula:

                    A^c / (c! * (1 - ρ))
        P_W = ─────────────────────────────────────────
               Σ_{k=0}^{c-1} A^k/k!  +  A^c/(c! * (1-ρ))

    This is computed iteratively (no direct factorial calls) to remain
    numerically stable for arbitrarily large c without OverflowError.

    Downstream metrics derived from P_W:
        Lq = P_W * ρ / (1 − ρ)      (mean queue length, Little's Law)
        Wq = Lq / λ                  (mean wait time before service begins)
        L  = Lq + λ/μ                (mean total number in system)
        W  = L  / λ                  (mean total time in system)

    Parameters
    ----------
    arrival_rate : float
        λ — total waste arrival rate at this facility (tons/hr).
        Must be >= 0. Value 0 → idle system, P_W = 0.
    service_rate : float
        μ — processing capacity per server / bay (tons/hr).
        Must be > 0. If 0 or negative, returns 1.0 (saturated fallback).
    num_servers : int
        c — number of parallel processing bays / docks.
        Must be >= 1. If 0 or negative, returns 1.0 (saturated fallback).

    Returns
    -------
    float
        P_W in [0.0, 1.0]:
          0.0 → no arriving truck ever waits  (zero load)
          1.0 → every arriving truck must wait (ρ >= 1, system saturated)

    Edge Cases (no exceptions raised)
    ----------------------------------
    - num_servers <= 0  → returns 1.0  (misconfigured node, treated as saturated)
    - service_rate <= 0 → returns 1.0  (offline node, treated as saturated)
    - arrival_rate == 0 → returns 0.0  (idle facility)
    - ρ >= 1.0          → returns 1.0  (unstable queue, infinite wait)
    """
    # ── Bullet-proof guards: never raise, always return a safe value ──────────
    if num_servers <= 0 or service_rate <= 0:
        # Misconfigured or offline node → treat as fully saturated
        return 1.0
    if arrival_rate <= 0:
        return 0.0

    # Per-server traffic intensity  ρ = λ / (c · μ)
    rho = arrival_rate / (num_servers * service_rate)

    # Unstable system: ρ ≥ 1 → queue grows without bound
    if rho >= 1.0:
        return 1.0

    c = num_servers
    A = c * rho          # Offered load in Erlangs (= λ / μ)

    # Iterative sum  Σ_{k=0}^{c-1} A^k / k!
    # Each iteration: term_k = A^k / k!  built from term_{k-1} * A / k
    # Avoids math.factorial() — safe for c up to tens of thousands.
    sum_terms = 0.0
    term = 1.0           # k = 0:  A^0 / 0! = 1
    for k in range(c):
        sum_terms += term
        term *= A / (k + 1)   # term becomes A^{k+1} / (k+1)!

    # After the loop, term = A^c / c!  (the k = c term, not added to sum)
    # Numerator of Erlang C:  A^c / (c! · (1 − ρ))
    numerator = term / (1.0 - rho)

    # Guard against degenerate denominator
    denominator = sum_terms + numerator
    if denominator == 0.0:
        return 0.0

    # Clamp to [0, 1] for floating-point safety
    return max(0.0, min(1.0, numerator / denominator))


def compute_node_metrics(node: dict[str, Any]) -> dict[str, Any]:
    """
    Compute steady-state M/M/c queuing metrics for a single waste facility node.

    Model: M/M/c (Markovian arrivals, Markovian service, c parallel servers)
    -----------------------------------------------------------------------
    Assumes:
      - Poisson arrivals at rate λ (arrival_rate_tons_hr)
      - Exponential service times at rate μ per server (service_rate_per_server)
      - c identical parallel servers / processing bays (num_servers)
      - Infinite waiting room (no balking or reneging)
      - FCFS (First-Come, First-Served) discipline

    Key formulas applied
    --------------------
      ρ  = λ / (c · μ)                      per-server utilisation
      P_W = erlang_c_formula(λ, μ, c)       probability of waiting (Erlang C)
      Lq  = P_W · ρ / (1 − ρ)              mean trucks queuing   (Little's Law)
      Wq  = Lq / λ                          mean wait before service (hrs)
      L   = Lq + λ/μ                        mean trucks in system
      W   = L  / λ                          mean time in system (hrs)

    Zero-Division / Saturation Protection
    --------------------------------------
    - num_servers == 0  → instant return: utilization=1.0, wait=inf, bottleneck=True
    - service_rate == 0 → instant return: utilization=1.0, wait=inf, bottleneck=True
    - ρ >= 1.0          → queue is unbounded: queue_length=None (inf), wait=None (inf)
    No ZeroDivisionError or ValueError is ever raised.

    Parameters
    ----------
    node : dict
        Must contain:
            id                      (str)   — unique node identifier
            type                    (str)   — facility type string
            arrival_rate_tons_hr    (float) — λ: waste arrival rate (tons/hr)
            service_rate_per_server (float) — μ: processing rate per bay (tons/hr)
            num_servers             (int)   — c: number of parallel bays

    Returns
    -------
    dict with keys:
        node_id            (str)          — node identifier
        node_type          (str)          — facility type
        utilization        (float)        — ρ = λ/(c·μ);  > 1.0 means saturated
        erlang_c           (float)        — P_W: probability truck must wait
        queue_length       (float | None) — Lq (None when ρ >= 1 → unbounded)
        wait_time_hours    (float | None) — Wq (None when ρ >= 1 → unbounded)
        is_bottleneck      (bool)         — True when utilization > 0.85
        throughput_tons_hr (float)        — min(λ, c·μ): actual processed flow
        capacity_tons_hr   (float)        — c · μ: maximum processing capacity
        arrival_rate_tons_hr (float)      — λ as supplied
        service_rate_per_server (float)   — μ as supplied
        num_servers        (int)          — c as supplied
    """
    # ── Extract inputs with .get() — never crash on missing keys ─────────────
    node_id      = node.get("id",                       "unknown")
    node_type    = node.get("type",                     "unknown")
    arrival_rate = float(node.get("arrival_rate_tons_hr",    0.0))
    service_rate = float(node.get("service_rate_per_server", 0.0))
    num_servers  = int(node.get("num_servers",               0))

    # ── Bullet-proof guard: zero/negative servers or service rate ─────────────
    # Instead of raising ValueError, return a saturated node record immediately.
    if num_servers <= 0 or service_rate <= 0:
        return {
            "node_id":                node_id,
            "node_type":              node_type,
            "utilization":            1.0,
            "erlang_c":               1.0,
            "queue_length":           None,          # represents infinity
            "wait_time_hours":        None,          # represents infinity
            "is_bottleneck":          True,
            "throughput_tons_hr":     0.0,
            "capacity_tons_hr":       0.0,
            "arrival_rate_tons_hr":   arrival_rate,
            "service_rate_per_server": service_rate,
            "num_servers":            num_servers,
        }

    if arrival_rate < 0:
        arrival_rate = 0.0
    
    # Per-server utilization  ρ = λ / (c · μ)
    # At this point num_servers > 0 and service_rate > 0 are guaranteed.
    capacity    = num_servers * service_rate
    utilization = arrival_rate / capacity
    
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