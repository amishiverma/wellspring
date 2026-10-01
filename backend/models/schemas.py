"""
backend/models/schemas.py
=========================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : Single source of truth for all data contracts between frontend,
          backend API, and simulation engine.

Requires: pydantic >= 2.0
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, computed_field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class NodeType(str, Enum):
    """Classifies each node in the waste supply-chain graph."""
    COLLECTION_POINT   = "collection_point"
    TRANSFER_STATION   = "transfer_station"
    SORTING_FACILITY   = "sorting_facility"
    RECYCLING_PLANT    = "recycling_plant"
    COMPOSTING_UNIT    = "composting_unit"
    LANDFILL           = "landfill"
    WASTE_TO_ENERGY    = "waste_to_energy"


class EdgeStatus(str, Enum):
    """Operational status of a transport edge."""
    ACTIVE      = "active"
    CONGESTED   = "congested"
    INACTIVE    = "inactive"


# ---------------------------------------------------------------------------
# WasteNode Schema
# ---------------------------------------------------------------------------

class WasteNode(BaseModel):
    """
    Represents a physical node in the waste management network.

    Fields
    ------
    id            : Unique identifier (e.g., 'node_001').
    name          : Human-readable label shown in the UI.
    type          : One of NodeType enum values.
    capacity      : Maximum waste the node can handle per day (tonnes/day).
    current_load  : Current waste volume being processed (tonnes/day).
    coordinates   : [longitude, latitude] pair for map rendering.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(
        ...,
        description="Unique node identifier",
        examples=["node_001"],
    )
    name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Human-readable node name",
    )
    type: NodeType = Field(
        ...,
        description="Classification of the waste facility",
    )
    capacity: float = Field(
        ...,
        gt=0,
        description="Maximum processing capacity in tonnes/day",
    )
    current_load: float = Field(
        ...,
        ge=0,
        description="Current incoming waste load in tonnes/day",
    )
    coordinates: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="[longitude, latitude] — WGS-84 decimal degrees",
    )

    # ---- Validators -------------------------------------------------------

    @field_validator("current_load")
    @classmethod
    def load_must_not_exceed_capacity(cls, v: float, info: Any) -> float:
        # Access sibling field safely (info.data may be partial during validation)
        capacity = info.data.get("capacity")
        if capacity is not None and v > capacity:
            raise ValueError(
                f"current_load ({v}) cannot exceed capacity ({capacity})"
            )
        return v

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v: list[float]) -> list[float]:
        lon, lat = v[0], v[1]
        if not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Longitude {lon} is out of range [-180, 180]")
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Latitude {lat} is out of range [-90, 90]")
        return v

    # ---- Computed fields --------------------------------------------------

    @computed_field
    @property
    def utilization(self) -> float:
        """
        Utilization ratio rho = current_load / capacity.
        Value in [0.0, 1.0]; above ~0.85 signals a bottleneck.
        """
        if self.capacity == 0:
            return 0.0
        return round(self.current_load / self.capacity, 4)

    @computed_field
    @property
    def is_bottleneck(self) -> bool:
        """True when utilization >= 85% — Tanishq's engine uses this flag."""
        return self.utilization >= 0.85


# ---------------------------------------------------------------------------
# WasteEdge Schema
# ---------------------------------------------------------------------------

