"""
queuing.py — M/M/c Queuing Model & Erlang C Formula
Member 3: Tanishq (Core Algorithm & Simulation Scientist)

Standalone module. No FastAPI, no web routing.
Output: plain Python dicts compatible with Vrinda's Pydantic models.

Model assumptions:
  - Poisson arrivals at rate lambda (arrival_rate, tons/hr)
  - Exponential service time at rate mu per server (service_rate_per_server, tons/hr)
  - c identical parallel servers (num_servers / processing bays)
  - Infinite queue capacity (M/M/c steady-state)
"""

import math


# ---------------------------------------------------------------------------
# Core M/M/c helpers
# ---------------------------------------------------------------------------

def _erlang_c(c: int, rho: float) -> float:
    """
    Erlang C formula: probability that an arriving job must wait (P_wait).

    P(wait) = [(A^c / c!) * (1/(1-rho))]
              / [sum_{k=0}^{c-1} A^k/k!  +  (A^c / c!) * (1/(1-rho))]

    where A = c * rho  (= lambda / mu, total offered load in Erlangs)

    Parameters
    ----------
    c   : number of parallel servers (int, >= 1)
    rho : per-server utilisation  rho = lambda / (c * mu)  (must be < 1)

    Returns
    -------
    float in [0, 1)
    """
    if rho >= 1.0:
        return 1.0  # unstable — every arriving job waits

    A = c * rho  # total offered load (Erlangs)

    # Numerator
    numerator = (A ** c / math.factorial(c)) * (1.0 / (1.0 - rho))

    # Denominator = Poisson sum (k=0..c-1) + numerator
    poisson_sum = sum((A ** k) / math.factorial(k) for k in range(c))
    denominator = poisson_sum + numerator

    if denominator == 0.0:
        return 0.0

    return numerator / denominator


def _compute_node_metrics(
    arrival_rate: float,
    num_servers: int,
    service_rate_per_server: float,
) -> dict:
    """
    Compute steady-state M/M/c metrics for a single processing node.

    Returns a dict with keys:
        utilization        (rho)    — fraction of each server's capacity used
        erlang_c_prob      (P_wait) — probability an arriving load must queue
        queue_length       (Lq)     — mean number of tons waiting in queue
        wait_time_hours    (Wq)     — mean wait before processing begins (hrs)
        system_length      (L)      — mean tons in system (queue + in service)
        system_time_hours  (W)      — mean total time in system (hrs)
        is_saturated       (bool)   — True when rho >= 1.0
    """
    INF = float("inf")

    # Guard: degenerate configurations
    if num_servers <= 0 or service_rate_per_server <= 0:
        return {
            "utilization": INF,
            "erlang_c_prob": 1.0,
            "queue_length": INF,
            "wait_time_hours": INF,
            "system_length": INF,
            "system_time_hours": INF,
            "is_saturated": True,
        }

    # Per-server traffic intensity  rho = lambda / (c * mu)
    rho = arrival_rate / (num_servers * service_rate_per_server)

    if rho >= 1.0:
        return {
            "utilization": round(rho, 6),
            "erlang_c_prob": 1.0,
            "queue_length": INF,
            "wait_time_hours": INF,
            "system_length": INF,
            "system_time_hours": INF,
            "is_saturated": True,
        }

    # Erlang C probability (likelihood of having to wait)
    p_wait = _erlang_c(num_servers, rho)

    # Mean queue length  Lq = P_wait * rho / (1 - rho)
    lq = p_wait * rho / (1.0 - rho)

    # Mean wait time in queue  Wq = Lq / lambda  (Little's Law)
    wq = lq / arrival_rate if arrival_rate > 0 else 0.0

    # Mean number in system  L = Lq + lambda/mu_total
    mu_total = num_servers * service_rate_per_server
    l_sys = lq + (arrival_rate / mu_total)

    # Mean time in system  W = L / lambda  (Little's Law)
    w_sys = l_sys / arrival_rate if arrival_rate > 0 else 0.0

    return {
        "utilization": round(rho, 6),
        "erlang_c_prob": round(p_wait, 6),
        "queue_length": round(lq, 6),
        "wait_time_hours": round(wq, 6),
        "system_length": round(l_sys, 6),
        "system_time_hours": round(w_sys, 6),
        "is_saturated": False,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_node_bottlenecks(nodes: list[dict]) -> dict:
    """
    Analyse every node in the waste-flow graph using the M/M/c queuing model.

    Parameters
    ----------
    nodes : list[dict]
        Each dict must contain:
            id                      (str | int)  — unique node identifier
            arrival_rate            (float)      — tons/hr arriving at this node
            num_servers             (int)        — number of parallel processing bays
            service_rate_per_server (float)      — tons/hr capacity per bay

    Returns
    -------
    dict[node_id -> metrics_dict]

    Each metrics_dict contains:
        utilization        (float)  rho = lambda / (c * mu); fraction of server capacity used
        erlang_c_prob      (float)  P(wait); probability an arriving load must queue
        queue_length       (float)  Lq; avg tons waiting in queue (inf if saturated)
        wait_time_hours    (float)  Wq; avg hours waiting before processing (inf if saturated)
        system_length      (float)  L;  avg tons in system (inf if saturated)
        system_time_hours  (float)  W;  avg total time in system (inf if saturated)
        is_saturated       (bool)   True when rho >= 1.0 — critical bottleneck flag

    Edge Cases
    ----------
    - rho >= 1.0            → queue grows without bound; inf returned for queue/wait fields
    - num_servers <= 0      → treated as saturated (misconfigured node)
    - service_rate <= 0     → treated as saturated (broken/offline bay)
    - arrival_rate == 0     → all queue lengths are 0 (idle node)
    """
    results: dict = {}

    for node in nodes:
        node_id = node["id"]
        arrival_rate = float(node.get("arrival_rate", 0.0))
        num_servers = int(node.get("num_servers", 1))
        service_rate = float(node.get("service_rate_per_server", 1.0))

        results[node_id] = _compute_node_metrics(arrival_rate, num_servers, service_rate)

    return results
