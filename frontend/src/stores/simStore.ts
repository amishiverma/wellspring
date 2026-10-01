import { create } from 'zustand';
import { SensorTelemetry, ScenarioParams, ScenarioComparison } from '../types';
import { INITIAL_SENSORS } from '../data/mockData';

export type ActiveTab = 'landing' | 'overview' | 'sensors' | 'gravflux' | 'scenarios' | 'refeed';

interface SimState {
  activeTab: ActiveTab;
  isPaused: boolean;
  simSpeed: 1 | 2 | 5;
  simulatedTime: string;
  isQuickModalOpen: boolean;
  
  // Scenario inputs
  surgeMultiplier: number;
  bayAdjustment: number;
  divertRatePct: number;
  greenFleetPct: number;
  
  // Sensors
  sensors: SensorTelemetry[];
  packetLogs: string[];
  
  // AI City Planner 3-bullet output (Yash's directive)
  aiPlannerBullets: string[];
  isOptimizing: boolean;
  activeScenarioName: string;
  
  // Benchmark comparison table
  scenarioComparisons: ScenarioComparison[];

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  togglePause: () => void;
  setSimSpeed: (speed: 1 | 2 | 5) => void;
  setIsQuickModalOpen: (open: boolean) => void;
  setSurgeMultiplier: (val: number) => void;
  setBayAdjustment: (val: number) => void;
  setDivertRatePct: (val: number) => void;
  setGreenFleetPct: (val: number) => void;
  applyPresetScenario: (presetKey: 'baseline' | 'surge' | 'mitigated' | 'netzero') => void;
  triggerAIOptimizer: () => void;
  tickTelemetry: () => void;
  fetchAISummaryFromBackend: (
    bottleneckData: Record<string, unknown>,
    suggestions: Record<string, unknown>[],
    apiKey?: string
  ) => Promise<void>;
}

