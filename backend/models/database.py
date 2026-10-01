"""
backend/models/database.py
===========================
Author  : Vrinda (API & Infrastructure Architect)
Project : Waste Flow Digital Twin — TSEC Minithon
Purpose : SQLite database engine, session factory, and ORM table models
          using SQLModel (Pydantic + SQLAlchemy unified layer).

Requires: sqlmodel >= 0.0.14
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Generator, Optional

from sqlmodel import Field, Session, SQLModel, create_engine

# ---------------------------------------------------------------------------
# Engine — SQLite file stored at project root (backend/waste_twin.db)
# ---------------------------------------------------------------------------

DATABASE_URL = "sqlite:///./waste_twin.db"

# connect_args is SQLite-specific: allows multi-threaded access in FastAPI
engine = create_engine(
    DATABASE_URL,
    echo=False,                        # set True to see SQL in console while debugging
    connect_args={"check_same_thread": False},
)


# ---------------------------------------------------------------------------
# SimulationHistory — audit log of every POST /simulate call
# ---------------------------------------------------------------------------

class SimulationHistory(SQLModel, table=True):
    """
    Stores a record for every simulation run.

    Columns
    -------
    id                  : Auto-increment primary key.
    timestamp           : UTC datetime when the simulation was triggered.
    input_payload_json  : Raw JSON string of the SimulationPayload request.
    output_payload_json : Raw JSON string of the simulation result response.
    """

    __tablename__ = "simulation_history"

    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Auto-increment primary key",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the simulation run",
        index=True,
    )
    input_payload_json: str = Field(
        description="JSON-serialized SimulationPayload that was submitted",
    )
    output_payload_json: str = Field(
        description="JSON-serialized simulation result returned to the client",
    )


# ---------------------------------------------------------------------------
# Database lifecycle helpers
# ---------------------------------------------------------------------------

def create_db_and_tables() -> None:
    """
    Create all SQLModel tables in the database if they do not exist.
    Called once at application startup via the FastAPI lifespan handler.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request.

    Usage in a route
    ----------------
    from fastapi import Depends
    from backend.models.database import get_session

    @app.post("/simulate")
    async def simulate(session: Session = Depends(get_session)):
        ...
    """
    with Session(engine) as session:
        yield session
