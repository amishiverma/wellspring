import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Box,
  Clock,
  AlertTriangle,
  Radio,
  TrendingUp,
  MoreHorizontal,
  Truck,
  Building2,
  Leaf,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimStore } from '../../stores/simStore';
import { GeospatialSatelliteMap } from './GeospatialSatelliteMap';
import { NodeDetailModal } from './NodeDetailModal';

// Sample 24h material inflow curve for the telemetry sidebar chart
const INFLOW_SERIES = [
  { time: '00:00', inflow: 180 },
  { time: '04:00', inflow: 220 },
  { time: '08:00', inflow: 480 },
  { time: '11:00', inflow: 742 }, // Peak
  { time: '14:00', inflow: 510 },
  { time: '16:00', inflow: 420 },
  { time: '20:00', inflow: 590 },
  { time: '24:00', inflow: 260 },
];

export const OverviewView: React.FC = () => {
  const { nodes: graphNodes } = useGraphStore();
  const { sensors, setIsAIPlannerDrawerOpen } = useSimStore();

  const [timeRange, setTimeRange] = useState<string>('24h');

  // Compute aggregate system metrics
  const criticalCount = graphNodes.filter((n) => n.bottleneckStatus === 'critical').length || 4;

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 
        ========================================================================
        1. TOP 4 EXECUTIVE KPI FLOATING GLASS CARDS (Exact match to reference)
        ========================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Grid Throughput (Soft Emerald Sheen) */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-50/90 via-white/80 to-white/70 backdrop-blur-2xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block leading-tight">
                  Grid Throughput
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-semibold tracking-tight text-stone-900">
                    1,482
                  </span>
                  <span className="text-xs text-stone-400 font-sans font-medium">MT/Day</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-semibold shadow-xs">
              <TrendingUp className="w-3 h-3" /> +12.4%
            </span>
          </div>

          {/* Organic Wave Sparkline SVG */}
          <div className="mt-3 flex justify-end">
            <svg className="w-28 h-6 stroke-emerald-500 fill-none" viewBox="0 0 120 28">
              <path
                d="M 0 20 Q 20 8, 40 18 T 80 12 T 120 6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: Queue Alleviation (Soft Sky Sheen) */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-50/90 via-white/80 to-white/70 backdrop-blur-2xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block leading-tight">
                  Queue Alleviation
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-semibold tracking-tight text-stone-900">
                    -64%
                  </span>
                  <span className="text-xs text-stone-400 font-sans font-medium">Wait Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Organic Wave Sparkline SVG */}
          <div className="mt-3 flex justify-end">
            <svg className="w-28 h-6 stroke-sky-500 fill-none" viewBox="0 0 120 28">
              <path
                d="M 0 12 Q 25 24, 50 14 T 90 20 T 120 8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: Hub Congestion (Soft Coral Sheen) */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-rose-50/90 via-white/80 to-white/70 backdrop-blur-2xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block leading-tight">
                  Hub Congestion
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-semibold tracking-tight text-stone-900">
                    {criticalCount}
                  </span>
                  <span className="text-xs text-stone-400 font-sans font-medium">Critical Nodes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Organic Wave Sparkline SVG */}
          <div className="mt-3 flex justify-end">
            <svg className="w-28 h-6 stroke-rose-400 fill-none" viewBox="0 0 120 28">
              <path
                d="M 0 22 Q 20 18, 45 22 T 85 14 T 120 10"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 4: Spatial Ingestion (Soft Purple Sheen) */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-50/90 via-white/80 to-white/70 backdrop-blur-2xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shadow-xs">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block leading-tight">
                  Spatial Ingestion
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-semibold tracking-tight text-stone-900">
                    12
                  </span>
                  <span className="text-xs text-stone-400 font-sans font-medium">IoT Nodes</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-100/90 text-purple-800 text-xs font-semibold shadow-xs">
              14.2 ms Mesh Sync
            </span>
          </div>

          {/* Organic Wave Sparkline SVG */}
          <div className="mt-3 flex justify-end">
            <svg className="w-28 h-6 stroke-purple-400 fill-none" viewBox="0 0 120 28">
              <path
                d="M 0 18 Q 30 10, 60 16 T 90 22 T 120 14"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. CENTRAL SQUIRCLE MAP (7 Cols) + SWARM TELEMETRY SIDEBAR (5 Cols)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column (7 cols): Photorealistic Satellite Geospatial Squircle Map */}
        <div className="lg:col-span-7 rounded-[36px] bg-white/75 backdrop-blur-2xl border border-white/85 p-3.5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col h-[690px] relative overflow-hidden">
          <GeospatialSatelliteMap className="w-full h-full" />
        </div>

        {/* Right Column (5 cols): Real-Time Swarm Telemetry Sidebar */}
        <div className="lg:col-span-5 rounded-[36px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col justify-between h-[690px] space-y-4 overflow-y-auto">
          
          {/* Top Title & Status */}
          <div className="flex items-center justify-between pb-1 border-b border-stone-200/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-sans font-semibold text-base text-stone-900 tracking-tight">
                Real-Time Swarm Telemetry
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Live
              </span>
              <button
                onClick={() => setIsAIPlannerDrawerOpen(true)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-600 flex items-center justify-center border border-white/80 transition shadow-xs"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section: Material Inflow Dynamics AreaChart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-800 block">
                  Material Inflow Dynamics
                </span>
                <span className="text-xs text-stone-500 font-sans font-normal">
                  Municipal tonnage intake curve
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-sans font-medium">
                  Peak Inflow: 742 MT
                </span>
                <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-white/80 px-2 py-0.5 rounded-full border border-stone-200/60 shadow-xs cursor-pointer">
                  <span>Last 24 Hours</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Smooth Spline Chart */}
            <div className="w-full h-28 bg-white/50 rounded-2xl p-2 border border-white/60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={INFLOW_SERIES} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#a8a29e" tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} />
                  <YAxis stroke="#a8a29e" tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} unit="t" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid #e7e5e4',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#inflowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sensor Nodes List (3 Distinct Cards Matching Reference Image) */}
          <div className="space-y-2.5">
            {/* Sensor Card 1: SWARM-N01-OPT (Collection Zone A) */}
            <div className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/80 transition-all duration-300 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-xs text-stone-900">
                      SWARM-N01-OPT
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-stone-100/80 text-stone-700 border border-stone-200/60">
                      Polymer
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    Collection Zone A
                  </span>
                </div>
              </div>

              {/* Circular Gauge / Metrics */}
              <div className="flex items-center gap-4 text-xs font-sans tabular-nums">
                <div className="flex items-center gap-1.5">
                  {/* Circular Gauge Ring */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-stone-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray="78, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[8px] font-bold text-stone-800">78%</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-stone-400 block leading-tight">NIR Purity</span>
                    <span className="font-semibold text-stone-800">78%</span>
                  </div>
                </div>

                <div className="text-right text-[10px]">
                  <span className="text-stone-400 block leading-tight">Temperature</span>
                  <span className="font-semibold text-stone-800">24.1°C</span>
                </div>
              </div>
            </div>

            {/* Sensor Card 2: SWARM-N02-CMP (Sorting Facility) */}
            <div className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/80 transition-all duration-300 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-xs text-stone-900">
                      SWARM-N02-CMP
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-stone-100/80 text-stone-700 border border-stone-200/60">
                      Organic
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    Sorting Facility
                  </span>
                </div>
              </div>

              {/* Circular Gauge / Metrics */}
              <div className="flex items-center gap-4 text-xs font-sans tabular-nums">
                <div className="flex items-center gap-1.5">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-stone-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-sky-500"
                        strokeDasharray="92, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[8px] font-bold text-stone-800">92%</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-stone-400 block leading-tight">NIR Purity</span>
                    <span className="font-semibold text-stone-800">92%</span>
                  </div>
                </div>

                <div className="text-right text-[10px]">
                  <span className="text-stone-400 block leading-tight">Temperature</span>
                  <span className="font-semibold text-stone-800">26.3°C</span>
                </div>
              </div>
            </div>

            {/* Sensor Card 3: SWARM-E01-MET (Processing Unit) */}
            <div className="p-3.5 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/80 transition-all duration-300 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-xs text-stone-900">
                      SWARM-E01-MET
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-stone-100/80 text-stone-700 border border-stone-200/60">
                      Metals
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    Processing Unit
                  </span>
                </div>
              </div>

              {/* Circular Gauge / Metrics */}
              <div className="flex items-center gap-4 text-xs font-sans tabular-nums">
                <div className="flex items-center gap-1.5">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-stone-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-500"
                        strokeDasharray="88, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[8px] font-bold text-stone-800">88%</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-stone-400 block leading-tight">NIR Purity</span>
                    <span className="font-semibold text-stone-800">88%</span>
                  </div>
                </div>

                <div className="text-right text-[10px]">
                  <span className="text-stone-400 block leading-tight">Temperature</span>
                  <span className="font-semibold text-stone-800">28.7°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Synthesized Material Quality */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white/80 to-white/70 border border-emerald-200/70 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-xs text-stone-900 leading-tight">
                  Synthesized Material Quality
                </h4>
                <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                  Compliant with Circular Economy Standards
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-semibold shrink-0 shadow-xs">
              ✔ 98% Compliance Rate
            </span>
          </div>
        </div>
      </div>

      {/* Facility Inspection Side Modal */}
      <NodeDetailModal />
    </div>
  );
};
