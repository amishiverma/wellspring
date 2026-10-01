import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Leaf,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimStore } from '../../stores/simStore';
import { useGraphStore } from '../../stores/graphStore';

export const AIPlannerDrawer: React.FC = () => {
  const {
    isAIPlannerDrawerOpen,
    setIsAIPlannerDrawerOpen,
    aiPlannerBullets,
    triggerAIOptimizer,
    isOptimizing,
    activeScenarioName,
  } = useSimStore();

  const { nodes, mitigateBottleneck } = useGraphStore();
  const criticalNodes = nodes.filter((n) => n.bottleneckStatus === 'critical');

  const handleDeployOptimization = () => {
    confetti({
      particleCount: 85,
      spread: 70,
      origin: { x: 0.8, y: 0.5 },
      colors: ['#10b981', '#38bdf8', '#0f172a'],
    });

    criticalNodes.forEach((node) => {
      mitigateBottleneck(node.id);
    });

    triggerAIOptimizer();
  };

  return (
    <AnimatePresence>
      {isAIPlannerDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Scrim / Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsAIPlannerDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
          />

          {/* Biophilic Glass Side Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md sm:max-w-lg bg-white/85 backdrop-blur-3xl border-l border-white/85 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Sheet Header */}
              <div className="p-6 border-b border-stone-200/50 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-lg text-stone-900">
                      AI City Planner
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                      Yash Heuristics Engine • Active Twin Insights
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAIPlannerDrawerOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sheet Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Active Bottleneck Status Card */}
                <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold tracking-wider uppercase text-stone-500">
                      Telemetry Diagnostics
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                        criticalNodes.length > 0
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {criticalNodes.length > 0 ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{criticalNodes.length} Critical Jam{criticalNodes.length > 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Network Balanced</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Active Scenario:{' '}
                    <span className="text-stone-900 font-medium">{activeScenarioName}</span>.
                    Erlang-C queue predictions calculated across all municipal processing hubs.
                  </p>
                </div>

                {/* 3 City Planner Directives */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                      Top 3 Heuristic Recommendations
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-medium">Yash Rule-Engine</span>
                  </div>

                  {aiPlannerBullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/70 border border-white/80 hover:bg-white/90 transition-all duration-300 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-stone-900 font-mono font-semibold">
                          <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Directive 0{idx + 1}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-medium border border-stone-200">
                          {idx === 0 ? 'HIGH IMPACT' : 'OPTIMIZATION'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-sans leading-relaxed">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Carbon & Financial Impact Cards */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 block">
                    Projected Scenario Gains
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shadow-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-mono font-medium mb-1">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>Carbon Offset</span>
                      </div>
                      <span className="text-xl font-bold font-sans text-stone-900">
                        41.4 <span className="text-xs font-normal text-stone-500">MT / Day</span>
                      </span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        2.68 kg CO2/L diesel factor
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/70 shadow-xs">
                      <div className="flex items-center gap-1.5 text-sky-800 text-xs font-mono font-medium mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Daily Savings</span>
                      </div>
                      <span className="text-xl font-bold font-sans text-stone-900">
                        $14,200 <span className="text-xs font-normal text-stone-500">USD</span>
                      </span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        Throughput optimization
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet Actions Footer */}
              <div className="p-6 border-t border-stone-200/50 bg-white/50 space-y-3">
                <button
                  onClick={handleDeployOptimization}
                  disabled={isOptimizing}
                  className="w-full py-3 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-emerald-400 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>{isOptimizing ? 'Synthesizing...' : 'Deploy AI Optimization & Mitigate'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAIPlannerDrawerOpen(false)}
                  className="w-full py-2 px-4 rounded-full bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-medium transition text-center"
                >
                  Dismiss Drawer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
