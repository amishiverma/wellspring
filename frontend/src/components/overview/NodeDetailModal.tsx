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
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs pointer-events-auto select-none">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-lg h-full bg-white/85 backdrop-blur-3xl border-l border-white/85 shadow-2xl overflow-y-auto p-6 sm:p-8 flex flex-col justify-between"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/50">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-[10px] font-mono font-semibold uppercase rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  {node.type.toUpperCase()} FACILITY
                </span>
                {node.pulseRed && (
                  <span className="px-3 py-1 text-[10px] font-mono font-semibold uppercase rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    BOTTLENECK ACTIVE
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mt-4">
              <h3 className="text-xl font-sans font-bold text-stone-900 tracking-tight">
                {node.name}
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                {node.description}
              </p>
            </div>

            {/* Erlang C Live Queue Theory Diagnostic */}
            <div className="mt-6 p-5 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-stone-800 uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-700" /> Erlang-C Queueing Telemetry
                </span>
                <span className="text-[10px] font-mono text-stone-500 font-medium">
                  M/M/{node.activeBays} Model
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
                  <span className="text-[10px] text-stone-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Traffic Intensity (ρ)
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      q.severity === 'critical'
                        ? 'text-rose-600'
                        : q.severity === 'warning'
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {Math.round(q.utilization * 100)}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    {q.severity === 'critical' ? 'Capacity Exceeded' : 'Flow Balanced'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
                  <span className="text-[10px] text-stone-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Wait Probability P(W&gt;0)
                  </span>
                  <span className="text-xl font-bold text-stone-900">
                    {Math.round(q.probWait * 100)}%
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Erlang-C Delay Chance
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
                  <span className="text-[10px] text-stone-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Queue Length (Lq)
                  </span>
                  <span className="text-xl font-bold text-sky-800">
                    {Math.round(q.queueLength * 10) / 10} trucks
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Staged at Inbound Gates
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
                  <span className="text-[10px] text-stone-400 block mb-0.5 uppercase tracking-wider font-semibold">
                    Avg Queue Delay (Wq)
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      q.avgWaitMinutes > 15 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {Math.round(q.avgWaitMinutes * 10) / 10} mins
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Total in system: {Math.round(q.totalSystemTimeMinutes)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Capacity Controls */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500">
                Dynamic Capacity Controls
              </h4>

              {/* Bay Adjustment */}
              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Active Service Bays (c)
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    Service rate: {node.serviceRate} trucks/bay/hr
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addBaysToNode(node.id, -1)}
                    disabled={node.activeBays <= 1}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 disabled:opacity-30 transition shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-stone-900 w-6 text-center text-sm">
                    {node.activeBays}
                  </span>
                  <button
                    onClick={() => addBaysToNode(node.id, 1)}
                    className="p-1.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Arrival Rate Surge Adjustment */}
              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Inflow Arrival Rate (λ)
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {node.arrivalRate} trucks/hr ({Math.round(node.arrivalRate * 7.5)} MT/hr)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateNodeArrivalRate(node.id, -2)}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-stone-900 w-8 text-center text-sm">
                    {node.arrivalRate}
                  </span>
                  <button
                    onClick={() => updateNodeArrivalRate(node.id, 2)}
                    className="p-1.5 rounded-lg bg-sky-100/80 hover:bg-sky-100 text-sky-800 border border-sky-200 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Accepted Waste Streams */}
            <div className="mt-5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-stone-500 block mb-2">
                Processed Waste Streams
              </span>
              <div className="flex flex-wrap gap-1.5">
                {node.wasteTypes.map((wt, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-white/80 text-stone-700 text-xs border border-white/80 font-mono font-medium shadow-xs"
                  >
                    {wt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Mitigate Button */}
          <div className="pt-6 border-t border-stone-200/50 space-y-2.5">
            {node.pulseRed && (
              <button
                onClick={() => {
                  mitigateBottleneck(node.id);
                }}
                className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mitigate Bottleneck (Add Bay + Divert 18%)
              </button>
            )}

            <button
              onClick={() => setSelectedNodeId(null)}
              className="w-full py-2.5 px-4 rounded-full bg-white/80 hover:bg-white text-stone-700 text-xs font-mono font-medium transition border border-stone-200/60 shadow-xs"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
