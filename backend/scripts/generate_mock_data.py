"""
backend/scripts/generate_mock_data.py
======================================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : Instantiate Pydantic models with realistic mock data and export
          a cleanly formatted mock_data.json so Amishi is never blocked.

Usage   : python backend/scripts/generate_mock_data.py
Output  : backend/scripts/mock_data.json

Dependencies: pydantic >= 2.0, standard library (json, pathlib, sys)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Ensure backend/ is on sys.path so we can import from backend.models
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from models.schemas import (
    WasteNode,
    WasteEdge,
    GlobalParameters,
    SimulationPayload,
    NodeType,
    EdgeStatus,
)

# ---------------------------------------------------------------------------
# 10 Realistic WasteNodes — Mumbai Metropolitan Region waste supply chain
# ---------------------------------------------------------------------------

NODES: list[WasteNode] = [
    # ── Collection Points (primary sources of waste) ──────────────────────
    WasteNode(
        id="node_001",
        name="Dharavi Residential Collection Point",
        type=NodeType.COLLECTION_POINT,
        capacity=120.0,
        current_load=108.5,          # 90.4% — bottleneck!
        coordinates=[72.8546, 19.0386],
    ),
    WasteNode(
        id="node_002",
        name="Kurla Market Collection Point",
        type=NodeType.COLLECTION_POINT,
        capacity=90.0,
        current_load=61.0,           # 67.8%
        coordinates=[72.8791, 19.0728],
    ),
    WasteNode(
        id="node_003",
        name="Andheri West Collection Hub",
        type=NodeType.COLLECTION_POINT,
        capacity=150.0,
        current_load=133.5,          # 89.0% — bottleneck!
        coordinates=[72.8347, 19.1197],
    ),
    WasteNode(
        id="node_004",
        name="Chembur Residential Collection Point",
        type=NodeType.COLLECTION_POINT,
        capacity=80.0,
        current_load=52.0,           # 65.0%
        coordinates=[72.8992, 19.0522],
    ),

    # ── Transfer Stations (aggregation & relay hubs) ───────────────────────
    WasteNode(
        id="node_005",
        name="Wadala Transfer Station",
        type=NodeType.TRANSFER_STATION,
        capacity=300.0,
        current_load=262.0,          # 87.3% — bottleneck!
        coordinates=[72.8558, 19.0162],
    ),
    WasteNode(
        id="node_006",
        name="Versova Transfer & Compaction Hub",
        type=NodeType.TRANSFER_STATION,
        capacity=220.0,
        current_load=154.0,          # 70.0%
        coordinates=[72.8096, 19.1315],
    ),

    # ── Sorting & Processing Facilities ───────────────────────────────────
    WasteNode(
        id="node_007",
        name="Govandi Sorting Facility",
        type=NodeType.SORTING_FACILITY,
        capacity=400.0,
        current_load=312.0,          # 78.0%
        coordinates=[72.9183, 19.0545],
    ),
    WasteNode(
        id="node_008",
        name="Mulund Sorting & Segregation Centre",
        type=NodeType.SORTING_FACILITY,
        capacity=280.0,
        current_load=238.0,          # 85.0% — exactly at threshold
        coordinates=[72.9567, 19.1762],
    ),

    # ── Recycling Plant ────────────────────────────────────────────────────
    WasteNode(
        id="node_009",
        name="Bhandup Plastics Recycling Plant",
        type=NodeType.RECYCLING_PLANT,
        capacity=180.0,
        current_load=99.0,           # 55.0%
        coordinates=[72.9396, 19.1553],
    ),

    # ── Waste-to-Energy (terminal sink) ───────────────────────────────────
    WasteNode(
        id="node_010",
        name="Deonar Landfill & Waste-to-Energy Plant",
        type=NodeType.WASTE_TO_ENERGY,
        capacity=600.0,
        current_load=487.0,          # 81.2%
        coordinates=[72.9175, 19.0433],
    ),
]

# ---------------------------------------------------------------------------
# 15 Realistic WasteEdges — directed waste supply-chain graph
# ---------------------------------------------------------------------------

EDGES: list[WasteEdge] = [
    # ── Collection Points → Transfer Stations ─────────────────────────────
    WasteEdge(
        id="edge_001",
        source="node_001",
        target="node_005",
        distance=3.8,
        throughput=108.5,
        status=EdgeStatus.CONGESTED,
        vehicle_type="compactor_truck",
    ),
    WasteEdge(
        id="edge_002",
        source="node_002",
        target="node_005",
        distance=5.2,
        throughput=61.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="compactor_truck",
    ),
    WasteEdge(
        id="edge_003",
        source="node_003",
        target="node_006",
        distance=4.1,
        throughput=133.5,
        status=EdgeStatus.CONGESTED,
        vehicle_type="tipper_truck",
    ),
    WasteEdge(
        id="edge_004",
        source="node_004",
        target="node_005",
        distance=6.7,
        throughput=52.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="compactor_truck",
    ),
    WasteEdge(
        id="edge_005",
        source="node_004",
        target="node_007",
        distance=4.9,
        throughput=0.0,
        status=EdgeStatus.INACTIVE,
        vehicle_type="tipper_truck",
    ),

    # ── Transfer Stations → Sorting Facilities ────────────────────────────
    WasteEdge(
        id="edge_006",
        source="node_005",
        target="node_007",
        distance=8.3,
        throughput=170.0,
        status=EdgeStatus.CONGESTED,
        vehicle_type="tipper_truck",
    ),
    WasteEdge(
        id="edge_007",
        source="node_005",
        target="node_008",
        distance=14.6,
        throughput=92.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="tipper_truck",
    ),
    WasteEdge(
        id="edge_008",
        source="node_006",
        target="node_008",
        distance=22.1,
        throughput=154.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="tipper_truck",
    ),
    WasteEdge(
        id="edge_009",
        source="node_006",
        target="node_009",
        distance=19.8,
        throughput=0.0,
        status=EdgeStatus.INACTIVE,
        vehicle_type="electric_van",
    ),

    # ── Sorting Facilities → Recycling / Landfill ─────────────────────────
    WasteEdge(
        id="edge_010",
        source="node_007",
        target="node_010",
        distance=2.6,
        throughput=205.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="compactor_truck",
    ),
    WasteEdge(
        id="edge_011",
        source="node_007",
        target="node_009",
        distance=9.4,
        throughput=107.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="electric_van",
    ),
    WasteEdge(
        id="edge_012",
        source="node_008",
        target="node_009",
        distance=5.3,
        throughput=99.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="electric_van",
    ),
    WasteEdge(
        id="edge_013",
        source="node_008",
        target="node_010",
        distance=18.7,
        throughput=139.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="tipper_truck",
    ),

    # ── Recycling Plant → Landfill (residue stream) ───────────────────────
    WasteEdge(
        id="edge_014",
        source="node_009",
        target="node_010",
        distance=7.2,
        throughput=43.0,
        status=EdgeStatus.ACTIVE,
        vehicle_type="compactor_truck",
    ),

    # ── Direct overflow bypass: Collection → Terminal (emergency route) ────
    WasteEdge(
        id="edge_015",
        source="node_001",
        target="node_010",
        distance=12.5,
        throughput=0.0,
        status=EdgeStatus.INACTIVE,
        vehicle_type="tipper_truck",
    ),
]

# ---------------------------------------------------------------------------
# Global Simulation Parameters
# ---------------------------------------------------------------------------

PARAMETERS = GlobalParameters(
    simulation_duration_days=30,
    time_step_hours=1.0,
    bottleneck_threshold=0.85,
    emission_factor_kg_per_km=0.268,
    diesel_price_per_litre=92.5,
    fuel_efficiency_km_per_litre=5.5,
    enable_what_if=True,
)

# ---------------------------------------------------------------------------
# Assemble SimulationPayload and export
# ---------------------------------------------------------------------------

def build_payload() -> SimulationPayload:
    """Validate and return the complete SimulationPayload."""
    return SimulationPayload(
        nodes=NODES,
        edges=EDGES,
        parameters=PARAMETERS,
    )


def export_json(payload: SimulationPayload, output_path: Path) -> None:
    """
    Serialize payload to a cleanly formatted JSON file.
    Uses Pydantic's model_dump() so computed fields are included.
    """
    data = payload.model_dump(mode="json")

    # Pretty-print summary to console
    bottlenecks = payload.bottleneck_nodes()
    print(f"\n{'='*60}")
    print(f"  Waste Flow Digital Twin — Mock Data Generator")
    print(f"{'='*60}")
    print(f"  Nodes    : {len(payload.nodes)}")
    print(f"  Edges    : {len(payload.edges)}")
    print(f"  Total daily throughput : {payload.total_daily_throughput()} tonnes/day")
    print(f"  Bottleneck nodes ({len(bottlenecks)}):")
    for node in bottlenecks:
        print(f"    * {node.name} — utilization = {node.utilization * 100:.1f}%")
    print(f"{'='*60}")
    print(f"  Output   : {output_path}")
    print(f"{'='*60}\n")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[OK] mock_data.json written successfully ({output_path.stat().st_size} bytes)")


if __name__ == "__main__":
    payload = build_payload()
    output_path = Path(__file__).resolve().parent / "mock_data.json"
    export_json(payload, output_path)
