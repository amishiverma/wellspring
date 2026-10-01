# AI Agent Master Instructions: Waste Flow Bottleneck Analyzer

## 🌍 Global Context
We are a 4-person team building a Waste Flow Digital Twin for a 24-48 hour Hackathon. 
Goal: Model waste flow, visualize bottlenecks (React Flow), calculate CO2e emissions, and run what-if simulations using queueing math and AI summaries.

## ⚠️ Global AI Rules
1. **NO PLACEHOLDERS**: Never use `// ... rest of the code`. Output complete, copy-pasteable blocks.
2. **SPEED & PRAGMATISM**: This is a hackathon. Prioritize working, impressive code over perfect enterprise patterns. 
3. **STRICT TYPING**: Use TypeScript interfaces on the frontend and Pydantic models on the backend.

---

## 👩‍💻 Role-Specific Instructions 
*(AI: Calibrate your response based on who the user says they are in their first prompt)*

### 🎨 If the user says "I am Amishi" (Frontend Wizard)
**Role**: You are assisting Amishi, the solo Frontend Engineer. She is handling the entire UI, Graph Visualization, and State.
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Flow, D3-Sankey, Recharts, Framer Motion.
- **Directories**: `frontend/src/*`
- **AI Directives for Amishi**:
  1. Use **Zustand** for global state (`graphStore`, `simStore`). Avoid prop drilling.
  2. When generating UI, rely on **Tailwind CSS** and assume standard **shadcn/ui** components (Cards, Sliders, Buttons) are available.
  3. For **React Flow**, ensure custom nodes can accept a `pulseRed` boolean prop to trigger Framer Motion animations for bottlenecks.
  4. Write clean `axios` or `fetch` hooks to communicate with the FastAPI backend.

### ⚙️ If the user says "I am Vrinda" (API & Infrastructure Architect)
**Role**: You are assisting Vrinda. She owns the API pipeline, database, and data contracts between frontend and backend.
- **Tech Stack**: Python, FastAPI, Pydantic, SQLModel, SQLite.
- **Directories**: `backend/api/`, `backend/models/`, `backend/scripts/`
- **AI Directives for Vrinda**:
  1. Write strict **Pydantic v2** models (`WasteNode`, `WasteEdge`). These are the source of truth for the whole team.
  2. For `generate_mock_data.py`, output highly realistic JSON data instantly so Amishi is never blocked.
  3. Ensure FastAPI endpoints (`POST /simulate`, `POST /whatif`) are `async` and handle CORS correctly for local Vite development.
  4. Keep the `SimulationService` orchestrator clean: it should just call Tanishq's and Yash's functions in sequence.

### 🧮 If the user says "I am Tanishq" (Core Algorithm & Simulation Scientist)
**Role**: You are assisting Tanishq. He owns the heavy computational math and discrete-event simulations.
- **Tech Stack**: Python, SciPy, NetworkX, SimPy.
- **Directories**: `backend/engine/queuing.py`, `backend/engine/graph_analyzer.py`, `backend/engine/simpy_engine.py`
- **AI Directives for Tanishq**:
  1. Implement **M/M/c Erlang C** formulas accurately. Calculate utilization (ρ = λ / (c * μ)) and queue lengths.
  2. Use **NetworkX** to build directed graphs. Prioritize standard algorithms like Max-Flow/Min-Cut to find flow bottlenecks quickly.
  3. For **SimPy**, write time-stepped logic to track queue lengths over time. Make sure it runs fast (under 2 seconds) so the API doesn't hang.
  4. Output data strictly as dictionaries that Vrinda's Pydantic models can easily serialize.

### 🧠 If the user says "I am Yash" (Optimization & AI Engineer)
**Role**: You are assisting Yash. He owns the "Wow Factor": CO2 logic, the automated Optimizer, and LLM integrations.
- **Tech Stack**: Python, OpenAI/Gemini APIs, JSON logic routing.
- **Directories**: `backend/engine/co2_calculator.py`, `backend/engine/optimizer.py`, LLM routes.
- **AI Directives for Yash**:
  1. When writing `optimizer.py`, build a clean, rule-based heuristics engine. (e.g., `if node.utilization > 0.9: return {"action": "Add Bay", "priority": "HIGH"}`). 
  2. For `co2_calculator.py`, clearly define emission factors (e.g., 2.68 kg CO2 per liter of diesel). Make the math transparent.
  3. When writing the LLM integration (`/api/explain`), design the **Prompt** to be dynamic. Feed the bottleneck JSON into the LLM and instruct it to act as a "City Planner" summarizing the issues in exactly 3 short bullet points.
  4. Focus heavily on "Emissions Saved" and "Money Saved" in your outputs.

---
**Initialization Trigger**: 
User: "I am [Amishi/Vrinda/Tanishq/Yash]. Read agents.md and acknowledge my role."
AI: "Acknowledged. I am configured for [Role/Tech Stack]. What are we building first?"