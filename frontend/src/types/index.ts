export type FacilityType = 'source' | 'transfer' | 'sorting' | 'processing' | 'sink';

export type BottleneckSeverity = 'nominal' | 'warning' | 'critical';

export interface WasteNode {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number; // MT/hr
  currentLoad: number; // MT/hr
  arrivalRate: number; // trucks/hr (lambda)
  serviceRate: number; // trucks/bay/hr (mu)
  activeBays: number; // c (number of processing servers)
  utilization: number; // rho = lambda / (c * mu)
  queueLength: number; // Lq (trucks in queue)
  avgWaitMinutes: number; // Wq (minutes)
  bottleneckStatus: BottleneckSeverity;
  pulseRed: boolean; // boolean prop to trigger Framer Motion animations for bottlenecks
  description: string;
  wasteTypes: string[];
  emissionsRateKgHr: number;
  position: { x: number; y: number };
}

export interface WasteEdge {
  id: string;
  source: string;
  target: string;
  flowRate: number; // MT/hr
  maxCapacity: number; // MT/hr
  distanceKm: number;
  transportMode: 'heavy_truck' | 'electric_compactor' | 'conveyor' | 'pneumatic';
  activeVehicles: number;
  co2PerTonKm: number; // kg CO2e / MT-km
}

export interface SensorTelemetry {
  id: string;
  sensorCode: string;
  facilityId: string;
  facilityName: string;
  streamType: 'organic' | 'polymer' | 'metals' | 'glass' | 'mixed' | 'hazardous';
  fillLevelPct: number;
  batteryPct: number;
  temperatureC: number;
  moisturePct: number;
  opticalPurityPct: number;
  vibrationHz: number;
  signalRssi: number; // dBm
  status: 'online' | 'warning' | 'alert';
  lastPingTimestamp: string;
  packetHex: string;
}

export interface PredictiveJamPoint {
  hour: string;
  arrivalSurge: number;
  apexMrfQueue: number;
  centralHubQueue: number;
  pyrolysisQueue: number;
  divertThreshold: number;
}

export interface ScenarioParams {
  id: string;
  name: string;
  surgeMultiplier: number; // 0.8x to 2.5x
  bayAdjustment: number; // -1 to +3
  divertRatePct: number; // 0% to 50%
  greenRoutingActive: boolean;
}

export interface ScenarioComparison {
  name: string;
  throughputMTHr: number;
  avgWaitMinutes: number;
  bottleneckCount: number;
  co2DailyTons: number;
  co2SavedDailyTons: number;
  costSavingsDailyUsd: number;
  fleetUtilizationPct: number;
}

export interface CircularStreamMetric {
  material: string;
  symbol: string;
  purityPct: number;
  grade: 'Prime A+' | 'Grade A' | 'Industrial B' | 'Fuel Grade';
  dailyTonnage: number;
  economicValueUsdTon: number;
  offsetCo2KgTon: number;
  secondaryUse: string;
}

export interface IncidentAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  facilityId: string;
  facilityName: string;
  headline: string;
  details: string;
  actionRecommendation: string;
}
