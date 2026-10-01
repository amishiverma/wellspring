import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingDown,
  Leaf,
  DollarSign,
  Truck,
  CheckCircle2,
  Recycle,
  Award,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimStore } from '../../stores/simStore';
import { useGraphStore } from '../../stores/graphStore';
import { CIRCULAR_STREAMS } from '../../data/mockData';

export const SimulationRefeedView: React.FC = () => {
  const {
    surgeMultiplier,
    setSurgeMultiplier,
    bayAdjustment,
    setBayAdjustment,
    divertRatePct,
    setDivertRatePct,
    greenFleetPct,
    setGreenFleetPct,
    applyPresetScenario,
    scenarioComparisons,
    activeScenarioName,
  } = useSimStore();

  const { rebalanceNetworkFlows } = useGraphStore();

  // Re-Feed interactive tonnage multiplier
  const [refeedScale, setRefeedScale] = useState<number>(1.0);

  const handleApplySimulation = () => {
    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.65 },
      colors: ['#10b981', '#38bdf8', '#0f172a'],
    });
    rebalanceNetworkFlows(divertRatePct);
  };

  // Calculated streams based on refeedScale
  const streams = CIRCULAR_STREAMS.map((s) => ({
    ...s,
    calcTonnage: Math.round(s.dailyTonnage * refeedScale * 10) / 10,
    dailyRevenue: Math.round(s.dailyTonnage * refeedScale * s.economicValueUsdTon),
    dailyCo2Offset: Math.round(s.dailyTonnage * refeedScale * (s.offsetCo2KgTon / 1000) * 10) / 10,
  }));

  const totalDailyRevenue = streams.reduce((acc, s) => acc + s.dailyRevenue, 0);
  const totalDailyCo2Offset = streams.reduce((acc, s) => acc + s.dailyCo2Offset, 0);
  const totalTonnage = streams.reduce((acc, s) => acc + s.calcTonnage, 0);

  const chartData = scenarioComparisons.map((sc) => ({
    name: sc.name.split(' ')[0] + ' ' + (sc.name.split(' ')[1] || ''),
    avgWait: sc.avgWaitMinutes,
    co2Saved: sc.co2SavedDailyTons,
    costSavingsK: Math.round(sc.costSavingsDailyUsd / 1000),
  }));

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 
        ========================================================================
        1. VIEW HEADER (Biophilic Floating Glass Card)
        ========================================================================
      */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 text-xs font-sans font-medium mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STEP 03 &amp; 04 • WHAT-IF SIMULATION &amp; CIRCULAR RE-FEED</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Scenario Parameter Engine &amp; High-Value Material Synthesis
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-3xl font-normal leading-relaxed">
          Simulate municipal inflow surges, Erlang-C bay adjustments, and secondary routing
          diversions on the left. Monitor real-time closed-loop valorization yields, purity grades,
          and Ellen MacArthur Foundation MCI scorecards on the right.
        </p>
      </div>

      {/* 
        ========================================================================
        2. CONSOLIDATED TWO-COLUMN LAYOUT
        Left: Scenarios (50%) | Right: Circular Synthesis (50%)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ====================================================================
            LEFT COLUMN (6 cols): Scenario Controls & Comparative Benchmarks
            ==================================================================== */}
        <div className="lg:col-span-6 space-y-6">
          {/* Scenario Presets Bar */}
          <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                Scenario Presets
              </span>
              <span className="text-xs font-sans font-medium text-emerald-800 px-3 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-200 shadow-xs">
                Active: {activeScenarioName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => applyPresetScenario('baseline')}
                className="px-3.5 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-white/85 text-xs font-medium text-stone-700 transition text-center shadow-xs"
              >
                Baseline
              </button>
              <button
                onClick={() => applyPresetScenario('surge')}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50/90 hover:bg-rose-100 border border-rose-200 text-xs font-medium text-rose-800 transition text-center shadow-xs"
              >
                1.8x Surge
              </button>
              <button
                onClick={() => applyPresetScenario('mitigated')}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition text-center shadow-md"
              >
                Erlang-C Rebalanced
              </button>
              <button
                onClick={() => applyPresetScenario('netzero')}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium text-emerald-800 transition text-center shadow-xs"
              >
                Net-Zero Circular
              </button>
            </div>
          </div>

          {/* Interactive What-If Parameter Sliders */}
          <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
                  <GitBranch className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">
                  What-If Parameter Adjusters
                </h3>
              </div>
              <span className="text-xs font-sans text-stone-500 font-medium">Live Injection</span>
            </div>

            {/* Slider 1: Inflow Surge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-sans">Municipal Inflow Rate (λ)</span>
                <span className="font-semibold text-stone-900 font-sans tabular-nums">{surgeMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-sans text-stone-400 font-normal">
                <span>0.5x Low Demand</span>
                <span>1.0x Normal</span>
                <span>2.5x Festival Surge</span>
              </div>
            </div>

            {/* Slider 2: Processing Bays */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-sans">Additional Sorting Bays (c)</span>
                <span className="font-semibold text-emerald-800 font-sans tabular-nums">
                  {bayAdjustment > 0 ? `+${bayAdjustment}` : bayAdjustment} Bays
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="4"
                step="1"
                value={bayAdjustment}
                onChange={(e) => setBayAdjustment(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-sans text-stone-400 font-normal">
                <span>-2 Bays (Maintenance)</span>
                <span>0 Nominal</span>
                <span>+4 Emergency Expand</span>
              </div>
            </div>

            {/* Slider 3: Traffic Diversion Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-sans">Congestion Diversion Rate</span>
                <span className="font-semibold text-sky-800 font-sans tabular-nums">{divertRatePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={divertRatePct}
                onChange={(e) => setDivertRatePct(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-sans text-stone-400 font-normal">
                <span>0% Direct Routing</span>
                <span>25% Balanced</span>
                <span>50% Max Secondary Sinks</span>
              </div>
            </div>

            {/* Slider 4: Fleet Electrification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-sans">Fleet Electrification (EV Trucks)</span>
                <span className="font-semibold text-emerald-800 font-sans tabular-nums">{greenFleetPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={greenFleetPct}
                onChange={(e) => setGreenFleetPct(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-sans text-stone-400 font-normal">
                <span>0% Diesel Only</span>
                <span>50% Hybrid Fleet</span>
                <span>100% Zero-Emission</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleApplySimulation}
                className="flex-1 py-3 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Apply Scenario Parameters</span>
              </button>

              <button
                onClick={() => applyPresetScenario('baseline')}
                className="p-3 rounded-full bg-white/80 hover:bg-white border border-white/85 text-stone-600 hover:text-stone-900 transition shadow-xs"
                title="Reset to Baseline"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comparative Benchmarks Chart */}
          <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Scenario Benchmark Comparison
                </h3>
                <p className="text-xs text-stone-500 font-sans font-normal">
                  Wait times (min) vs Daily Cost Savings ($k)
                </p>
              </div>
              <span className="text-xs font-sans font-medium text-stone-400">Recharts Multi-Bar</span>
            </div>

            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" stroke="#a8a29e" tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} />
                  <YAxis stroke="#a8a29e" tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'inherit', fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: '#1c1917',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="avgWait" name="Wait Minutes" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="costSavingsK" name="Savings ($k)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN (6 cols): Circular Re-Feed & Closed-Loop Synthesis
            ==================================================================== */}
        <div className="lg:col-span-6 space-y-6">
          {/* Ellen MacArthur MCI Circularity Scorecard */}
          <div className="rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Material Circularity Index (MCI) Scorecard
                </h3>
              </div>
              <span className="text-xs font-sans font-medium text-emerald-800 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-200 shadow-xs">
                Grade A Certified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3.5 font-sans text-center">
              <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
                <span className="text-xs text-stone-500 font-normal block mb-1">
                  MCI Rating
                </span>
                <span className="text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">0.88</span>
                <span className="text-xs text-stone-400 font-normal block mt-1">Scale 0 to 1.0</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
                <span className="text-xs text-stone-500 font-normal block mb-1">
                  Landfill Diversion
                </span>
                <span className="text-3xl font-semibold tracking-tight text-sky-800 tabular-nums">93.4%</span>
                <span className="text-xs text-stone-400 font-normal block mt-1">Metropolitan Grid</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
                <span className="text-xs text-stone-500 font-normal block mb-1">
                  CO2e Displaced
                </span>
                <span className="text-3xl font-semibold tracking-tight text-emerald-800 tabular-nums">142.8</span>
                <span className="text-xs text-stone-400 font-normal block mt-1">MT / Day</span>
              </div>
            </div>
          </div>

          {/* Interactive Yield Scale Controller */}
          <div className="rounded-[28px] bg-white/75 backdrop-blur-2xl border border-white/85 p-4 shadow-[0_15px_35px_rgba(15,23,42,0.04)] flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">
                Closed-Loop Recovery Multiplier
              </span>
              <span className="text-xs text-stone-500 font-sans font-normal">
                Scale optical NIR sorting efficiency
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={refeedScale}
                onChange={(e) => setRefeedScale(parseFloat(e.target.value))}
                className="accent-slate-900 w-28 cursor-pointer"
              />
              <span className="text-xs font-sans font-semibold text-stone-900 tabular-nums">{refeedScale}x</span>
            </div>
          </div>

          {/* 4 Valorized Secondary Material Feedstocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                High-Purity Secondary Streams
              </span>
              <span className="text-xs font-sans text-stone-600">
                Total Output: <span className="text-emerald-800 font-semibold tabular-nums">{Math.round(totalTonnage)} MT/Day</span>
              </span>
            </div>

            {streams.map((stream) => (
              <div
                key={stream.symbol}
                className="rounded-[28px] bg-white/75 backdrop-blur-2xl border border-white/85 p-4 space-y-3 shadow-[0_15px_35px_rgba(15,23,42,0.04)] hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/90 flex items-center justify-center text-emerald-800 shadow-xs">
                      <Recycle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">
                        {stream.material}
                      </h4>
                      <span className="text-xs text-stone-500 font-sans font-normal">
                        {stream.secondaryUse}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 font-sans text-xs font-medium shadow-xs">
                    {stream.purityPct}% Purity
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-sans">
                  <div className="p-2.5 rounded-xl bg-white/60 border border-white/80">
                    <span className="block text-xs text-stone-500 font-normal">Tonnage</span>
                    <span className="font-semibold text-stone-900 tabular-nums">{stream.calcTonnage} t/day</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/60 border border-white/80">
                    <span className="block text-xs text-stone-500 font-normal">Market Value</span>
                    <span className="font-semibold text-sky-800 tabular-nums">
                      ${Math.round(stream.dailyRevenue / 1000)}k / day
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/60 border border-white/80">
                    <span className="block text-xs text-stone-500 font-normal">CO2 Averted</span>
                    <span className="font-semibold text-emerald-800 tabular-nums">
                      {stream.dailyCo2Offset} t/day
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue & Emissions Mass Balance Summary */}
          <div className="p-5 rounded-[28px] bg-white/80 backdrop-blur-2xl border border-white/85 shadow-[0_15px_35px_rgba(15,23,42,0.04)] flex items-center justify-between text-xs font-sans">
            <div>
              <span className="text-xs text-stone-500 font-normal block mb-1">
                Net Secondary Circular Value
              </span>
              <span className="text-2xl font-semibold tracking-tight text-stone-900 tabular-nums">
                ${Math.round(totalDailyRevenue).toLocaleString()} USD / Day
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-500 font-normal block mb-1">
                Net Fossil Displacement
              </span>
              <span className="text-2xl font-semibold tracking-tight text-emerald-800 tabular-nums">
                {Math.round(totalDailyCo2Offset * 10) / 10} MT CO2e / Day
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
