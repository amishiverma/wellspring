import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Layers,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { PREDICTIVE_JAM_DATA } from '../../data/mockData';
import { calculateErlangC } from '../../utils/queueingMath';
import { GravFluxCanvas } from '../common/GravFluxCanvas';

export const GravFluxView: React.FC = () => {
  const { nodes, addBaysToNode, mitigateBottleneck, setSelectedNodeId } = useGraphStore();
  const [spatialIntensity, setSpatialIntensity] = useState<number>(1.2);

  // Erlang C facility calculation rows
  const facilityDiagnostics = nodes.map((node) => {
    const q = calculateErlangC(node.arrivalRate, node.serviceRate, node.activeBays);
    return {
      ...node,
      qCalc: q,
    };
  });

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 
        ========================================================================
        1. VIEW HEADER (Biophilic Floating Glass Card)
        ========================================================================
      */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 text-xs font-sans font-medium mb-3 shadow-xs">
          <Layers className="w-3.5 h-3.5" />
          <span>STEP 02 • SPATIAL GRAV-FLUX TWIN &amp; QUEUEING DYNAMICS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Gravitational Potential Wells &amp; Erlang-C Math Engine
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-3xl font-normal leading-relaxed">
          Modeling municipal waste streams as gravitational flow vectors sinking into high-capacity
          processing wells. Utilizing M/M/c Erlang-C mathematical formulations to identify traffic
          intensity (ρ) bottlenecks before physical gate gridlock manifests.
        </p>
      </div>

      {/* 
        ========================================================================
        2. SPATIAL PHYSICS MAP PREVIEW (Interactive Architectural GravFlux Simulation)
        ========================================================================
      */}
      <GravFluxCanvas
        intensity={spatialIntensity}
        onIntensityChange={setSpatialIntensity}
      />

      {/* 
        ========================================================================
        3. ERLANG-C FORMULATION CARDS (Clean Light Panels)
        ========================================================================
      */}
      <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">
              Core Queueing Theory Formulation (M/M/c Erlang-C)
            </h3>
          </div>
          <span className="text-xs font-sans font-medium text-emerald-800 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200/60 shadow-xs">
            Core Math Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-1.5 shadow-xs">
            <span className="text-stone-500 text-xs font-semibold block">
              Traffic Intensity (ρ)
            </span>
            <div className="text-xl font-semibold tracking-tight text-stone-900 tabular-nums">
              ρ = λ / (c · μ)
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed font-normal">
              Where λ is arrival rate, c is parallel service bays, and μ is service rate. If ρ ≥ 0.85,
              congestive bottleneck triggers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-1.5 shadow-xs">
            <span className="text-stone-500 text-xs font-semibold block">
              Erlang-C Delay Probability
            </span>
            <div className="text-xl font-semibold tracking-tight text-sky-800 tabular-nums">
              P(W &gt; 0) = C(c, a)
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed font-normal">
              Probability that an arriving hauler must queue outside facility intake doors.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-1.5 shadow-xs">
            <span className="text-stone-500 text-xs font-semibold block">
              Mean Queue Length &amp; Delay
            </span>
            <div className="text-xl font-semibold tracking-tight text-emerald-800 tabular-nums">
              Lq = P(W&gt;0) · [ρ / (1 - ρ)]
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed font-normal">
              Average number of idling trucks staged in bay queue. Mean delay Wq = Lq / λ.
            </p>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        4. 24-HOUR PREDICTIVE JAM ACCUMULATION CURVE (Biophilic Glass Chart)
        ========================================================================
      */}
      <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200/50 gap-2 mb-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-base">
              24-Hour Predictive Jam Accumulation Curve
            </h3>
            <p className="text-xs text-stone-500 font-sans font-normal">
              Simulated queue formation across major municipal nodes vs emergency diversion threshold
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-sans font-medium">
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Apex MRF Queue
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Central Hub Queue
            </span>
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Inflow Surge (λ)
            </span>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PREDICTIVE_JAM_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="apexGradBio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="centralGradBio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="hour" stroke="#a8a29e" tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} />
              <YAxis stroke="#a8a29e" tick={{ fontSize: 11, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} unit=" t" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#1c1917',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="apexMrfQueue"
                name="Apex MRF Queue"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#apexGradBio)"
              />
              <Area
                type="monotone"
                dataKey="centralHubQueue"
                name="Central Transfer Queue"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#centralGradBio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 
        ========================================================================
        5. FACILITY ERLANG-C TELEMETRY TABLE (Frosted Glass Table)
        ========================================================================
      */}
      <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/50 mb-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-base">
              Facility-by-Facility Erlang-C Telemetry Table
            </h3>
            <p className="text-xs text-stone-500 font-sans font-normal">
              Live mathematical state for all 8 facilities. Click facility to adjust arrival / bay parameters.
            </p>
          </div>
          <span className="text-xs font-sans font-medium px-3 py-1 rounded-full bg-white/80 text-stone-700 border border-white/80 shadow-xs">
            {nodes.length} Facilities Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-stone-200/60 text-stone-500 text-[10px] uppercase bg-stone-100/50 font-semibold">
                <th className="py-3 px-4 rounded-l-xl">Facility Name</th>
                <th className="py-3 px-3">Arrival λ (t/h)</th>
                <th className="py-3 px-3">Service μ (t/h)</th>
                <th className="py-3 px-3">Bays (c)</th>
                <th className="py-3 px-3">Intensity (ρ)</th>
                <th className="py-3 px-3">Queue (Lq)</th>
                <th className="py-3 px-3">Wait (Wq)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/40">
              {facilityDiagnostics.map((fac) => {
                const isCritical = fac.qCalc.severity === 'critical';
                const isWarning = fac.qCalc.severity === 'warning';

                return (
                  <tr
                    key={fac.id}
                    className="hover:bg-white/80 transition cursor-pointer"
                    onClick={() => setSelectedNodeId(fac.id)}
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-stone-900">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-500 animate-ping'
                              : isWarning
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>{fac.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-stone-600 tabular-nums">{fac.arrivalRate}</td>
                    <td className="py-3.5 px-3 text-stone-600 tabular-nums">{fac.serviceRate}</td>
                    <td className="py-3.5 px-3 font-semibold text-stone-900 tabular-nums">{fac.activeBays}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-semibold tabular-nums ${
                          isCritical
                            ? 'text-rose-600'
                            : isWarning
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {Math.round(fac.qCalc.utilization * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-700 tabular-nums">
                      {fac.qCalc.queueLength} trucks
                    </td>
                    <td className="py-3.5 px-3 text-sky-800 font-semibold tabular-nums">{fac.qCalc.avgWaitMinutes}m</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {fac.qCalc.severity === 'critical'
                          ? 'Critical'
                          : fac.qCalc.severity === 'warning'
                          ? 'Elevated'
                          : 'Nominal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addBaysToNode(fac.id, 1);
                        }}
                        className="px-3 py-1 rounded-full bg-white/80 hover:bg-white text-stone-800 text-xs font-sans font-medium transition border border-stone-200 shadow-xs hover:shadow-sm"
                        title="Add +1 Processing Bay"
                      >
                        +1 Bay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
