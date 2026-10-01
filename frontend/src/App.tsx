import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Leaf } from 'lucide-react';
import { useSimStore } from './stores/simStore';
import { Navbar } from './components/common/Navbar';
import { BiophilicFloatingDock } from './components/common/BiophilicFloatingDock';
import { AIPlannerDrawer } from './components/common/AIPlannerDrawer';
import { LandingPageView } from './components/landing/LandingPageView';
import { OverviewView } from './components/overview/OverviewView';
import { GravFluxView } from './components/gravflux/GravFluxView';
import { SimulationRefeedView } from './components/scenarios/SimulationRefeedView';
import { QuickWhatIfModal } from './components/modals/QuickWhatIfModal';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, tickTelemetry, isPaused, simSpeed } = useSimStore();

  // Simulated live telemetry loop
  useEffect(() => {
    if (isPaused) return;
    const intervalTime = Math.max(800, Math.floor(3000 / simSpeed));
    const timer = setInterval(() => {
      tickTelemetry();
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPaused, simSpeed, tickTelemetry]);

  // Fullscreen Cinematic Landing Experience (1:1 with Reposé Residence - COMPLETELY UNTOUCHED)
  if (activeTab === 'landing') {
    return (
      <div className="relative min-h-screen text-white overflow-x-hidden selection:bg-white selection:text-black">
        <LandingPageView />
        <QuickWhatIfModal />
      </div>
    );
  }

  // Biophilic Floating Glassmorphism & Organic Luxury Dashboard Mode
  return (
    <div className="relative min-h-screen text-stone-900 flex flex-col justify-between selection:bg-emerald-700 selection:text-white font-sans overflow-x-hidden">
      {/* 
        ========================================================================
        1. HIGH-RESOLUTION BIOPHILIC NATURE WALLPAPER & TRANSLUCENT OVERLAY
        ========================================================================
      */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/assets/biophilic_bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" />
      </div>

      {/* 
        ========================================================================
        2. LEFT FLOATING VERTICAL NAVIGATION DOCK (Glass Capsule)
        ========================================================================
      */}
      <BiophilicFloatingDock />

      {/* 
        ========================================================================
        3. TOP FLOATING PILL NAVBAR
        ========================================================================
      */}
      <Navbar />

      {/* 
        ========================================================================
        4. MAIN VIEW CONTAINER (Positioned with luxury breathing room for dock)
        ========================================================================
      */}
      <main className="relative z-10 flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 xl:pl-24 pt-3 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab === 'sensors' ? 'overview' : activeTab === 'refeed' ? 'scenarios' : activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Tab 1: Overview & Telemetry (Executive KPI Cards + Squircle Map + Swarm Sidebar) */}
            {(activeTab === 'overview' || activeTab === 'sensors') && <OverviewView />}

            {/* Tab 2: Grav-Flux Twin (Physics Field, Potential Wells, Erlang-C Equations) */}
            {activeTab === 'gravflux' && <GravFluxView />}

            {/* Tab 3: Simulation & Circular Re-Feed (Quantum Scenarios + Closed-Loop Synthesis) */}
            {(activeTab === 'scenarios' || activeTab === 'refeed') && <SimulationRefeedView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Contextual Slide-Over Drawer: AI City Planner */}
      <AIPlannerDrawer />

      {/* Global Quick What-If Modal */}
      <QuickWhatIfModal />

      {/* 
        ========================================================================
        5. TRANSLUCENT FROSTED GLASS FOOTER
        ========================================================================
      */}
      <footer className="relative z-10 w-full bg-white/70 backdrop-blur-xl border-t border-white/80 py-6 mt-8 text-stone-600 text-xs select-none">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 xl:pl-24 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 border border-white/80 text-xs font-sans transition group shadow-xs hover:shadow-sm"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-stone-600 group-hover:-translate-x-1 transition-transform" />
              <span>Landing Page</span>
            </button>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Leaf className="w-3 h-3" />
              </div>
              <span className="font-sans font-bold text-stone-900 tracking-wider text-sm">
                WELL<span className="text-emerald-700">SPRING</span>
              </span>
            </div>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-stone-500">Autonomous Waste Flow Bottleneck Analyzer &amp; Digital Twin</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500 font-sans">
            <span>
              Frontend: <span className="font-semibold text-stone-800">React 18 / Zustand</span>
            </span>
            <span>•</span>
            <span>
              API Gateway: <span className="font-semibold text-stone-800">FastAPI / Pydantic</span>
            </span>
            <span>•</span>
            <span>
              Queueing Math: <span className="font-semibold text-stone-800">Erlang-C Engine</span>
            </span>
            <span>•</span>
            <span>
              Optimization: <span className="font-semibold text-stone-800">Neural Optimizer</span>
            </span>
          </div>

          <div className="text-[10px] text-stone-400 font-sans font-medium">
            Erlang-C M/M/c • Photorealistic Satellite • 2.68 kg CO2e/L Diesel Standard
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
