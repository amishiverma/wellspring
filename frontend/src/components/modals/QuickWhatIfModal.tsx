import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle2, TrendingDown, Leaf, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimStore } from '../../stores/simStore';
import { useGraphStore } from '../../stores/graphStore';

export const QuickWhatIfModal: React.FC = () => {
  const {
    isQuickModalOpen,
    setIsQuickModalOpen,
    surgeMultiplier,
    setSurgeMultiplier,
    bayAdjustment,
    setBayAdjustment,
    divertRatePct,
    setDivertRatePct,
    greenFleetPct,
    setGreenFleetPct,
    applyPresetScenario,
  } = useSimStore();

  const { rebalanceNetworkFlows, nodes } = useGraphStore();

  if (!isQuickModalOpen) return null;

  const handleApply = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#10b981', '#00f0ff', '#8b5cf6'],
    });
    rebalanceNetworkFlows(divertRatePct);
    setIsQuickModalOpen(false);
  };

  const projectedWaitReduction = Math.min(75, Math.round(divertRatePct * 1.4 + (bayAdjustment > 0 ? bayAdjustment * 18 : 0)));
  const projectedCo2Savings = Math.round(divertRatePct * 0.8 + (greenFleetPct / 100) * 22);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/75 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-xl rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-obsidian-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  Instant What-If Simulation Runner
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Inject live variables into Erlang-C and network routing
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsQuickModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mt-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Quick Preset Contingencies:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPresetScenario('surge')}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition text-xs font-mono"
              >
                <span className="text-rose-400 font-bold block mb-0.5">● 1.6x Peak Surge</span>
                <span className="text-slate-400 text-[10px]">Test queue buffer limits</span>
              </button>
              <button
                onClick={() => applyPresetScenario('mitigated')}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left transition text-xs font-mono"
              >
                <span className="text-emerald-400 font-bold block mb-0.5">● Dynamic Mitigate</span>
                <span className="text-slate-400 text-[10px]">+2 Bays, 25% Reroute</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="mt-5 space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Inflow Surge Rate:</span>
                <span className="text-cyan-400 font-bold">{surgeMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Dynamic Bays Expansion:</span>
                <span className="text-emerald-400 font-bold">
                  {bayAdjustment > 0 ? `+${bayAdjustment}` : bayAdjustment} Bays
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="3"
                step="1"
                value={bayAdjustment}
                onChange={(e) => setBayAdjustment(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Traffic Inflow Diversion:</span>
                <span className="text-violet-400 font-bold">{divertRatePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={divertRatePct}
                onChange={(e) => setDivertRatePct(parseInt(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Projected Outcomes Preview */}
          <div className="mt-5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] grid grid-cols-2 gap-3 text-center font-mono">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Wait Reduction</span>
              <span className="text-base font-bold text-emerald-400">
                -{projectedWaitReduction}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Est. CO2e Saved</span>
              <span className="text-base font-bold text-cyan-300">
                +{projectedCo2Savings} MT / day
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setIsQuickModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95"
            >
              Apply to Digital Twin
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
