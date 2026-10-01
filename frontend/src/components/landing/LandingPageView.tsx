import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ArrowRight,
  Radio,
  Layers,
  GitBranch,
  Recycle,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimStore } from '../../stores/simStore';
import { ReposeCanvas } from './ReposeCanvas';

export const LandingPageView: React.FC = () => {
  const { setActiveTab } = useSimStore();
  const [flightProgress, setFlightProgress] = useState(0);

  // Continuously map window scroll to the full 139-frame animation across the entire page
  useEffect(() => {
    const handleScroll = () => {
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / totalScrollable));
      setFlightProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterConsole = () => {
    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#10b981', '#00f0ff', '#ffffff'],
    });
    setActiveTab('overview');
  };

  const scrollToStory = () => {
    const el = document.getElementById('story-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full text-white selection:bg-white selection:text-black">
      {/* 
        ========================================================================
        CONTINUOUS VIDEO ANIMATION BACKDROP:
        Fixed to the viewport across the entire page journey.
        As the user scrolls down, the video continuously scrubs through the 
        clouds, down to the skyline, into the streets, and down to the building!
        ========================================================================
      */}
      <ReposeCanvas progress={flightProgress} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Floating Top Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-6 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="font-repose text-2xl sm:text-3xl font-normal tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Wellspring
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={handleEnterConsole}
            className="px-5 py-2.5 rounded-full bg-black/50 hover:bg-white text-white hover:text-black border border-white/30 hover:border-white text-[11px] font-mono tracking-widest uppercase transition-all duration-300 backdrop-blur-md shadow-2xl flex items-center gap-2 group"
          >
            <span>Enter Mission Control</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* 
        ========================================================================
        1. HERO VIEWPORT (Image 1 from reference website)
        Rendered directly on top of the initial high-altitude cloudscape
        ========================================================================
      */}
      <section className="relative z-10 w-full h-screen flex flex-col justify-between p-6 sm:p-12 md:p-16 select-none">
        <div className="w-full" />

        {/* Left Side: Editorial Serif Title & Divider */}
        <div className="relative max-w-3xl text-left my-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-repose text-7xl sm:text-8xl md:text-9xl text-white font-medium sm:font-semibold leading-[0.92] tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              Flow without
              <br />
              friction.
            </h1>

            {/* Delicate Horizontal Rule */}
            <div className="w-20 sm:w-28 h-[1px] bg-white/75 my-5 drop-shadow" />

            {/* Subline with Spaced Tracking */}
            <p className="font-sans text-[11px] sm:text-xs tracking-[0.28em] text-white/95 uppercase font-light drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Predictive intelligence for materials that never stop moving.
            </p>
          </motion.div>
        </div>

        {/* Bottom Bar: Center "SCROLL" + Bottom-Right Status Card */}
        <div className="relative w-full flex items-end justify-between">
          <div className="hidden sm:block sm:w-56 text-[11px] font-mono text-white/70 tracking-wider drop-shadow-md">
            ENTERPRISE DEPLOYMENT • BUILD 2.4
          </div>

          {/* Center SCROLL indicator */}
          <div
            onClick={scrollToStory}
            className="flex flex-col items-center gap-2 cursor-pointer pb-2 text-white/90 hover:text-white transition group drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            <span className="text-[10px] tracking-[0.32em] font-sans uppercase font-medium">
              SCROLL
            </span>
            <div className="w-[1px] h-8 bg-white/60 group-hover:bg-white transition" />
            <ChevronDown className="w-4 h-4 text-white/90 group-hover:text-white transition -mt-1 animate-bounce" />
          </div>

          {/* Bottom Right: Status Card */}
          <div className="text-right font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-white/70 uppercase block mb-0.5">
              ACTIVE RUNTIME
            </span>
            <span className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white block">
              FLUX KERNEL 2.4
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-white/80 uppercase block mt-0.5">
              STOCHASTIC NETWORK EQUILIBRIUM
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-[0.3em] text-emerald-300 uppercase block mt-1 font-mono">
              14MS MESH • CONTINUOUS DISPATCH • CLOSED LOOP
            </span>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        2. "WHY DIGITAL TWIN?" (Appearing ON TOP OF THE LIVING VIDEO)
        As the user scrolls here, the video continues descending into the skyline!
        ========================================================================
      */}
      <section
        id="story-section"
        className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-32 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto space-y-8 p-8 sm:p-12 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-white/[0.08] border border-white/[0.15] text-xs font-mono tracking-widest text-emerald-400 uppercase">
            WHY DIGITAL TWIN?
          </div>

          <h2 className="font-repose text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.08] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            Built for municipal scale. <br />
            <span className="font-repose italic font-light text-emerald-300">
              Engineered for zero congestion.
            </span>
          </h2>

          <p className="font-sans text-base sm:text-xl text-slate-200 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            Municipal waste flow is not static residue—it is high-volume mass flowing through dynamic networks. 
            By combining M/M/c Erlang-C queueing mathematics, discrete-event simulation, and geospatial satellite intelligence, 
            WellSpring pinpoints gate bottlenecks, eliminates hauler gridlock, and drives circular valorization before delays cascade across the city.
          </p>

          {/* 4 Stat Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:border-white/25 transition">
              <span className="text-3xl sm:text-4xl font-repose text-white font-normal block">
                1,482
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-300 mt-1 block">
                MT / Day Throughput
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:border-emerald-400/40 transition">
              <span className="text-3xl sm:text-4xl font-repose text-emerald-400 font-normal block">
                -64%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-300 mt-1 block">
                Queue Wait Alleviation
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:border-cyan-400/40 transition">
              <span className="text-3xl sm:text-4xl font-repose text-cyan-300 font-normal block">
                142.8
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-300 mt-1 block">
                MT CO2e Averted / Day
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:border-violet-400/40 transition">
              <span className="text-3xl sm:text-4xl font-repose text-violet-300 font-normal block">
                0.88
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-300 mt-1 block">
                Ellen MacArthur MCI
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 
        ========================================================================
        3. THE FOUR SYSTEM PHASES (Appearing ON TOP OF THE LIVING VIDEO)
        Video animation continues descending through the city streets!
        Frosted glass cards allow the video to shine through!
        ========================================================================
      */}
      <section className="relative z-10 py-28 px-6 sm:px-12 max-w-6xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto space-y-3 p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-lg"
        >
          <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold">
            FOUR CORE CAPABILITIES
          </span>
          <h3 className="font-repose text-4xl sm:text-5xl text-white font-normal drop-shadow-md">
            Digital Twin Architecture
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-sans font-light">
            Continuous telemetry, discrete-event queueing math, and closed-loop circular synthesis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Phase 01 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-cyan-400/60 hover:bg-black/45 transition-all duration-300 flex flex-col justify-between group shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-widest text-cyan-300 uppercase font-bold px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  STEP 01
                </span>
                <Radio className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="font-repose text-2xl sm:text-3xl text-white font-normal mb-3 group-hover:text-cyan-300 transition">
                Sensor Swarm &amp; Spatial Ingestion
              </h4>
              <p className="font-sans text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                48 spatial IoT telemetry nodes broadcasting real-time optical NIR spectroscopy,
                hydraulic compactor strain metrics, and LoRaWAN packet streams across municipal facilities.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">14.2ms Packet Mesh</span>
              <button
                onClick={() => setActiveTab('sensors')}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono uppercase transition flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <span>Inspect Swarm</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Phase 02 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-violet-400/60 hover:bg-black/45 transition-all duration-300 flex flex-col justify-between group shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-widest text-violet-300 uppercase font-bold px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30">
                  STEP 02
                </span>
                <Layers className="w-5 h-5 text-violet-400" />
              </div>
              <h4 className="font-repose text-2xl sm:text-3xl text-white font-normal mb-3 group-hover:text-violet-300 transition">
                Queueing Science &amp; Erlang-C Dynamics
              </h4>
              <p className="font-sans text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                Facilities modeled as gravitational potential wells. M/M/c Erlang-C mathematical
                formulation computes traffic intensity ρ = λ / (c · μ), queue lengths, and 24-hr predictive jam heatmaps.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">Stochastic Queue Math Engine</span>
              <button
                onClick={() => setActiveTab('gravflux')}
                className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-xs font-mono uppercase transition flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                <span>Analyze Flux</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Phase 03 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-emerald-400/60 hover:bg-black/45 transition-all duration-300 flex flex-col justify-between group shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-widest text-emerald-300 uppercase font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  STEP 03
                </span>
                <GitBranch className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-repose text-2xl sm:text-3xl text-white font-normal mb-3 group-hover:text-emerald-300 transition">
                Quantum Scenario Simulation Engine
              </h4>
              <p className="font-sans text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                Parallel what-if scenario runner. Test inflow surges, secondary routing diversions,
                and fleet electrification to evaluate emissions reductions (2.68 kg CO2/L diesel factor).
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">Autonomous Neural Optimizer</span>
              <button
                onClick={() => setActiveTab('scenarios')}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono uppercase transition flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <span>Run Scenarios</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Phase 04 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-amber-400/60 hover:bg-black/45 transition-all duration-300 flex flex-col justify-between group shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-widest text-amber-300 uppercase font-bold px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  STEP 04
                </span>
                <Recycle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-repose text-2xl sm:text-3xl text-white font-normal mb-3 group-hover:text-amber-300 transition">
                Material Re-Feed &amp; Circular Synthesis
              </h4>
              <p className="font-sans text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                Closed-loop valorization transforming sorted streams into certified Prime rPET/rHDPE
                pellets, thermophilic biogas fertilizer, and secondary aluminium alloys.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">93.4% Landfill Diversion</span>
              <button
                onClick={() => setActiveTab('refeed')}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono uppercase transition flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <span>Explore Re-Feed</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 
        ========================================================================
        4. SYSTEM ARCHITECTURE MODULES
        ========================================================================
      */}
      <section className="relative z-10 py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-2 p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-lg"
        >
          <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">
            ENTERPRISE DEPLOYMENT • BUILD 2.4
          </span>
          <h3 className="font-repose text-3xl sm:text-4xl text-white font-normal">
            System Architecture Modules
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Integrated multi-agent architecture powering the WellSpring Digital Twin
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-6 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-emerald-400/50 hover:bg-black/45 transition shadow-xl"
          >
            <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 font-bold font-sans">
              FE
            </span>
            <span className="font-display font-bold text-white text-sm block">Frontend Engine</span>
            <span className="text-[10px] text-emerald-400 uppercase mt-0.5 block font-bold">
              Geospatial UI Twin
            </span>
            <p className="text-[11px] text-slate-300 font-sans mt-2 font-light">
              Geospatial Satellite Twin, dynamic pulseRed indicators, Zustand state, and biophilic UI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-cyan-400/50 hover:bg-black/45 transition shadow-xl"
          >
            <span className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 font-bold font-sans">
              API
            </span>
            <span className="font-display font-bold text-white text-sm block">API &amp; DB Gateway</span>
            <span className="text-[10px] text-cyan-400 uppercase mt-0.5 block font-bold">
              Data Pipeline
            </span>
            <p className="text-[11px] text-slate-300 font-sans mt-2 font-light">
              FastAPI pipeline, Pydantic v2 data contracts, SQLite telemetry persistence, and CORS.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-6 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-violet-400/50 hover:bg-black/45 transition shadow-xl"
          >
            <span className="w-9 h-9 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center mx-auto mb-3 font-bold font-sans">
              QM
            </span>
            <span className="font-display font-bold text-white text-sm block">Stochastic Math</span>
            <span className="text-[10px] text-violet-400 uppercase mt-0.5 block font-bold">
              Simulation Engine
            </span>
            <p className="text-[11px] text-slate-300 font-sans mt-2 font-light">
              M/M/c Erlang-C queuing models, SimPy event simulator, and NetworkX Max-Flow solver.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="p-6 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 hover:border-amber-400/50 hover:bg-black/45 transition shadow-xl"
          >
            <span className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 font-bold font-sans">
              AI
            </span>
            <span className="font-display font-bold text-white text-sm block">Neural Optimizer</span>
            <span className="text-[10px] text-amber-400 uppercase mt-0.5 block font-bold">
              AI &amp; CO2 Heuristics
            </span>
            <p className="text-[11px] text-slate-300 font-sans mt-2 font-light">
              CO2e emission calculator (2.68 kg/L fuel factor), heuristics, and LLM City Planner.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 
        ========================================================================
        5. GRAND LAUNCH CONSOLE CTA (Appearing ON TOP OF THE LIVING VIDEO)
        Camera approaches the building entrance!
        ========================================================================
      */}
      <section className="relative z-10 py-28 px-6 sm:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto space-y-6 p-10 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
        >
          <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-bold">
            EXPERIENCE THE INTERACTIVE TWIN
          </span>
          <h3 className="font-repose text-4xl sm:text-6xl text-white font-normal">
            Enter Mission Control
          </h3>
          <p className="text-slate-200 font-sans text-sm font-light max-w-md mx-auto leading-relaxed">
            Step into the live Geospatial Satellite digital twin, trigger dynamic Erlang-C bay adjustments, and run
            parallel quantum what-if scenarios in real-time.
          </p>

          <div className="pt-4">
            <button
              onClick={handleEnterConsole}
              className="px-8 py-4 rounded-full bg-white hover:bg-emerald-400 text-black font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] active:scale-95 inline-flex items-center gap-3"
            >
              <span>Launch WellSpring Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
