import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { calculateErlangC } from '../../utils/queueingMath';

export const NodeDetailModal: React.FC = () => {
  const { nodes, selectedNodeId, setSelectedNodeId, addBaysToNode, updateNodeArrivalRate, mitigateBottleneck } =
    useGraphStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const q = calculateErlangC(node.arrivalRate, node.serviceRate, node.activeBays);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-obsidian-950/60 backdrop-blur-sm pointer-events-auto">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-lg h-full bg-obsidian-900 border-l border-white/[0.08] shadow-2xl overflow-y-auto p-6 flex flex-col justify-between"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {node.type.toUpperCase()} NODE
                </span>
                {node.pulseRed && (
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                    BOTTLENECK ACTIVE
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mt-4">
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {node.name}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {node.description}
              </p>
            </div>

            {/* Erlang C Live Queue Theory Diagnostic */}
            <div className="mt-6 p-4 rounded-xl glass-panel-subtle border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Erlang-C Queueing Telemetry
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  M/M/{node.activeBays} Model
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Traffic Intensity (ρ)
                  </span>
                  <span
                    className={`text-base font-bold ${
                      q.severity === 'critical'
                        ? 'text-rose-400'
                        : q.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(q.utilization * 100)}%
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {q.severity === 'critical' ? 'Capacity Exceeded' : 'Flow Balanced'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Wait Probability P(W&gt;0)
                  </span>
                  <span className="text-base font-bold text-white">
                    {Math.round(q.probWait * 100)}%
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Erlang-C Delay Chance
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Queue Length (Lq)
                  </span>
                  <span className="text-base font-bold text-cyan-300">
                    {Math.round(q.queueLength * 10) / 10} trucks
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Staged at Inbound Gates
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Avg Queue Delay (Wq)
                  </span>
                  <span
                    className={`text-base font-bold ${
                      q.avgWaitMinutes > 15 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(q.avgWaitMinutes * 10) / 10} mins
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Total in system: {Math.round(q.totalSystemTimeMinutes)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Control Knobs */}
            <div className="mt-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Dynamic Capacity Controls
              </h4>

              {/* Bay Adjustment */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Active Service Bays (c)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Service rate: {node.serviceRate} trucks/bay/hr
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addBaysToNode(node.id, -1)}
                    disabled={node.activeBays <= 1}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white disabled:opacity-30 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white w-6 text-center text-sm">
                    {node.activeBays}
                  </span>
                  <button
                    onClick={() => addBaysToNode(node.id, 1)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Arrival Rate Surge Adjustment */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Inflow Arrival Rate (λ)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {node.arrivalRate} trucks/hr ({Math.round(node.arrivalRate * 7.5)} MT/hr)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateNodeArrivalRate(node.id, -2)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white w-8 text-center text-sm">
                    {node.arrivalRate}
                  </span>
                  <button
                    onClick={() => updateNodeArrivalRate(node.id, 2)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Accepted Waste Streams */}
            <div className="mt-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Processed Waste Streams
              </span>
              <div className="flex flex-wrap gap-1.5">
                {node.wasteTypes.map((wt, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 text-xs border border-white/[0.06] font-mono"
                  >
                    {wt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Mitigate Button */}
          <div className="pt-6 border-t border-white/[0.08] space-y-2">
            {node.pulseRed && (
              <button
                onClick={() => {
                  mitigateBottleneck(node.id);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-98 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Mitigate Bottleneck (Add Bay + Divert 18%)
              </button>
            )}

            <button
              onClick={() => setSelectedNodeId(null)}
              className="w-full py-2 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-mono transition"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
