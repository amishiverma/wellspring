"""
test.py — Local Verification for queuing.py and graph_analyzer.py
Member 3: Tanishq (Core Algorithm & Simulation Scientist)

Run from the repo root or from backend/engine/:
    python test.py            (from tsecMinithon_MindOverMatter/)
    python backend/engine/test.py

Requires: networkx  (pip install networkx)
No other dependencies beyond the standard library.
"""

import sys
import math
import pprint

# ── Path setup so this works from repo root OR from engine/ ────────────────
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from queuing import calculate_node_bottlenecks
from graph_analyzer import calculate_max_flow

# ============================================================
# ANSI colour helpers (works on Windows 10+ with ANSI enabled)
# ============================================================
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def section(title: str) -> None:
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

def ok(msg: str) -> None:
    print(f"  {GREEN}✓  {msg}{RESET}")

def fail(msg: str) -> None:
    print(f"  {RED}✗  {msg}{RESET}")

def warn(msg: str) -> None:
    print(f"  {YELLOW}!  {msg}{RESET}")

def assert_close(a: float, b: float, label: str, tol: float = 1e-4) -> None:
    if math.isinf(a) and math.isinf(b):
        ok(f"{label}: both inf  ✓")
        return
    if abs(a - b) <= tol:
        ok(f"{label}: {a:.6f}  ≈  {b:.6f}  ✓")
    else:
        fail(f"{label}: got {a:.6f}, expected {b:.6f}  (diff={abs(a-b):.6f})")

def assert_inf(val: float, label: str) -> None:
    if math.isinf(val):
        ok(f"{label} is inf  ✓")
    else:
        fail(f"{label} should be inf, got {val}")

def assert_not_saturated(metrics: dict, node_id) -> None:
    if not metrics[node_id]["is_saturated"]:
        ok(f"Node '{node_id}' is NOT saturated  ✓")
    else:
        fail(f"Node '{node_id}' should NOT be saturated")

def assert_saturated(metrics: dict, node_id) -> None:
    if metrics[node_id]["is_saturated"]:
        ok(f"Node '{node_id}' IS saturated (expected)  ✓")
    else:
        fail(f"Node '{node_id}' should be saturated")


# ============================================================
# ── TASK 1: queuing.py tests ─────────────────────────────────
# ============================================================

section("TASK 1 — M/M/c Queuing Model (queuing.py)")

# ── Test data ────────────────────────────────────────────────────────────────
#
#  Node A: Light load — 1 server, low utilisation
#    lambda=5 tons/hr, c=1 server, mu=10 tons/hr → rho = 5/(1*10) = 0.5
#    Erlang C (c=1, rho=0.5) = rho = 0.5 (single-server simplification)
#    Lq = C(c,rho)*rho/(1-rho) = 0.5 * 0.5/0.5 = 0.5
#    Wq = Lq/lambda = 0.5/5 = 0.1 hrs
#
#  Node B: High load — 3 servers, moderate utilisation
#    lambda=25, c=3, mu=10 → rho = 25/(3*10) = 0.8333
#
#  Node C: SATURATED — 1 server, over capacity
#    lambda=15, c=1, mu=10 → rho = 15/10 = 1.5 >= 1 → inf
#
#  Node D: Edge case — zero servers (misconfigured node)
#
#  Node E: Edge case — zero arrival rate (idle node)

NODES_QUEUE = [
    {
        "id": "node_A",
        "arrival_rate": 5.0,         # tons/hr
        "num_servers": 1,
        "service_rate_per_server": 10.0,  # tons/hr per bay
    },
    {
        "id": "node_B",
        "arrival_rate": 25.0,
        "num_servers": 3,
        "service_rate_per_server": 10.0,
    },
    {
        "id": "node_C_SATURATED",
        "arrival_rate": 15.0,
        "num_servers": 1,
        "service_rate_per_server": 10.0,
    },
    {
        "id": "node_D_NO_SERVERS",
        "arrival_rate": 10.0,
        "num_servers": 0,            # misconfigured
        "service_rate_per_server": 10.0,
    },
    {
        "id": "node_E_IDLE",
        "arrival_rate": 0.0,         # nothing arriving
        "num_servers": 2,
        "service_rate_per_server": 10.0,
    },
]

print(f"\n{BOLD}Running calculate_node_bottlenecks() ...{RESET}")
q_result = calculate_node_bottlenecks(NODES_QUEUE)

print(f"\n{BOLD}Raw output:{RESET}")
pprint.pprint(q_result, width=80)

# ── Assertions ───────────────────────────────────────────────────────────────
print(f"\n{BOLD}Assertions — node_A (rho=0.5, single server){RESET}")
assert_not_saturated(q_result, "node_A")
assert_close(q_result["node_A"]["utilization"],     0.5,   "  utilization")
assert_close(q_result["node_A"]["queue_length"],    0.5,   "  queue_length (Lq)")
assert_close(q_result["node_A"]["wait_time_hours"], 0.1,   "  wait_time_hours (Wq)")

print(f"\n{BOLD}Assertions — node_B (rho=0.8333, 3 servers){RESET}")
assert_not_saturated(q_result, "node_B")
rho_B = q_result["node_B"]["utilization"]
if 0.83 < rho_B < 0.84:
    ok(f"  utilization in (0.83, 0.84): {rho_B}  ✓")
else:
    fail(f"  utilization {rho_B} not in expected range (0.83, 0.84)")