export const useSimStore = create<SimState>((set, get) => ({
  activeTab: 'landing',
  isPaused: false,
  simSpeed: 1,
  simulatedTime: '09:14:22 EST',
  isQuickModalOpen: false,

  surgeMultiplier: 1.0,
  bayAdjustment: 0,
  divertRatePct: 0,
  greenFleetPct: 35,

  sensors: INITIAL_SENSORS,
  packetLogs: [
    '[09:14:21] RX SWARM-A01-NIR: fill=92% purity=97.4% temp=27.3C [OK]',
    '[09:14:20] RX SWARM-C02-HYD: fill=91% vib=64.9Hz status=ALERT [ELEVATED_PRESSURE]',
    '[09:14:19] RX SWARM-N01-OPT: fill=88% battery=92% rssi=-58dBm [NORMAL]',
    '[09:14:17] RX SWARM-B01-BIO: methane_purity=68.4% temp=54.8C [STEADY]',
    '[09:14:15] RX SWARM-M01-IND: induction_temp=660.2C purity=99.7% [MELT_CYCLE_ACTIVE]'
  ],

  aiPlannerBullets: [
    'Divert 18% of North Urban commercial stream to South-West secondary hub to relieve Apex MRF Bay 2.',
    'Ramp up pyrolytic reactor intake temperature by 4% to rapidly homogenize incoming high-density polyethylene batches.',
    'Deploy green electric compactors on Central-Transfer corridor to cut idling emissions by 4.2 MT CO2e daily.'
  ],
  isOptimizing: false,
  activeScenarioName: 'Dynamic Erlang-C Rebalanced State',

  scenarioComparisons: [
    {
      name: 'Unmitigated Baseline',
      throughputMTHr: 1240,
      avgWaitMinutes: 28.4,
      bottleneckCount: 4,
      co2DailyTons: 184.2,
      co2SavedDailyTons: 0,
      costSavingsDailyUsd: 0,
      fleetUtilizationPct: 74.2
    },
    {
      name: 'Active Swarm Re-route (Current)',
      throughputMTHr: 1482,
      avgWaitMinutes: 13.3,
      bottleneckCount: 2,
      co2DailyTons: 142.8,
      co2SavedDailyTons: 41.4,
      costSavingsDailyUsd: 14200,
      fleetUtilizationPct: 91.8
    },
    {
      name: 'Quantum Optimized + Extra Bays',
      throughputMTHr: 1650,
      avgWaitMinutes: 6.8,
      bottleneckCount: 0,
      co2DailyTons: 118.5,
      co2SavedDailyTons: 65.7,
      costSavingsDailyUsd: 28500,
      fleetUtilizationPct: 96.4
    }
  ],

  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setIsQuickModalOpen: (open) => set({ isQuickModalOpen: open }),
  setSurgeMultiplier: (val) => set({ surgeMultiplier: val }),
  setBayAdjustment: (val) => set({ bayAdjustment: val }),
  setDivertRatePct: (val) => set({ divertRatePct: val }),
  setGreenFleetPct: (val) => set({ greenFleetPct: val }),

  applyPresetScenario: (presetKey) => {
    if (presetKey === 'baseline') {
      set({
        surgeMultiplier: 1.0,
        bayAdjustment: 0,
        divertRatePct: 0,
        greenFleetPct: 20,
        activeScenarioName: 'Standard Municipal Baseline',
        aiPlannerBullets: [
          'High risk of unmitigated bottleneck formation at Apex MRF sorting line during 10:00 - 12:00 surge.',
          'Average queue duration expected to exceed 28 minutes, causing 18.6 MT CO2e excess diesel idle emissions.',
          'Recommend triggering Dynamic Inflow Diversion before peak arrival window.'
        ]
      });
    } else if (presetKey === 'surge') {
      set({
        surgeMultiplier: 1.6,
        bayAdjustment: 0,
        divertRatePct: 5,
        greenFleetPct: 25,
        activeScenarioName: 'Holiday Peak Surge (1.6x Load)',
        aiPlannerBullets: [
          'Simulated 60% surge drives Apex MRF and Central Transfer utilization to rho = 1.12 (Severe Overload).',
          'Emergency buffer staging at North Urban Hub required immediately.',
          'Deploy secondary mobile optical sorting units and reroute dry recyclables to East Industrial annex.'
        ]
      });
    } else if (presetKey === 'mitigated') {
      set({
        surgeMultiplier: 1.2,
        bayAdjustment: 2,
        divertRatePct: 25,
        greenFleetPct: 60,
        activeScenarioName: 'Dynamic Queue Mitigation & Green Dispatch',
        aiPlannerBullets: [
          'Erlang-C queue length reduced from 8.9 to 1.8 trucks across all primary hubs.',
          'Average wait time plummeted by 64% (from 24 mins to 8.6 mins).',
          'Net CO2e averted yields 48.6 metric tons daily with $19,400 operational fuel and demurrage savings.'
        ]
      });
    } else if (presetKey === 'netzero') {
      set({
        surgeMultiplier: 1.0,
        bayAdjustment: 3,
        divertRatePct: 35,
        greenFleetPct: 100,
        activeScenarioName: 'Net-Zero Circular High-Throughput Engine',
        aiPlannerBullets: [
          '100% electrified heavy fleet eliminates all diesel exhaust and transit tailpipe emissions.',
          'Maximum circularity index achieved (94.2% landfill diversion).',
          'Secondary material synthesis pipeline yields $38,200/day in recovered high-purity polymer & alloy feedstocks.'
        ]
      });
    }
  },

  triggerAIOptimizer: () => {
    set({ isOptimizing: true });
    setTimeout(() => {
      set({
        isOptimizing: false,
        bayAdjustment: 2,
        divertRatePct: 20,
        greenFleetPct: 55,
        activeScenarioName: 'Yash AI Planner Heuristic Synthesis',
        aiPlannerBullets: [
          'Bottleneck alleviated: Added +2 dynamically scheduled bays to Apex MRF, shifting utilization from rho 0.914 to 0.652.',
          'Carbon Dividend: Averted 44.2 MT CO2e daily by eliminating 420 collective truck idle minutes at transfer gates.',
          'Economic Return: Recovered $18,900/day in recovered circular resins and averted municipal landfill tipping surcharges.'
        ]
      });
    }, 900);
  },

  tickTelemetry: () => {
    set((state) => {
      if (state.isPaused) return state;

      // Small jitter to simulate live sensors
      const updatedSensors = state.sensors.map((s) => {
        const deltaFill = (Math.random() - 0.48) * 0.4;
        const deltaTemp = (Math.random() - 0.5) * 0.3;
        const deltaVib = (Math.random() - 0.5) * 0.8;
        const newFill = Math.min(99, Math.max(10, Math.round((s.fillLevelPct + deltaFill) * 10) / 10));
        
        return {
          ...s,
          fillLevelPct: newFill,
          temperatureC: Math.round((s.temperatureC + deltaTemp) * 10) / 10,
          vibrationHz: Math.max(2, Math.round((s.vibrationHz + deltaVib) * 10) / 10),
          lastPingTimestamp: 'Just now'
        };
      });

      // Pick a random sensor to log
      const randomSensor = updatedSensors[Math.floor(Math.random() * updatedSensors.length)];
      const now = new Date().toTimeString().split(' ')[0];
      const newPacket = `[${now}] RX ${randomSensor.sensorCode}: fill=${randomSensor.fillLevelPct}% temp=${randomSensor.temperatureC}C rssi=${randomSensor.signalRssi}dBm [STREAM_OK]`;

      return {
        sensors: updatedSensors,
        packetLogs: [newPacket, ...state.packetLogs.slice(0, 15)]
      };
    });
  },

  fetchAISummaryFromBackend: async (bottleneckData, suggestions, apiKey) => {
    set({ isOptimizing: true });
    try {
      const res = await fetch('http://localhost:8000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bottleneck_data: bottleneckData,
          suggestions,
          api_key: apiKey ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err?.detail ?? err?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const summaryText: string = data?.summary ?? '';

      // Parse bullet points from the LLM response.
      // Each bullet starts with '•', '-', or a digit+period.
      const bullets = summaryText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0 && /^[•\-\d]/.test(l));

      set({
        isOptimizing: false,
        aiPlannerBullets: bullets.length > 0 ? bullets : [summaryText],
        activeScenarioName: 'AI Executive Summary (Live)',
      });
    } catch (err: any) {
      console.error('[simStore] fetchAISummaryFromBackend failed:', err);
      set({ isOptimizing: false });
    }
  },
}));
