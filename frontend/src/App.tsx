import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimStore } from './stores/simStore';
import { Navbar } from './components/common/Navbar';
import { LandingPageView } from './components/landing/LandingPageView';
import { OverviewView } from './components/overview/OverviewView';
import { SensorSwarmView } from './components/sensors/SensorSwarmView';
import { GravFluxView } from './components/gravflux/GravFluxView';
import { ScenarioEngineView } from './components/scenarios/ScenarioEngineView';
import { MaterialRefeedView } from './components/refeed/MaterialRefeedView';
import { QuickWhatIfModal } from './components/modals/QuickWhatIfModal';

export const App: React.FC = () => {
  const { activeTab, tickTelemetry, isPaused, simSpeed } = useSimStore();

  // Simulated live telemetry loop
  useEffect(() => {
    if (isPaused) return;
    const intervalTime = Math.max(800, Math.floor(3000 / simSpeed));
    const timer = setInterval(() => {
      tickTelemetry();
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPaused, simSpeed, tickTelemetry]);

  // Fullscreen Cinematic Landing Experience (1:1 with Reposé Residence)
  if (activeTab === 'landing') {
    return (
      <div className="relative min-h-screen text-white overflow-x-hidden selection:bg-white selection:text-black">
        <LandingPageView />
        <QuickWhatIfModal />
      </div>
    );
  }

  // Digital Twin Mission Control Console Mode
  return (
    <div className="relative min-h-screen bg-obsidian-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle background ambient grid & glows */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-20" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area with Smooth Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'sensors' && <SensorSwarmView />}
            {activeTab === 'gravflux' && <GravFluxView />}
            {activeTab === 'scenarios' && <ScenarioEngineView />}
            {activeTab === 'refeed' && <MaterialRefeedView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Quick What-If Modal */}
      <QuickWhatIfModal />

      {/* Executive Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-obsidian-950/90 backdrop-blur-xl py-8 mt-12 text-slate-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white tracking-wider text-sm">
              MIND<span className="text-emerald-400">OVER</span>MATTER
            </span>
            <span className="text-slate-600">|</span>
            <span>Waste Flow Digital Twin &amp; Autonomous Grav-Flux Analyzer</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span>
              Frontend: <span className="text-emerald-400">Amishi</span>
            </span>
            <span>•</span>
            <span>
              API &amp; DB: <span className="text-cyan-400">Vrinda</span>
            </span>
            <span>•</span>
            <span>
              Queueing Math: <span className="text-violet-400">Tanishq</span>
            </span>
            <span>•</span>
            <span>
              AI &amp; CO2 Optimizer: <span className="text-amber-400">Yash</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Erlang-C M/M/c • D3/Sankey • React Flow • 2.68 kg CO2e/L Diesel Standard
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
