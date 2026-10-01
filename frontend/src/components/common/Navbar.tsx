import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Radio,
  GitBranch,
  Layers,
  Recycle,
  Play,
  Pause,
  Zap,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useSimStore, ActiveTab } from '../../stores/simStore';
import { useGraphStore } from '../../stores/graphStore';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isPaused,
    togglePause,
    simSpeed,
    setSimSpeed,
    setIsQuickModalOpen,
    simulatedTime,
    triggerAIOptimizer,
    isOptimizing,
  } = useSimStore();

  const { nodes, alerts } = useGraphStore();
  const criticalCount = nodes.filter((n) => n.bottleneckStatus === 'critical').length;

  const navItems: { id: ActiveTab; label: string; step?: string; icon: React.ReactNode }[] = [
    {
      id: 'landing',
      label: 'Landing Page',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'overview',
      label: 'Mission Control',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'sensors',
      step: '01',
      label: 'Sensor Swarm',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: 'gravflux',
      step: '02',
      label: 'Grav-Flux Analysis',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'scenarios',
      step: '03',
      label: 'Quantum Scenarios',
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      id: 'refeed',
      step: '04',
      label: 'Material Re-Feed',
      icon: <Recycle className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-obsidian-950/80 backdrop-blur-2xl">
      {/* Top micro-bar for system status and live metrics */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-1.5 text-[11px] font-mono border-b border-white/[0.04] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            DIGITAL TWIN: RUNNING
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">
            Erlang-C Engine: <span className="text-cyan-400">M/M/c Active</span>
          </span>
          <span className="hidden lg:inline text-slate-600">|</span>
          <span className="hidden lg:inline text-slate-400">
            Telemetry Rate: <span className="text-slate-200">120 Hz Swarm Sync</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{criticalCount} CRITICAL BOTTLENECK{criticalCount > 1 ? 'S' : ''} DETECTED</span>
            </motion.div>
          )}
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            {simulatedTime}
          </span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-violet-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Recycle className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-tight text-white text-base sm:text-lg">
                MIND<span className="text-emerald-400">OVER</span>MATTER
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                v2.4
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider uppercase text-slate-400 -mt-0.5">
              Waste Flow Digital Twin
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <nav className="hidden md:flex items-center gap-1 bg-obsidian-900/90 p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className={`${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.step && (
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isActive
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : 'bg-white/[0.05] text-slate-500'
                      }`}
                    >
                      {item.step}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Simulation speed controls */}
          <div className="hidden sm:flex items-center gap-1 bg-obsidian-900/90 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={togglePause}
              title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd as 1 | 2 | 5)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition ${
                  simSpeed === spd
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* AI City Planner trigger button */}
          <button
            onClick={triggerAIOptimizer}
            disabled={isOptimizing}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-medium transition shadow-[0_0_15px_rgba(139,92,246,0.15)] disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-violet-400 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Synthesizing...' : 'AI Planner'}</span>
          </button>

          {/* Quick What-If button */}
          <button
            onClick={() => setIsQuickModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-semibold text-xs transition shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Run</span> What-If
          </button>
        </div>
      </div>

      {/* Mobile nav drawer row */}
      <div className="md:hidden flex items-center justify-around py-2 px-2 bg-obsidian-900 border-t border-white/[0.04] overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
