import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  LayoutGrid,
  Network,
  Box,
  Sparkles,
  Play,
  Pause,
  Leaf,
} from 'lucide-react';
import { useSimStore, ActiveTab } from '../../stores/simStore';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isPaused,
    togglePause,
    simSpeed,
    setSimSpeed,
    setIsAIPlannerDrawerOpen,
  } = useSimStore();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview & Telemetry',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: 'gravflux',
      label: 'Grav-Flux Twin',
      icon: <Network className="w-3.5 h-3.5" />,
    },
    {
      id: 'scenarios',
      label: 'Simulation & Re-Feed',
      icon: <Box className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="w-full z-40 px-4 sm:px-8 pt-5 pb-2 font-sans select-none pointer-events-none">
      <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        
        {/* Left Module 1: Return to Landing */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 backdrop-blur-xl border border-white/85 shadow-[0_10px_25px_rgba(0,0,0,0.04)] text-xs font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>Landing</span>
          </button>

          {/* Module 2: Brand Capsule */}
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-xl border border-white/85 shadow-[0_10px_25px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-wide text-stone-900 block leading-tight">
                WELLSPRING
              </span>
              <span className="text-[9px] font-mono text-stone-500 block uppercase tracking-wider leading-tight">
                TWIN V2.4
              </span>
            </div>
          </div>
        </div>

        {/* Center Module 3: Main Segmented Capsule */}
        <nav className="flex items-center bg-white/80 backdrop-blur-2xl border border-white/85 p-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] gap-1">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'overview' && activeTab === 'sensors') ||
              (tab.id === 'scenarios' && activeTab === 'refeed');

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-md'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Module 4: Simulation Controls Capsule & AI Advisor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/85 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
            <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
              Simulation Speed
            </span>

            <div className="flex items-center bg-stone-100/80 p-0.5 rounded-full border border-stone-200/50">
              <button
                onClick={togglePause}
                className="w-6 h-6 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition text-xs"
                title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
              >
                {isPaused ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
              </button>

              {([1, 2, 5] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                    simSpeed === speed && !isPaused
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAIPlannerDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200/60 text-xs font-medium transition shadow-xs hover:border-emerald-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Advisor</span>
            </button>

            {/* User Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white shadow-xs bg-stone-200 flex items-center justify-center text-[11px] font-bold text-stone-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="hidden">A</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
