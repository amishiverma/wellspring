# 🔌 Phase 4 Integration Guide — For Tanishq & Yash

> **Written by Vrinda (API Architect)**  
> When your engine code is ready, plugging it in is a **one-file, one-minute job.**  
> No touching `main.py`. No touching `schemas.py`. Just swap two imports.

---

## 🗺️ What Vrinda Has Built for You

Here's the full backend wiring so you know where everything lives:

```
backend/
├── main.py                        ← FastAPI app (CORS, DB, exception handlers)
├── models/
│   ├── schemas.py                 ← Pydantic V2 models (WasteNode, WasteEdge, SimulationPayload)
│   └── database.py                ← SQLite engine + SimulationHistory table
├── api/
│   ├── engine_stubs.py            ← 👈 YOUR STUBS LIVE HERE (delete when ready)
│   └── routes/
│       └── simulate.py            ← 👈 THE ONLY FILE YOU NEED TO EDIT
└── scripts/
    ├── generate_mock_data.py
    └── mock_data.json             ← 10 nodes / 15 edges — use for testing
```

The **only file you need to touch** is `backend/api/routes/simulate.py`.

---

## ⚙️ For Tanishq — Plugging in the Queuing Engine

**Your function signature must match this:**

```python
# backend/engine/queuing.py  (Tanishq writes this)
def run_queuing_simulation(payload: SimulationPayload) -> dict:
    ...
    return {
        "enriched_nodes": [...],   # list of node dicts with utilization_rate, is_bottleneck, etc.
        "bottleneck_ids": [...],   # list of node id strings
        "min_cut_edges":  [...],   # list of edge id strings
        "flow_summary":   {...},   # dict with total_daily_throughput_tonnes, network_efficiency_pct, etc.
        "simulation_meta": {...},  # any metadata you want (algo used, runtime, etc.)
    }
```

**Then open `backend/api/routes/simulate.py` and make this swap:**

```python
# BEFORE (stub — delete these 2 lines)
from api.engine_stubs import get_ai_optimizer_summary, run_queuing_simulation

# AFTER (real engine — add these 2 lines)
from engine.queuing import run_queuing_simulation
from api.engine_stubs import get_ai_optimizer_summary   # keep Yash's stub until he's ready
```

That's it. The endpoints call `run_queuing_simulation(payload)` — same call, real results.

---

## 🧠 For Yash — Plugging in the AI Optimizer & CO2 Engine

**Your function signature must match this:**

```python
# backend/engine/optimizer.py  (Yash writes this)
def get_ai_optimizer_summary(payload: SimulationPayload) -> dict:
    ...
    return {
        "ai_summary":        {"bullets": [...], "model": "gemini-pro", "persona": "City Planner"},
        "recommendations":   [...],   # list of {node_id, action, priority, reason, est_saving_...}
        "co2e_estimate_kg":  float,
        "cost_estimate_inr": float,
        "optimizer_meta":    {...},
    }
```

**Then open `backend/api/routes/simulate.py` and make this swap:**

```python
# BEFORE (stub — delete this line)
from api.engine_stubs import get_ai_optimizer_summary, run_queuing_simulation

# AFTER (both engines live)
from engine.queuing    import run_queuing_simulation
from engine.optimizer  import get_ai_optimizer_summary
```

---

## ✅ Full Before / After (When Both of You Are Ready)

```python
# backend/api/routes/simulate.py

# ─── BEFORE (Phase 3 stubs) ──────────────────────────────────────────────
from api.engine_stubs import get_ai_optimizer_summary, run_queuing_simulation


# ─── AFTER  (Phase 4 real engines) ───────────────────────────────────────
from engine.queuing   import run_queuing_simulation    # Tanishq's M/M/c + NetworkX
from engine.optimizer import get_ai_optimizer_summary  # Yash's CO2 + LLM
```

**Nothing else changes.** The endpoint bodies, the DB persistence, the response shape — all identical.

---

## 🧪 How to Test Your Integration

Use the pre-built mock data to hit the live API:

```bash
# Start the server (from project root)
uvicorn backend.main:app --reload --port 8000

# Test simulate endpoint with mock data
python -c "
import json, urllib.request
from pathlib import Path

mock = json.loads(Path('backend/scripts/mock_data.json').read_text())
req = urllib.request.Request(
    'http://localhost:8000/api/simulate',
    data=json.dumps(mock).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print(json.dumps(json.loads(urllib.request.urlopen(req).read()), indent=2))
"
```

Or open **http://localhost:8000/docs** for Swagger UI — you can POST directly from the browser.

---

## 📐 SimulationPayload Schema Reference

Your functions receive a fully-validated `SimulationPayload` object. Key attributes:

| Attribute | Type | Description |
|---|---|---|
| `payload.nodes` | `list[WasteNode]` | All 10 facility nodes |
| `payload.edges` | `list[WasteEdge]` | All 15 directed transport links |
| `payload.parameters` | `GlobalParameters` | Sim duration, emission factor, diesel price, etc. |
| `node.utilization` | `float` | Computed: `current_load / capacity` |
| `node.is_bottleneck` | `bool` | `True` when `utilization >= 0.85` |
| `edge.flow_density` | `float` | `throughput / distance` (tonnes/day/km) |
| `payload.total_daily_throughput()` | `float` | Sum of all edge throughputs |
| `payload.bottleneck_nodes()` | `list[WasteNode]` | Nodes above threshold |

Full schema: [`backend/models/schemas.py`](./models/schemas.py)

---

> 💬 **Questions?** Ping Vrinda. She owns this file and will merge your PRs cleanly.