print(f"\n{BOLD}Assertions — node_C_SATURATED (rho=1.5 → inf){RESET}")
assert_saturated(q_result, "node_C_SATURATED")
assert_inf(q_result["node_C_SATURATED"]["queue_length"],    "  queue_length")
assert_inf(q_result["node_C_SATURATED"]["wait_time_hours"], "  wait_time_hours")

print(f"\n{BOLD}Assertions — node_D_NO_SERVERS (0 servers → inf){RESET}")
assert_saturated(q_result, "node_D_NO_SERVERS")

print(f"\n{BOLD}Assertions — node_E_IDLE (0 arrivals){RESET}")
assert_not_saturated(q_result, "node_E_IDLE")
assert_close(q_result["node_E_IDLE"]["queue_length"],    0.0, "  queue_length")
assert_close(q_result["node_E_IDLE"]["wait_time_hours"], 0.0, "  wait_time_hours")


# ============================================================
# ── TASK 2: graph_analyzer.py tests ──────────────────────────
# ============================================================

section("TASK 2 — Max-Flow / Min-Cut (graph_analyzer.py)")

# ── Network layout ────────────────────────────────────────────────────────────
#
#   source_1 ──(cap=20)──► transfer_A ──(cap=10)──► landfill_1
#                  │                         ▲
#                  └────(cap=15)──► sorting_B─┘(cap=12)
#   source_2 ──(cap=30)──► transfer_A
#
#   super-source → source_1, source_2  (infinite cap)
#   landfill_1 → super-sink            (infinite cap)
#
#   The bottleneck edges going into landfill_1 have caps 10 and 12.
#   Max flow into landfill_1 = 10 + 12 = 22 tons/hr (upper bound from sinks).
#   But source feeds (20+30=50) are abundant, so min-cut is on landfill-side.

NODES_GRAPH = [
    {"id": "source_1",    "type": "source"},
    {"id": "source_2",    "type": "source"},
    {"id": "transfer_A",  "type": "transfer"},
    {"id": "sorting_B",   "type": "sorting"},
    {"id": "landfill_1",  "type": "landfill"},
]

EDGES_GRAPH = [
    # source_1 → transfer_A: 4 trucks * 5 tons * 1 trip/hr = 20 tons/hr
    {"source": "source_1",   "target": "transfer_A",  "num_trucks": 4,  "truck_capacity_tons": 5.0,  "trips_per_hour": 1.0},
    # source_2 → transfer_A: 6 trucks * 5 tons * 1 trip/hr = 30 tons/hr
    {"source": "source_2",   "target": "transfer_A",  "num_trucks": 6,  "truck_capacity_tons": 5.0,  "trips_per_hour": 1.0},
    # transfer_A → landfill_1: 2 trucks * 5 tons * 1 trip/hr = 10 tons/hr  ← BOTTLENECK 1
    {"source": "transfer_A", "target": "landfill_1",  "num_trucks": 2,  "truck_capacity_tons": 5.0,  "trips_per_hour": 1.0},
    # transfer_A → sorting_B: 3 trucks * 5 tons * 1 trip/hr = 15 tons/hr
    {"source": "transfer_A", "target": "sorting_B",   "num_trucks": 3,  "truck_capacity_tons": 5.0,  "trips_per_hour": 1.0},
    # sorting_B → landfill_1: 2 trucks * 6 tons * 1 trip/hr = 12 tons/hr  ← BOTTLENECK 2
    {"source": "sorting_B",  "target": "landfill_1",  "num_trucks": 2,  "truck_capacity_tons": 6.0,  "trips_per_hour": 1.0},
]

print(f"\n{BOLD}Running calculate_max_flow() ...{RESET}")
mf_result = calculate_max_flow(NODES_GRAPH, EDGES_GRAPH)

print(f"\n{BOLD}Raw output:{RESET}")
pprint.pprint(mf_result, width=80)

# ── Assertions ───────────────────────────────────────────────────────────────
print(f"\n{BOLD}Assertions — max flow value{RESET}")
expected_max_flow = 22.0   # min-cut = 10 + 12 (incoming edges to landfill_1)
assert_close(
    mf_result["max_flow_tons_per_hour"],
    expected_max_flow,
    "  max_flow_tons_per_hour",
)

print(f"\n{BOLD}Assertions — min-cut edges (should be the 2 landfill-incoming edges){RESET}")
cut_edges = mf_result["minimum_cut_edges"]
cut_targets = {e["target"] for e in cut_edges}
if "landfill_1" in cut_targets:
    ok(f"  min-cut edges include landfill_1 targets  ✓")
else:
    fail(f"  landfill_1 not found in cut targets: {cut_targets}")

if len(cut_edges) >= 1:
    ok(f"  {len(cut_edges)} min-cut edge(s) identified  ✓")
else:
    fail("  No min-cut edges found")

for e in cut_edges:
    print(f"    {e['source']} → {e['target']}  cap={e['capacity_tons_per_hour']}  flow={e['flow_tons_per_hour']}  util={e['utilization']}")

print(f"\n{BOLD}Assertions — empty graph guard{RESET}")
empty_result = calculate_max_flow([], [])
assert_close(empty_result["max_flow_tons_per_hour"], 0.0, "  empty graph max_flow")
if empty_result["minimum_cut_edges"] == []:
    ok("  empty graph min-cut edges == []  ✓")
else:
    fail("  empty graph should return no cut edges")


# ============================================================
# ── Summary ──────────────────────────────────────────────────
# ============================================================
section("ALL TESTS COMPLETE")
print(f"  If all lines above show {GREEN}✓{RESET}, both modules are working correctly.")
print(f"  Saturated nodes and inf values are handled as expected.\n")
