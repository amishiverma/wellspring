import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimStore } from '../../stores/simStore';
import { useGraphStore } from '../../stores/graphStore';

export const ScenarioEngineView: React.FC = () => {
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
    aiPlannerBullets,
    triggerAIOptimizer,
    isOptimizing,
    activeScenarioName,
  } = useSimStore();

  const { rebalanceNetworkFlows } = useGraphStore();

  const handleApplyChanges = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00f0ff', '#10b981'],
    });
    rebalanceNetworkFlows(divertRatePct);
  };

  const chartData = scenarioComparisons.map((sc) => ({
    name: sc.name.split(' ')[0] + ' ' + (sc.name.split(' ')[1] || ''),
    avgWait: sc.avgWaitMinutes,
    co2Emissions: sc.co2DailyTons,
    co2Saved: sc.co2SavedDailyTons,
    costSaved: sc.costSavingsDailyUsd / 1000, // in $k
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono mb-2">
          <GitBranch className="w-3.5 h-3.5" />
          <span>STEP 03 • PARALLEL SCENARIO ENGINE &amp; MONTE-CARLO DISPATCH</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
          Discrete-Event Quantum What-If Runner
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-light leading-relaxed">
          Simulate parallel municipal contingencies in real-time. Test inflow surges, secondary routing
          diversions, extra sorting bays, and heavy fleet electrification to quantify exact wait time reductions,
          CO2e savings (2.68 kg/L fuel factor), and economic dividends.
        </p>
      </div>

      {/* Preset Scenario Cards */}
      <div>
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3 pl-1">
          Select Standard Municipal Contingency:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              key: 'baseline',
              label: 'Unmitigated Baseline',
              desc: 'Standard nominal municipal inflow without dynamic diversion.',
              badge: 'STATUS QUO',
              color: 'hover:border-slate-500',
            },
            {
              key: 'surge',
              label: 'Holiday Peak Surge (1.6x)',
              desc: 'Simulates 60% surge in packaging and holiday commercial waste.',
              badge: 'STRESS TEST',
              color: 'hover:border-rose-500',
            },
            {
              key: 'mitigated',
              label: 'Dynamic Queue Mitigation',
              desc: 'Automated 25% diversion with +2 dynamic service bays.',
              badge: 'BALANCED',
              color: 'hover:border-emerald-500',
            },
            {
              key: 'netzero',
              label: 'Net-Zero Circular Fleet',
              desc: '100% electrified heavy trucks + maximized circular re-feed.',
              badge: 'ZERO EMISSION',
              color: 'hover:border-cyan-500',
            },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => applyPresetScenario(preset.key as any)}
              className={`p-4 rounded-2xl glass-panel text-left border border-white/[0.08] ${preset.color} transition-all duration-200 group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.06] font-bold">
                  {preset.badge}
                </span>
              </div>
              <h4 className="font-display font-bold text-white text-sm group-hover:text-emerald-400 transition">
                {preset.label}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                {preset.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Interactive Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Scenario Sliders */}
        <div className="p-6 rounded-3xl glass-panel border border-white/[0.08] space-y-6">
          <div className="pb-4 border-b border-white/[0.06]">
            <h3 className="font-display font-bold text-white text-base">
              Scenario Control Parameters
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live variable injection into Erlang-C model
            </p>
          </div>

          {/* Inflow Surge Multiplier */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Inflow Surge Multiplier (λ)</span>
              <span className="text-cyan-400 font-bold">{surgeMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.1"
              value={surgeMultiplier}
              onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.8x (Downtime)</span>
              <span>1.0x (Nominal)</span>
              <span>2.2x (Severe Surge)</span>
            </div>
          </div>

          {/* Active Bays Adjustment */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Dynamic Bays Expansion (c)</span>
              <span className="text-emerald-400 font-bold">
                {bayAdjustment > 0 ? `+${bayAdjustment}` : bayAdjustment} Bays
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="3"
              step="1"
              value={bayAdjustment}
              onChange={(e) => setBayAdjustment(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>-1 Bay</span>
              <span>0 (Baseline)</span>
              <span>+3 Bays</span>
            </div>
          </div>

          {/* Diversion Rate */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Inflow Diversion Rate</span>
              <span className="text-violet-400 font-bold">{divertRatePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="5"
              value={divertRatePct}
              onChange={(e) => setDivertRatePct(parseInt(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0% Direct</span>
              <span>25% Balanced</span>
              <span>45% Max Reroute</span>
            </div>
          </div>

          {/* Green Electric Fleet Ratio */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Green EV Fleet Adoption</span>
              <span className="text-emerald-400 font-bold">{greenFleetPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={greenFleetPct}
              onChange={(e) => setGreenFleetPct(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>10% Diesel Heavy</span>
              <span>50% Hybrid</span>
              <span>100% Zero-Emission</span>
            </div>
          </div>

          {/* Execute Simulation Action */}
          <div className="pt-2">
            <button
              onClick={handleApplyChanges}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-98 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Re-Calculate System Flow
            </button>
          </div>
        </div>

        {/* Right Column: Comparative Benchmark Visualizations (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparative Metrics Chart */}
          <div className="p-6 rounded-3xl glass-panel border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] mb-4 gap-2">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  Scenario Impact Comparison
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Wait Time (mins) vs Daily CO2e Saved (MT) vs Cost Saved ($k/day)
                </p>
              </div>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07090e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgWait" name="Avg Queue Wait (mins)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="co2Saved" name="CO2e Saved (MT/day)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="costSaved" name="Cost Savings ($k/day)" fill="#00f0ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yash AI City Planner 3-Bullet Prescribed Output */}
          <div className="p-6 rounded-3xl glass-panel border border-violet-500/30 bg-violet-950/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h4 className="font-display font-bold text-white text-sm">
                  AI City Planner Recommendations (3-Bullet Synthesis)
                </h4>
              </div>
              <button
                onClick={triggerAIOptimizer}
                disabled={isOptimizing}
                className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-mono border border-violet-500/30 hover:bg-violet-500/30 transition"
              >
                {isOptimizing ? 'Generating...' : 'Regenerate Analysis'}
              </button>
            </div>

            <div className="space-y-2.5">
              {aiPlannerBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
