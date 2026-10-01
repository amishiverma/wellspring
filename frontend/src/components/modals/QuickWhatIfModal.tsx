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

  const { rebalanceNetworkFlows } = useGraphStore();

  if (!isQuickModalOpen) return null;

  const handleApply = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#10b981', '#38bdf8', '#0f172a'],
    });
    rebalanceNetworkFlows(divertRatePct);
    setIsQuickModalOpen(false);
  };

  const projectedWaitReduction = Math.min(75, Math.round(divertRatePct * 1.4 + (bayAdjustment > 0 ? bayAdjustment * 18 : 0)));
  const projectedCo2Savings = Math.round(divertRatePct * 0.8 + (greenFleetPct / 100) * 22);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-xl rounded-[32px] p-6 sm:p-8 border border-white/85 shadow-2xl bg-white/85 backdrop-blur-3xl text-stone-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200/50">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-sans font-bold text-stone-900 tracking-tight">
                  Instant What-If Simulation Runner
                </h3>
                <p className="text-xs text-stone-500 font-sans font-normal">
                  Inject live variables into Erlang-C and network routing
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsQuickModalOpen(false)}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-stone-700 block mb-2">
              Quick Preset Contingencies:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => applyPresetScenario('surge')}
                className="p-3 rounded-2xl bg-white/70 hover:bg-rose-50/70 border border-white/80 hover:border-rose-200 text-left transition text-xs font-sans group shadow-xs"
              >
                <span className="text-rose-700 font-semibold block mb-0.5">● 1.6x Peak Surge</span>
                <span className="text-stone-500 text-xs">Test queue buffer limits</span>
              </button>
              <button
                onClick={() => applyPresetScenario('mitigated')}
                className="p-3 rounded-2xl bg-white/70 hover:bg-emerald-50/70 border border-white/80 hover:border-emerald-200 text-left transition text-xs font-sans group shadow-xs"
              >
                <span className="text-emerald-800 font-semibold block mb-0.5">● Dynamic Mitigate</span>
                <span className="text-stone-500 text-xs">+2 Bays, 25% Reroute</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="mt-5 space-y-4 font-sans text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">Inflow Surge Rate:</span>
                <span className="text-stone-900 font-semibold tabular-nums">{surgeMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">Dynamic Bays Expansion:</span>
                <span className="text-emerald-800 font-semibold tabular-nums">
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
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">Traffic Inflow Diversion:</span>
                <span className="text-sky-800 font-semibold tabular-nums">{divertRatePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={divertRatePct}
                onChange={(e) => setDivertRatePct(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>
          </div>

          {/* Projected Outcomes Preview */}
          <div className="mt-5 p-4 rounded-2xl bg-white/60 border border-white/80 grid grid-cols-2 gap-3 text-center font-sans">
            <div className="p-2.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
              <span className="text-xs text-stone-500 font-normal block mb-1">Wait Reduction</span>
              <span className="text-2xl font-semibold tracking-tight text-emerald-800 tabular-nums">
                -{projectedWaitReduction}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-white/80 shadow-xs">
              <span className="text-xs text-stone-500 font-normal block mb-1">Est. CO2e Saved</span>
              <span className="text-2xl font-semibold tracking-tight text-sky-800 tabular-nums">
                +{projectedCo2Savings} MT / day
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              onClick={() => setIsQuickModalOpen(false)}
              className="px-4 py-2 rounded-full bg-white/80 hover:bg-white text-stone-700 text-xs font-sans font-medium transition border border-stone-200/60 shadow-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-95"
            >
              Apply to Digital Twin
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
