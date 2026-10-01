import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
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
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { PREDICTIVE_JAM_DATA } from '../../data/mockData';
import { calculateErlangC } from '../../utils/queueingMath';

export const GravFluxView: React.FC = () => {
  const { nodes, addBaysToNode, mitigateBottleneck, setSelectedNodeId } = useGraphStore();

  // Erlang C facility calculation rows
  const facilityDiagnostics = nodes.map((node) => {
    const q = calculateErlangC(node.arrivalRate, node.serviceRate, node.activeBays);
    return {
      ...node,
      qCalc: q,
    };
  });

  // Chart data for facility queue distribution
  const queueBarData = nodes.map((n) => ({
    name: n.name.split(' ')[0] + ' ' + (n.name.split(' ')[1] || ''),
    queueLength: n.queueLength,
    waitMinutes: n.avgWaitMinutes,
    utilization: Math.round(n.utilization * 100),
    isCritical: n.bottleneckStatus === 'critical',
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-mono mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>STEP 02 • GRAV-FLUX STATE ANALYSIS &amp; QUEUEING DYNAMICS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
          Gravitational Potential Wells &amp; Erlang-C Math Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-light leading-relaxed">
          Modeling municipal waste streams as gravitational flow vectors sinking into high-capacity
          processing wells. Utilizing M/M/c Erlang-C mathematical formulations to identify traffic
          intensity (ρ) bottlenecks before physical conveyor or gate gridlock manifests.
        </p>
      </div>

      {/* Erlang-C Mathematical Formula Card */}
      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-obsidian-900 via-obsidian-950 to-obsidian-900 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-bold text-white text-base">
              Core Queueing Theory Formulation (M/M/c Erlang-C)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            Tanishq Core Algorithm Specification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Traffic Intensity (ρ)
            </span>
            <div className="text-lg font-bold text-emerald-400 py-1 font-mono">
              ρ = λ / (c · μ)
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1">
              Where λ is truck arrival rate, c is active parallel service bays, and μ is bay service rate.
              If ρ ≥ 0.85, bottleneck warning triggers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Erlang-C Delay Probability
            </span>
            <div className="text-base font-bold text-cyan-300 py-1 font-mono">
              P(W &gt; 0) = C(c, a)
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1">
              Probability that an arriving disposal truck must queue in the facility approach lane.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">
              Mean Queue Length &amp; Delay
            </span>
            <div className="text-base font-bold text-violet-300 py-1 font-mono">
              Lq = P(W&gt;0) · [ρ / (1 - ρ)]
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1">
              Average number of idle trucks staged in queue. Mean delay Wq = Lq / λ.
            </p>
          </div>
        </div>
      </div>

      {/* 24-Hour Predictive Jam Heatmap (AreaChart) */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-2 mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              24-Hour Predictive Jam Accumulation Curve
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Simulated queue formation across major nodes vs emergency diversion threshold
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Apex MRF Queue
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Central Hub Queue
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Inflow Surge (λ)
            </span>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PREDICTIVE_JAM_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="apexGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="centralGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" t" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#07090e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="apexMrfQueue"
                name="Apex MRF Queue"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#apexGrad)"
              />
              <Area
                type="monotone"
                dataKey="centralHubQueue"
                name="Central Transfer Queue"
                stroke="#00f0ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#centralGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facility Bottleneck Diagnostic Table */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              Facility-by-Facility Erlang-C Telemetry Table
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live mathematical state for all 8 facilities. Click facility to open deep controls.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {nodes.length} Facilities Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 text-[10px] uppercase">
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-3">Arrival λ (t/h)</th>
                <th className="py-3 px-3">Service μ (t/h)</th>
                <th className="py-3 px-3">Bays (c)</th>
                <th className="py-3 px-3">Intensity (ρ)</th>
                <th className="py-3 px-3">Queue (Lq)</th>
                <th className="py-3 px-3">Wait (Wq)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {facilityDiagnostics.map((fac) => {
                const isCritical = fac.qCalc.severity === 'critical';
                const isWarning = fac.qCalc.severity === 'warning';

                return (
                  <tr
                    key={fac.id}
                    className="hover:bg-white/[0.02] transition cursor-pointer"
                    onClick={() => setSelectedNodeId(fac.id)}
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical
                              ? 'bg-rose-500 animate-ping'
                              : isWarning
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>{fac.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{fac.arrivalRate}</td>
                    <td className="py-3.5 px-3 text-slate-300">{fac.serviceRate}</td>
                    <td className="py-3.5 px-3 text-white font-bold">{fac.activeBays}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold ${
                          isCritical
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {Math.round(fac.qCalc.utilization * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">
                      {Math.round(fac.qCalc.queueLength * 10) / 10} trucks
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold ${
                          fac.qCalc.avgWaitMinutes > 15 ? 'text-rose-400' : 'text-cyan-400'
                        }`}
                      >
                        {Math.round(fac.qCalc.avgWaitMinutes * 10) / 10}m
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {fac.qCalc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isCritical ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            mitigateBottleneck(fac.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-obsidian-950 font-bold text-[11px] hover:bg-emerald-400 transition"
                        >
                          Mitigate
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addBaysToNode(fac.id, 1);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] transition flex items-center gap-1 ml-auto"
                        >
                          <Plus className="w-3 h-3" /> Bay
                        </button>
                      )}
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
