import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Recycle,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  Leaf,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CIRCULAR_STREAMS } from '../../data/mockData';

export const MaterialRefeedView: React.FC = () => {
  const [tonnageMultiplier, setTonnageMultiplier] = useState<number>(1.0);

  const streams = CIRCULAR_STREAMS.map((s) => ({
    ...s,
    calcTonnage: Math.round(s.dailyTonnage * tonnageMultiplier * 10) / 10,
    dailyRevenue: Math.round(s.dailyTonnage * tonnageMultiplier * s.economicValueUsdTon),
    dailyCo2Offset: Math.round(s.dailyTonnage * tonnageMultiplier * (s.offsetCo2KgTon / 1000) * 10) / 10,
  }));

  const totalDailyRevenue = streams.reduce((acc, s) => acc + s.dailyRevenue, 0);
  const totalDailyCo2Offset = streams.reduce((acc, s) => acc + s.dailyCo2Offset, 0);
  const totalTonnage = streams.reduce((acc, s) => acc + s.calcTonnage, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono mb-2">
          <Recycle className="w-3.5 h-3.5" />
          <span>STEP 04 • MATERIAL RE-FEED &amp; CLOSED-LOOP CIRCULAR SYNTHESIS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
          Purity Grading &amp; High-Value Secondary Synthesis
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-light leading-relaxed">
          Transforming sorted municipal and industrial waste streams into prime virgin-equivalent
          feedstocks. Enforcing optical purity thresholds to maximize secondary manufacturing reuse,
          avert landfill surcharges, and achieve high Ellen MacArthur Foundation Circularity Index (MCI).
        </p>
      </div>

      {/* Circularity Scorecard KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_25px_rgba(16,185,129,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Material Circularity (MCI)
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-display font-bold text-emerald-400">0.88 / 1.0</span>
          <span className="text-[10px] font-mono text-emerald-300 block mt-1">
            Ellen MacArthur Foundation Grade A
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 bg-cyan-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Landfill Diversion Rate
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-3xl font-display font-bold text-cyan-300">93.4%</span>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            Only 6.6% inert non-recyclable slag
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-violet-500/30 bg-violet-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Gross Feedstock Yield
            </span>
            <DollarSign className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-3xl font-display font-bold text-violet-300">
            ${(totalDailyRevenue * 30).toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            Per month recovered market value
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Monthly GHG Offset
            </span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-display font-bold text-white">
            {Math.round(totalDailyCo2Offset * 30).toLocaleString()} MT
          </span>
          <span className="text-[10px] font-mono text-emerald-400 block mt-1">
            CO2e avoided vs virgin extraction
          </span>
        </div>
      </div>

      {/* 4-Step Closed Loop Visual Pipeline */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="pb-4 border-b border-white/[0.06] mb-6">
          <h3 className="font-display font-bold text-white text-lg">
            Closed-Loop Circular Synthesis Pipeline
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            From optical ingestion at MRF to secondary injection-molding pellets &amp; organic fertilizers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {[
            {
              step: '01',
              title: 'Hyperspectral Optical NIR',
              desc: 'Air-jet segregation classifies polymers by resin code (PET, HDPE, PP) at 4.2 m/s belt speed.',
              metric: '97.4% Purity Floor',
              color: 'border-cyan-500/40 text-cyan-300',
            },
            {
              step: '02',
              title: 'Aqueous Decontamination',
              desc: 'High-temperature alkaline wash strips labels, adhesives, and organic residues to < 5 ppm.',
              metric: 'Food-Grade Certified',
              color: 'border-emerald-500/40 text-emerald-300',
            },
            {
              step: '03',
              title: 'Pyrolysis & Micro-Extrusion',
              desc: 'Thermochemical depolymerization and twin-screw degassing pelletizes prime flake into uniform beads.',
              metric: 'Virgin Equivalent MFI',
              color: 'border-violet-500/40 text-violet-300',
            },
            {
              step: '04',
              title: 'Secondary Remanufacturing',
              desc: 'Direct rail dispatch to packaging thermoformers, auto-parts stampers, and municipal farm grids.',
              metric: 'Zero Virgin Polymer Used',
              color: 'border-amber-500/40 text-amber-300',
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl glass-panel-subtle border ${s.color} relative flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 font-bold">
                  PHASE {s.step}
                </span>
                <h4 className="font-display font-bold text-white text-sm mt-2">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-emerald-400 font-semibold">
                ✓ {s.metric}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stream Purity Table & Interactive Tonnage Scaler */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] mb-4 gap-4">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              Stream Purity Grading &amp; Economic Value Recovery
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live off-take market valuation based on optical purity certification
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.06]">
            <span className="text-xs font-mono text-slate-400">Scale Throughput:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={tonnageMultiplier}
              onChange={(e) => setTonnageMultiplier(parseFloat(e.target.value))}
              className="accent-emerald-500 cursor-pointer w-24"
            />
            <span className="text-xs font-mono font-bold text-emerald-400">
              {tonnageMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 text-[10px] uppercase">
                <th className="py-3 px-4">Material Fraction</th>
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Purity %</th>
                <th className="py-3 px-3">Grade</th>
                <th className="py-3 px-3">Daily Tonnes</th>
                <th className="py-3 px-3">Offtake ($/MT)</th>
                <th className="py-3 px-3">Daily Gross ($)</th>
                <th className="py-3 px-4">Secondary Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {streams.map((s, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">
                    {s.material}
                  </td>
                  <td className="py-3.5 px-3 text-cyan-400 font-bold">{s.symbol}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-400">{s.purityPct}%</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-slate-200 border border-white/[0.08]">
                      {s.grade}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-200">{s.calcTonnage} MT</td>
                  <td className="py-3.5 px-3 text-slate-300">${s.economicValueUsdTon}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-300">
                    ${s.dailyRevenue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-sans text-xs">
                    {s.secondaryUse}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
