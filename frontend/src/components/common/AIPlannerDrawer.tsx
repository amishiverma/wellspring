import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Leaf,
  CheckCircle2,
  Cpu,
  Loader2,
  ShieldCheck,
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
  } = useSimStore();

  const { nodes, deployGlobalOptimization } = useGraphStore();

  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const criticalNodes = nodes.filter((n) => n.bottleneckStatus === 'critical' || n.pulseRed);

  const handleDeployOptimization = () => {
    setIsDeploying(true);

    // 1. Brief 1-second pulse animation
    setTimeout(() => {
      // 2. State Transition (The "Solved" State)
      deployGlobalOptimization();
      triggerAIOptimizer();
      setIsDeploying(false);
      setIsSolved(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 95,
        spread: 75,
        origin: { x: 0.8, y: 0.5 },
        colors: ['#10b981', '#38bdf8', '#8b5cf6'],
      });

      // Show floating success toast
      setShowToast(true);

      // 3. Auto-close drawer after 1.5 seconds
      setTimeout(() => {
        setIsAIPlannerDrawerOpen(false);
        setTimeout(() => setShowToast(false), 3000);
      }, 1500);
    }, 1000);
  };

  return (
    <>
      {/* 
        ========================================================================
        SUBTLE TOP-RIGHT SUCCESS TOAST
        ========================================================================
      */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-400/40 text-white shadow-2xl font-sans text-xs select-none"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block text-emerald-400">
                Network Optimization Deployed
              </span>
              <span className="text-[11px] text-stone-300 font-normal">
                2 Service Bays Dispatched. Inflow Rerouted to Central Buffer.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        ========================================================================
        AI CITY PLANNER SLIDE-OVER DRAWER (FROSTED GLASSMORPHISM DESIGN)
        ========================================================================
      */}
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

            {/* Biophilic Frosted Glass Side Sheet */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-screen max-w-md sm:max-w-lg bg-white/92 backdrop-blur-2xl border-l border-white/80 shadow-[-20px_0_60px_rgba(15,23,42,0.12)] flex flex-col justify-between overflow-hidden"
              >
                {/* Sheet Header */}
                <div className="p-6 border-b border-stone-200/50 bg-white/60 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-lg text-stone-900 tracking-tight">
                        AI City Planner
                      </h3>
                      <p className="text-xs text-stone-500 font-sans font-normal">
                        Automated Heuristics Engine • Active Twin Insights
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAIPlannerDrawerOpen(false)}
                    className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sheet Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Telemetry Diagnostics Status Card */}
                  <div className="p-4 rounded-2xl bg-white/80 border border-stone-200/60 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        Telemetry Diagnostics
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium border ${
                          isSolved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse'
                            : criticalNodes.length > 0
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isSolved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Optimization Deployed • Dynamic Equilibrium Achieved</span>
                          </>
                        ) : criticalNodes.length > 0 ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{criticalNodes.length} Critical Jam{criticalNodes.length > 1 ? 's' : ''} Detected</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Network Balanced</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">
                      Active Scenario:{' '}
                      <span className="text-stone-900 font-medium">
                        Autonomous Neural Dispatch Matrix. Erlang-C stochastic queue optimization active across all municipal processing nodes.
                      </span>
                    </p>
                  </div>

                  {/* Top 3 Heuristic Directives (Squircle Cards with Soft Pills) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        Top 3 Heuristic Recommendations
                      </span>
                      <span className="text-[11px] font-sans text-emerald-800 font-medium">
                        Heuristics Engine
                      </span>
                    </div>

                    {aiPlannerBullets.map((bullet, idx) => {
                      const pillStyle =
                        idx === 0
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
                          : idx === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                          : 'bg-sky-50 text-sky-700 border border-sky-100/80';

                      const tagLabel =
                        idx === 0 ? 'High Impact' : idx === 1 ? 'Optimization' : 'Equilibrium';

                      return (
                        <div
                          key={idx}
                          className="bg-white/80 border border-stone-200/60 rounded-2xl p-4 shadow-sm space-y-2 hover:bg-white transition-all duration-200"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1.5 text-stone-900 font-sans font-semibold">
                              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Directive 0{idx + 1}</span>
                            </span>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${pillStyle}`}>
                              {tagLabel}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 font-sans leading-relaxed font-normal">
                            {bullet}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Carbon & Financial Projected Gains Cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-stone-800 block">
                      Projected Scenario Gains
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-sans font-medium mb-1">
                          <Leaf className="w-3.5 h-3.5" />
                          <span>Carbon Offset</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight font-sans text-stone-900 tabular-nums">
                          41.4 <span className="text-xs font-normal text-stone-500">MT / Day</span>
                        </span>
                        <span className="text-xs text-stone-500 font-normal block mt-1">
                          2.68 kg CO2/L diesel factor
                        </span>
                      </div>

                      <div className="bg-sky-50/50 border border-sky-100/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-1.5 text-sky-800 text-xs font-sans font-medium mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Daily Savings</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight font-sans text-stone-900 tabular-nums">
                          $14,200 <span className="text-xs font-normal text-stone-500">USD</span>
                        </span>
                        <span className="text-xs text-stone-500 font-normal block mt-1">
                          Throughput optimization
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sheet Actions Footer */}
                <div className="p-6 border-t border-stone-200/50 bg-white/60 space-y-3">
                  <button
                    onClick={handleDeployOptimization}
                    disabled={isDeploying || isSolved}
                    className="w-full py-3.5 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span>Balancing Network Vectors...</span>
                      </>
                    ) : isSolved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Optimization Deployed Successfully</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Deploy AI Optimization &amp; Mitigate</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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
    </>
  );
};
