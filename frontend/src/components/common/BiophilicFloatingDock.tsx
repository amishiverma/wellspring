import React from 'react';
import {
  Home,
  BarChart3,
  Leaf,
  SlidersHorizontal,
  Bell,
} from 'lucide-react';
import { useSimStore } from '../../stores/simStore';

export const BiophilicFloatingDock: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsQuickModalOpen,
    setIsAIPlannerDrawerOpen,
  } = useSimStore();

  return (
    <aside
      aria-label="Floating Navigation Dock"
      className="hidden xl:flex fixed left-5 top-28 z-40 flex-col items-center py-4 px-2.5 rounded-full bg-white/75 backdrop-blur-2xl border border-white/85 shadow-[0_20px_50px_rgba(15,23,42,0.08)] gap-3 select-none transition-all duration-300"
    >
      {/* 1. Home / Overview */}
      <button
        onClick={() => setActiveTab('overview')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
          activeTab === 'overview' || activeTab === 'sensors'
            ? 'bg-slate-900 text-white shadow-md scale-105'
            : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
        }`}
        title="Dashboard Overview"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* 2. Digital Twin Grid (Grav-Flux & Erlang-C) */}
      <button
        onClick={() => setActiveTab('gravflux')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
          activeTab === 'gravflux'
            ? 'bg-slate-900 text-white shadow-md scale-105'
            : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
        }`}
        title="Digital Twin Grid & Physics"
      >
        <BarChart3 className="w-5 h-5" />
      </button>

      {/* 3. Circular Economy & Re-Feed */}
      <button
        onClick={() => setActiveTab('refeed')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
          activeTab === 'refeed' || activeTab === 'scenarios'
            ? 'bg-slate-900 text-white shadow-md scale-105'
            : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
        }`}
        title="Circular Valorization & Re-Feed"
      >
        <Leaf className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-6 h-[1px] bg-stone-300/60 my-1" />

      {/* 4. What-If Contingency Settings */}
      <button
        onClick={() => setIsQuickModalOpen(true)}
        className="w-11 h-11 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all duration-300"
        title="What-If Contingency Settings"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* 5. Notifications / AI Advisor Alerts with Ping Dot */}
      <button
        onClick={() => setIsAIPlannerDrawerOpen(true)}
        className="relative w-11 h-11 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white/80 transition-all duration-300"
        title="Notifications & AI Insights"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
      </button>
    </aside>
  );
};