class WasteEdge(BaseModel):
    """
    Represents a directed transport link between two WasteNodes.

    Fields
    ------
    id          : Unique edge identifier (e.g., 'edge_001').
    source      : id of the originating WasteNode.
    target      : id of the destination WasteNode.
    distance    : Road distance in kilometres.
    throughput  : Actual flow on this edge (tonnes/day).
    status      : Operational status (active / congested / inactive).
    vehicle_type: Dominant vehicle type on this route.
    """

    id: str = Field(
        ...,
        description="Unique edge identifier",
        examples=["edge_001"],
    )
    source: str = Field(
        ...,
        description="Source node id",
    )
    target: str = Field(
        ...,
        description="Target node id",
    )
    distance: float = Field(
        ...,
        gt=0,
        description="Road distance between nodes in kilometres",
    )
    throughput: float = Field(
        ...,
        ge=0,
        description="Waste volume flowing on this edge (tonnes/day)",
    )
    status: EdgeStatus = Field(
        default=EdgeStatus.ACTIVE,
        description="Operational status of the transport link",
    )
    vehicle_type: str = Field(
        default="compactor_truck",
        description="Primary vehicle type on this route",
        examples=["compactor_truck", "tipper_truck", "electric_van"],
    )

    # ---- Validators -------------------------------------------------------

    @field_validator("source", "target")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("source and target node ids must not be empty")
        return v

    # ---- Computed fields --------------------------------------------------

    @computed_field
    @property
    def flow_density(self) -> float:
        """Throughput per kilometre (tonnes/day/km). Useful for CO2 cost."""
        if self.distance == 0:
            return 0.0
        return round(self.throughput / self.distance, 4)


# ---------------------------------------------------------------------------
# GlobalParameters Schema
# ---------------------------------------------------------------------------

class GlobalParameters(BaseModel):
    """
    Simulation-wide tuning knobs consumed by Tanishq's engine and
    Yash's CO2 / optimiser modules.
    """

    simulation_duration_days: int = Field(
        default=30,
        ge=1,
        le=365,
        description="How many days to simulate",
    )
    time_step_hours: float = Field(
        default=1.0,
        gt=0,
        description="Discrete simulation time-step in hours",
    )
    bottleneck_threshold: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Utilization ratio above which a node is flagged as a bottleneck",
    )
    emission_factor_kg_per_km: float = Field(
        default=0.268,
        gt=0,
        description="CO2e emission factor in kg per tonne-kilometre (diesel default)",
    )
    diesel_price_per_litre: float = Field(
        default=92.5,
        gt=0,
        description="Diesel cost in INR per litre (used by Yash's cost model)",
    )
    fuel_efficiency_km_per_litre: float = Field(
        default=5.5,
        gt=0,
        description="Average vehicle fuel efficiency in km/litre",
    )
    enable_what_if: bool = Field(
        default=True,
        description="Toggle to enable/disable what-if scenario branch",
    )


# ---------------------------------------------------------------------------
# SimulationPayload Schema  (the main API request/response envelope)
# ---------------------------------------------------------------------------

class SimulationPayload(BaseModel):
    """
    Top-level envelope posted to POST /simulate and POST /whatif.

    This is the single data contract shared across the whole team:
    - Amishi reads `nodes` + `edges` to render React Flow.
    - Tanishq reads the same to run M/M/c and NetworkX algorithms.
    - Yash reads results to calculate CO2e and generate LLM summaries.
    """

    nodes: list[WasteNode] = Field(
        ...,
        min_length=1,
        description="All facility nodes in the waste network",
    )
    edges: list[WasteEdge] = Field(
        ...,
        min_length=1,
        description="All directed transport links in the waste network",
    )
    parameters: GlobalParameters = Field(
        default_factory=GlobalParameters,
        description="Global simulation parameters",
    )

    # ---- Validators -------------------------------------------------------

    @field_validator("edges")
    @classmethod
    def edges_must_reference_valid_nodes(
        cls, edges: list[WasteEdge], info: Any
    ) -> list[WasteEdge]:
        nodes = info.data.get("nodes", [])
        node_ids = {n.id for n in nodes}
        for edge in edges:
            if edge.source not in node_ids:
                raise ValueError(
                    f"Edge '{edge.id}' references unknown source node '{edge.source}'"
                )
            if edge.target not in node_ids:
                raise ValueError(
                    f"Edge '{edge.id}' references unknown target node '{edge.target}'"
                )
        return edges

    # ---- Helpers ----------------------------------------------------------

    def bottleneck_nodes(self) -> list[WasteNode]:
        """Returns nodes where utilization >= bottleneck_threshold."""
        threshold = self.parameters.bottleneck_threshold
        return [n for n in self.nodes if n.utilization >= threshold]

    def total_daily_throughput(self) -> float:
        """Sum of throughput across all edges (tonnes/day)."""
        return round(sum(e.throughput for e in self.edges), 2)
