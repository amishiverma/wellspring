import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Scale,
  Gauge,
  Truck,
  Clock,
  Sparkles,
  Leaf,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Cpu,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimStore } from '../../stores/simStore';
import { MetricCard } from '../common/MetricCard';
import { CustomWasteNode } from './CustomWasteNode';
import { GravFluxCanvas } from '../common/GravFluxCanvas';
import { NodeDetailModal } from './NodeDetailModal';

const nodeTypes = {
  customWaste: CustomWasteNode,
};

export const OverviewView: React.FC = () => {
  const { nodes: graphNodes, edges: graphEdges, setSelectedNodeId, alerts, mitigateBottleneck } =
    useGraphStore();
  const { aiPlannerBullets, triggerAIOptimizer, isOptimizing, activeScenarioName, setIsQuickModalOpen } =
    useSimStore();

  // Convert graphNodes to ReactFlow nodes
  const rfNodes: Node[] = useMemo(() => {
    return graphNodes.map((gn) => ({
      id: gn.id,
      type: 'customWaste',
      position: gn.position,
      data: gn,
    }));
  }, [graphNodes]);

  // Convert graphEdges to ReactFlow edges with custom animated styling
  const rfEdges: Edge[] = useMemo(() => {
    return graphEdges.map((ge) => {
      const isCongested = ge.flowRate / ge.maxCapacity > 0.85;
      return {
        id: ge.id,
        source: ge.source,
        target: ge.target,
        animated: true,
        style: {
          stroke: isCongested ? '#f43f5e' : '#10b981',
          strokeWidth: Math.max(2, (ge.flowRate / ge.maxCapacity) * 4),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCongested ? '#f43f5e' : '#10b981',
        },
        label: `${ge.flowRate} MT/h`,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#07090e', fillOpacity: 0.85 },
        labelBgPadding: [4, 2] as [number, number],
      };
    });
  }, [graphEdges]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  // Sync internal state when store nodes change
  React.useEffect(() => {
    // Keep nodes synchronized with Zustand store
  }, [graphNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const handleDeployOptimization = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#00f0ff', '#8b5cf6'],
    });
    // Mitigate any critical nodes
    graphNodes.forEach((n) => {
      if (n.bottleneckStatus === 'critical') {
        mitigateBottleneck(n.id);
      }
    });
    triggerAIOptimizer();
  };

  // Compute aggregate system metrics
  const totalFlow = graphNodes.reduce((acc, n) => acc + n.currentLoad, 0);
  const criticalCount = graphNodes.filter((n) => n.bottleneckStatus === 'critical').length;
  const maxWaitMinutes = Math.max(...graphNodes.map((n) => n.avgWaitMinutes));
  const avgUtilization =
    Math.round(
      (graphNodes.reduce((acc, n) => acc + n.utilization, 0) / graphNodes.length) * 100
    ) || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Reposé-Inspired Hero Canvas Banner */}
      <section className="relative rounded-3xl overflow-hidden border border-white/[0.08] glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Dynamic Grav-Flux Canvas background */}
        <div className="absolute inset-0 z-0 opacity-45">
          <GravFluxCanvas className="w-full h-full" intensity={1.1} />
        </div>

        {/* Subtle radial vignette gradient to ensure readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-obsidian-950 via-obsidian-950/80 to-transparent pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 p-6 sm:p-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WASTE FLOW DIGITAL TWIN • AUTONOMOUS GRAV-FLUX ANALYZER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.15]">
            Dynamic Queueing &amp; <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400">
              Closed-Loop Synthesis
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
            Continuous discrete-event twin mapping 48 spatial IoT sensor nodes, M/M/c Erlang-C
            potential wells, and circular feedstock recovery across the entire metropolitan waste grid.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsQuickModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95 flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Launch What-If Runner
            </button>

            <button
              onClick={handleDeployOptimization}
              disabled={isOptimizing}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              Auto-Mitigate All Hubs
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 pl-2">
              <span className="text-emerald-400 font-bold">● Active Scenario:</span>
              <span className="truncate max-w-[220px]">{activeScenarioName}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Daily Throughput"
          value="1,482"
          unit="MT / day"
          change="+12.4% peak"
          trend="up"
          trendGood={true}
          icon={<Scale className="w-5 h-5" />}
          accentColor="emerald"
          subtitle="Operating at 88.4% capacity"
        />

        <MetricCard
          title="Bottleneck Warning Index"
          value={criticalCount > 0 ? `0.${criticalCount * 3 + 2}4` : '0.18'}
          unit="BWI"
          change={criticalCount > 0 ? `${criticalCount} alert wells` : 'All wells nominal'}
          trend={criticalCount > 0 ? 'up' : 'down'}
          trendGood={criticalCount === 0}
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor={criticalCount > 0 ? 'rose' : 'emerald'}
          subtitle="Erlang C congestion factor"
        />

        <MetricCard
          title="Peak Erlang-C Queue Wait"
          value={`${maxWaitMinutes}`}
          unit="minutes"
          change="-34% vs baseline"
          trend="down"
          trendGood={true}
          icon={<Clock className="w-5 h-5" />}
          accentColor="cyan"
          subtitle="Apex MRF Sorting Line"
        />

        <MetricCard
          title="Net CO2e Averted"
          value="142.8"
          unit="MT CO2e"
          change="+18.2 MT this week"
          trend="up"
          trendGood={true}
          icon={<Leaf className="w-5 h-5" />}
          accentColor="violet"
          subtitle="Equiv. 6,240 urban trees"
        />
      </section>

      {/* Main React Flow Network Digital Twin */}
      <section className="rounded-3xl glass-panel p-6 border border-white/[0.08] shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.06] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold text-white tracking-tight">
                Live Waste Flow Topology Graph
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                REACT FLOW
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Interactive node graph. Click any facility to adjust arrival rate λ or add bays c.
              Red pulses indicate Erlang-C bottlenecks (ρ &gt; 85%).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Source
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Transfer
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Sorting MRF
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Circular
            </span>
          </div>
        </div>

        {/* React Flow Container */}
        <div className="relative w-full h-[520px] rounded-2xl overflow-hidden mt-4 border border-white/[0.05] bg-obsidian-950/70">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls className="!bg-obsidian-900 !border-white/[0.1] !rounded-xl !text-white" />
            <MiniMap
              className="!bg-obsidian-900/90 !border-white/[0.1] !rounded-xl"
              nodeColor={(n) => {
                if (n.data?.bottleneckStatus === 'critical') return '#f43f5e';
                if (n.data?.type === 'source') return '#00f0ff';
                if (n.data?.type === 'processing') return '#10b981';
                return '#8b5cf6';
              }}
            />
          </ReactFlow>
        </div>
      </section>

      {/* Two Column Section: Live Incident Feed & Yash's AI Planner Integration */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Alerts Ticker */}
        <div className="p-6 rounded-3xl glass-panel border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-display font-bold text-white text-base">
                  Live Queue Bottleneck Alerts
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {alerts.length} Active Events
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition ${
                    alert.severity === 'high'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : alert.severity === 'medium'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {alert.facilityName}
                    </span>
                    <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                  </div>

                  <p className="text-white text-xs font-semibold mb-1">
                    {alert.headline}
                  </p>
                  <p className="text-[11px] text-slate-300 font-sans mb-2 leading-relaxed">
                    {alert.details}
                  </p>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 italic">
                      Action: {alert.actionRecommendation}
                    </span>
                    {alert.severity === 'high' && (
                      <button
                        onClick={() => mitigateBottleneck(alert.facilityId)}
                        className="px-2 py-0.5 rounded bg-emerald-500 text-obsidian-950 font-bold hover:bg-emerald-400 transition"
                      >
                        Auto-Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yash's AI Planner Integration Panel (Prescribed in agents.md) */}
        <div className="p-6 rounded-3xl glass-panel border border-violet-500/20 bg-gradient-to-br from-violet-950/15 via-obsidian-900 to-obsidian-950 flex flex-col justify-between shadow-[0_0_40px_rgba(139,92,246,0.1)]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    AI City Planner Optimizer
                  </h3>
                  <p className="text-[10px] font-mono text-violet-300">
                    Rule-Based Heuristic &amp; LLM Synthesis Engine
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                YASH / ENGINE
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed font-light">
              Autonomous agent reviewing real-time Erlang-C queue intensities, diesel emission factors
              (2.68 kg CO2/L), and circular material yields to generate optimal municipal dispatch:
            </p>

            <div className="mt-4 space-y-2.5">
              {aiPlannerBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Heuristic Confidence: <span className="text-emerald-400 font-bold">99.4%</span>
            </span>

            <button
              onClick={handleDeployOptimization}
              disabled={isOptimizing}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isOptimizing ? 'Deploying...' : 'Deploy 3 Recommendations'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Slide-over inspector drawer */}
      <NodeDetailModal />
    </div>
  );
};
