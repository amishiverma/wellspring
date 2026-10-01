import {
  WasteNode,
  WasteEdge,
  SensorTelemetry,
  PredictiveJamPoint,
  CircularStreamMetric,
  IncidentAlert
} from '../types';
import { calculateErlangC } from '../utils/queueingMath';

// 8 Primary Network Facilities
export const INITIAL_NODES: WasteNode[] = [
  {
    id: 'node-north-urban',
    name: 'North Urban Collection Hub',
    type: 'source',
    capacity: 220,
    currentLoad: 175,
    arrivalRate: 28, // trucks/hr
    serviceRate: 10, // trucks/bay/hr
    activeBays: 3,
    utilization: 0.933,
    queueLength: 6.2,
    avgWaitMinutes: 13.3,
    bottleneckStatus: 'critical',
    pulseRed: true,
    description: 'High-density commercial & residential municipal pickup swarm with dynamic compactors.',
    wasteTypes: ['Dry Recyclables', 'Organic Compostable', 'Packaging Polymer'],
    emissionsRateKgHr: 68.4,
    position: { x: 50, y: 120 }
  },
  {
    id: 'node-east-ind',
    name: 'East Industrial Waste Swarm',
    type: 'source',
    capacity: 180,
    currentLoad: 110,
    arrivalRate: 14,
    serviceRate: 8,
    activeBays: 2,
    utilization: 0.875,
    queueLength: 3.8,
    avgWaitMinutes: 16.2,
    bottleneckStatus: 'warning',
    pulseRed: true,
    description: 'Industrial zone aggregating metal shavings, high-density polymer drum waste, and pallets.',
    wasteTypes: ['Ferrous & Alloy Scrap', 'High-Density Polyethylene', 'Rigid Polymers'],
    emissionsRateKgHr: 44.2,
    position: { x: 50, y: 380 }
  },
  {
    id: 'node-central-transfer',
    name: 'Metro Central Transfer Hub',
    type: 'transfer',
    capacity: 350,
    currentLoad: 240,
    arrivalRate: 36,
    serviceRate: 10,
    activeBays: 4,
    utilization: 0.90,
    queueLength: 5.4,
    avgWaitMinutes: 9.0,
    bottleneckStatus: 'critical',
    pulseRed: true,
    description: 'Consolidated intermodal staging station with automated weighbridges and hydraulic packers.',
    wasteTypes: ['Mixed Municipal Solid Waste', 'Baled Cardboard', 'Post-Consumer Film'],
    emissionsRateKgHr: 82.5,
    position: { x: 380, y: 220 }
  },
  {
    id: 'node-apex-mrf',
    name: 'Apex Automated Sorting MRF',
    type: 'sorting',
    capacity: 260,
    currentLoad: 235,
    arrivalRate: 32,
    serviceRate: 7,
    activeBays: 5,
    utilization: 0.914,
    queueLength: 7.1,
    avgWaitMinutes: 13.3,
    bottleneckStatus: 'critical',
    pulseRed: true,
    description: 'State-of-the-art optical sorters, ballistic air-separators, and hyperspectral NIR scanners.',
    wasteTypes: ['PET Flakes', 'HDPE Regrind', 'Single-Stream Mixed Packaging'],
    emissionsRateKgHr: 95.0,
    position: { x: 700, y: 80 }
  },
  {
    id: 'node-bio-reactor',
    name: 'Anaerobic Bioreactor & Syngas',
    type: 'processing',
    capacity: 190,
    currentLoad: 125,
    arrivalRate: 16,
    serviceRate: 6,
    activeBays: 3,
    utilization: 0.888,
    queueLength: 4.1,
    avgWaitMinutes: 15.4,
    bottleneckStatus: 'warning',
    pulseRed: true,
    description: 'High-solids thermophilic biomethanation plant yielding enriched biofertilizer and grid-fed green gas.',
    wasteTypes: ['Organic Food Pulp', 'Market Slurry', 'Agricultural Residue'],
    emissionsRateKgHr: 22.8,
    position: { x: 700, y: 360 }
  },
  {
    id: 'node-polymer-pyrolysis',
    name: 'Circular Polymer Micro-Pelletizer',
    type: 'processing',
    capacity: 160,
    currentLoad: 95,
    arrivalRate: 12,
    serviceRate: 5,
    activeBays: 3,
    utilization: 0.80,
    queueLength: 2.1,
    avgWaitMinutes: 10.5,
    bottleneckStatus: 'nominal',
    pulseRed: false,
    description: 'Decontamination extrusion line converting post-consumer films into prime virgin-equivalent pellets.',
    wasteTypes: ['High-Purity rPET Pellets', 'rHDPE Extrusion Feedstock'],
    emissionsRateKgHr: 31.4,
    position: { x: 1020, y: 60 }
  },
  {
    id: 'node-metallurgy-refeed',
    name: 'Metallurgical Smelt & Re-Feed',
    type: 'processing',
    capacity: 140,
    currentLoad: 68,
    arrivalRate: 8,
    serviceRate: 4,
    activeBays: 3,
    utilization: 0.666,
    queueLength: 1.0,
    avgWaitMinutes: 7.5,
    bottleneckStatus: 'nominal',
    pulseRed: false,
    description: 'Induction furnace melting segregated cans and industrial scrap into reusable secondary ingots.',
    wasteTypes: ['Aluminium 6061 Scrap', 'Ferrous Sheet Bundles'],
    emissionsRateKgHr: 48.0,
    position: { x: 1020, y: 230 }
  },
  {
    id: 'node-landfill-sink',
    name: 'Inert Engineered Safe Landfill',
    type: 'sink',
    capacity: 120,
    currentLoad: 32,
    arrivalRate: 4,
    serviceRate: 5,
    activeBays: 2,
    utilization: 0.40,
    queueLength: 0.3,
    avgWaitMinutes: 4.5,
    bottleneckStatus: 'nominal',
    pulseRed: false,
    description: 'Double-lined leachate containment cell strictly receiving non-recyclable mineral residues (< 5% of total flow).',
    wasteTypes: ['Inert Mineral Slag', 'Non-Recyclable Contaminants'],
    emissionsRateKgHr: 19.5,
    position: { x: 1020, y: 400 }
  }
];

// Initialize queueing math values for accuracy
INITIAL_NODES.forEach(node => {
  const q = calculateErlangC(node.arrivalRate, node.serviceRate, node.activeBays);
  node.utilization = Math.round(q.utilization * 1000) / 1000;
  node.queueLength = Math.round(q.queueLength * 10) / 10;
  node.avgWaitMinutes = Math.round(q.avgWaitMinutes * 10) / 10;
  node.bottleneckStatus = q.severity;
  node.pulseRed = q.isBottleneck;
});

// Inter-facility directed flow edges
export const INITIAL_EDGES: WasteEdge[] = [
  {
    id: 'e-north-central',
    source: 'node-north-urban',
    target: 'node-central-transfer',
    flowRate: 135,
    maxCapacity: 160,
    distanceKm: 14.2,
    transportMode: 'electric_compactor',
    activeVehicles: 12,
    co2PerTonKm: 0.045
  },
  {
    id: 'e-east-central',
    source: 'node-east-ind',
    target: 'node-central-transfer',
    flowRate: 95,
    maxCapacity: 120,
    distanceKm: 18.6,
    transportMode: 'heavy_truck',
    activeVehicles: 8,
    co2PerTonKm: 0.085
  },
  {
    id: 'e-central-apex',
    source: 'node-central-transfer',
    target: 'node-apex-mrf',
    flowRate: 145,
    maxCapacity: 160,
    distanceKm: 11.4,
    transportMode: 'heavy_truck',
    activeVehicles: 14,
    co2PerTonKm: 0.082
  },
  {
    id: 'e-central-bio',
    source: 'node-central-transfer',
    target: 'node-bio-reactor',
    flowRate: 85,
    maxCapacity: 110,
    distanceKm: 9.8,
    transportMode: 'electric_compactor',
    activeVehicles: 7,
    co2PerTonKm: 0.038
  },
  {
    id: 'e-apex-polymer',
    source: 'node-apex-mrf',
    target: 'node-polymer-pyrolysis',
    flowRate: 72,
    maxCapacity: 90,
    distanceKm: 4.5,
    transportMode: 'conveyor',
    activeVehicles: 0,
    co2PerTonKm: 0.012
  },
  {
    id: 'e-apex-metal',
    source: 'node-apex-mrf',
    target: 'node-metallurgy-refeed',
    flowRate: 48,
    maxCapacity: 65,
    distanceKm: 6.2,
    transportMode: 'electric_compactor',
    activeVehicles: 4,
    co2PerTonKm: 0.035
  },
  {
    id: 'e-apex-landfill',
    source: 'node-apex-mrf',
    target: 'node-landfill-sink',
    flowRate: 18,
    maxCapacity: 40,
    distanceKm: 22.0,
    transportMode: 'heavy_truck',
    activeVehicles: 2,
    co2PerTonKm: 0.092
  },
  {
    id: 'e-bio-landfill',
    source: 'node-bio-reactor',
    target: 'node-landfill-sink',
    flowRate: 8,
    maxCapacity: 25,
    distanceKm: 16.5,
    transportMode: 'electric_compactor',
    activeVehicles: 1,
    co2PerTonKm: 0.040
  }
];

// 12 Live IoT Sensor Telemetry Stream Nodes
export const INITIAL_SENSORS: SensorTelemetry[] = [
  {
    id: 'sens-01',
    sensorCode: 'SWARM-N01-OPT',
    facilityId: 'node-north-urban',
    facilityName: 'North Urban Collection Hub',
    streamType: 'polymer',
    fillLevelPct: 88,
    batteryPct: 92,
    temperatureC: 24.2,
    moisturePct: 14.1,
    opticalPurityPct: 94.6,
    vibrationHz: 28.4,
    signalRssi: -58,
    status: 'warning',
    lastPingTimestamp: 'Just now',
    packetHex: '0xFA 0x88 0x18 0x5E 0x1C'
  },
  {
    id: 'sens-02',
    sensorCode: 'SWARM-N02-CMP',
    facilityId: 'node-north-urban',
    facilityName: 'North Urban Collection Hub',
    streamType: 'organic',
    fillLevelPct: 94,
    batteryPct: 84,
    temperatureC: 31.8,
    moisturePct: 62.4,
    opticalPurityPct: 96.2,
    vibrationHz: 42.1,
    signalRssi: -62,
    status: 'alert',
    lastPingTimestamp: '1s ago',
    packetHex: '0xFB 0x94 0x1F 0x3E 0x2A'
  },
  {
    id: 'sens-03',
    sensorCode: 'SWARM-E01-MET',
    facilityId: 'node-east-ind',
    facilityName: 'East Industrial Waste Swarm',
    streamType: 'metals',
    fillLevelPct: 68,
    batteryPct: 96,
    temperatureC: 26.5,
    moisturePct: 8.2,
    opticalPurityPct: 98.9,
    vibrationHz: 19.3,
    signalRssi: -54,
    status: 'online',
    lastPingTimestamp: 'Just now',
    packetHex: '0xFA 0x68 0x1A 0x62 0x13'
  },
  {
    id: 'sens-04',
    sensorCode: 'SWARM-E02-POL',
    facilityId: 'node-east-ind',
    facilityName: 'East Industrial Waste Swarm',
    streamType: 'polymer',
    fillLevelPct: 82,
    batteryPct: 78,
    temperatureC: 28.1,
    moisturePct: 12.0,
    opticalPurityPct: 91.4,
    vibrationHz: 33.7,
    signalRssi: -67,
    status: 'warning',
    lastPingTimestamp: '2s ago',
    packetHex: '0xFC 0x82 0x1C 0x5B 0x21'
  },
  {
    id: 'sens-05',
    sensorCode: 'SWARM-C01-WGH',
    facilityId: 'node-central-transfer',
    facilityName: 'Metro Central Transfer Hub',
    streamType: 'mixed',
    fillLevelPct: 89,
    batteryPct: 100, // Grid powered
    temperatureC: 22.4,
    moisturePct: 24.8,
    opticalPurityPct: 82.5,
    vibrationHz: 58.2,
    signalRssi: -45,
    status: 'warning',
    lastPingTimestamp: 'Just now',
    packetHex: '0xFA 0x89 0x16 0x52 0x3A'
  },
  {
    id: 'sens-06',
    sensorCode: 'SWARM-C02-HYD',
    facilityId: 'node-central-transfer',
    facilityName: 'Metro Central Transfer Hub',
    streamType: 'mixed',
    fillLevelPct: 91,
    batteryPct: 98,
    temperatureC: 38.6,
    moisturePct: 28.1,
    opticalPurityPct: 85.0,
    vibrationHz: 64.9,
    signalRssi: -49,
    status: 'alert',
    lastPingTimestamp: '1s ago',
    packetHex: '0xFD 0x91 0x26 0x55 0x41'
  },
  {
    id: 'sens-07',
    sensorCode: 'SWARM-A01-NIR',
    facilityId: 'node-apex-mrf',
    facilityName: 'Apex Automated Sorting MRF',
    streamType: 'polymer',
    fillLevelPct: 92,
    batteryPct: 100,
    temperatureC: 27.3,
    moisturePct: 7.9,
    opticalPurityPct: 97.4,
    vibrationHz: 48.0,
    signalRssi: -42,
    status: 'alert',
    lastPingTimestamp: 'Just now',
    packetHex: '0xFA 0x92 0x1B 0x61 0x30'
  },
  {
    id: 'sens-08',
    sensorCode: 'SWARM-A02-AIR',
    facilityId: 'node-apex-mrf',
    facilityName: 'Apex Automated Sorting MRF',
    streamType: 'glass',
    fillLevelPct: 74,
    batteryPct: 95,
    temperatureC: 25.0,
    moisturePct: 9.3,
    opticalPurityPct: 96.1,
    vibrationHz: 39.5,
    signalRssi: -47,
    status: 'online',
    lastPingTimestamp: '3s ago',
    packetHex: '0xFA 0x74 0x19 0x60 0x27'
  },
  {
    id: 'sens-09',
    sensorCode: 'SWARM-B01-BIO',
    facilityId: 'node-bio-reactor',
    facilityName: 'Anaerobic Bioreactor & Syngas',
    streamType: 'organic',
    fillLevelPct: 86,
    batteryPct: 90,
    temperatureC: 54.8, // Thermophilic range
    moisturePct: 78.4,
    opticalPurityPct: 98.2,
    vibrationHz: 12.1,
    signalRssi: -56,
    status: 'warning',
    lastPingTimestamp: '1s ago',
    packetHex: '0xFB 0x86 0x36 0x62 0x0C'
  },
  {
    id: 'sens-10',
    sensorCode: 'SWARM-P01-EXT',
    facilityId: 'node-polymer-pyrolysis',
    facilityName: 'Circular Polymer Micro-Pelletizer',
    streamType: 'polymer',
    fillLevelPct: 59,
    batteryPct: 100,
    temperatureC: 198.5, // Melting barrel
    moisturePct: 0.4,
    opticalPurityPct: 99.1,
    vibrationHz: 22.4,
    signalRssi: -40,
    status: 'online',
    lastPingTimestamp: 'Just now',
    packetHex: '0xFA 0x3B 0xC6 0x63 0x16'
  },
  {
    id: 'sens-11',
    sensorCode: 'SWARM-M01-IND',
    facilityId: 'node-metallurgy-refeed',
    facilityName: 'Metallurgical Smelt & Re-Feed',
    streamType: 'metals',
    fillLevelPct: 52,
    batteryPct: 94,
    temperatureC: 660.2, // Aluminium melt
    moisturePct: 0.1,
    opticalPurityPct: 99.7,
    vibrationHz: 18.0,
    signalRssi: -52,
    status: 'online',
    lastPingTimestamp: '2s ago',
    packetHex: '0xFA 0x34 0xFA 0x64 0x12'
  },
  {
    id: 'sens-12',
    sensorCode: 'SWARM-L01-LEC',
    facilityId: 'node-landfill-sink',
    facilityName: 'Inert Engineered Safe Landfill',
    streamType: 'hazardous',
    fillLevelPct: 28,
    batteryPct: 88,
    temperatureC: 21.2,
    moisturePct: 18.5,
    opticalPurityPct: 45.0,
    vibrationHz: 8.5,
    signalRssi: -72,
    status: 'online',
    lastPingTimestamp: '4s ago',
    packetHex: '0xFA 0x1C 0x15 0x2D 0x08'
  }
];

// 24-Hour Predictive Jam Heatmap (Queue Lengths over time)
export const PREDICTIVE_JAM_DATA: PredictiveJamPoint[] = [
  { hour: '00:00', arrivalSurge: 14, apexMrfQueue: 1.2, centralHubQueue: 0.8, pyrolysisQueue: 0.5, divertThreshold: 5.0 },
  { hour: '02:00', arrivalSurge: 11, apexMrfQueue: 0.9, centralHubQueue: 0.6, pyrolysisQueue: 0.4, divertThreshold: 5.0 },
  { hour: '04:00', arrivalSurge: 16, apexMrfQueue: 1.8, centralHubQueue: 1.4, pyrolysisQueue: 0.7, divertThreshold: 5.0 },
  { hour: '06:00', arrivalSurge: 28, apexMrfQueue: 4.2, centralHubQueue: 3.5, pyrolysisQueue: 1.4, divertThreshold: 5.0 },
  { hour: '08:00', arrivalSurge: 42, apexMrfQueue: 7.8, centralHubQueue: 6.2, pyrolysisQueue: 2.8, divertThreshold: 5.0 },
  { hour: '10:00', arrivalSurge: 46, apexMrfQueue: 8.9, centralHubQueue: 7.1, pyrolysisQueue: 3.2, divertThreshold: 5.0 },
  { hour: '12:00', arrivalSurge: 38, apexMrfQueue: 6.8, centralHubQueue: 5.4, pyrolysisQueue: 2.5, divertThreshold: 5.0 },
  { hour: '14:00', arrivalSurge: 35, apexMrfQueue: 5.9, centralHubQueue: 4.8, pyrolysisQueue: 2.1, divertThreshold: 5.0 },
  { hour: '16:00', arrivalSurge: 48, apexMrfQueue: 9.4, centralHubQueue: 7.8, pyrolysisQueue: 3.6, divertThreshold: 5.0 },
  { hour: '18:00', arrivalSurge: 44, apexMrfQueue: 8.2, centralHubQueue: 6.9, pyrolysisQueue: 3.0, divertThreshold: 5.0 },
  { hour: '20:00', arrivalSurge: 30, apexMrfQueue: 4.8, centralHubQueue: 3.9, pyrolysisQueue: 1.9, divertThreshold: 5.0 },
  { hour: '22:00', arrivalSurge: 20, apexMrfQueue: 2.4, centralHubQueue: 2.0, pyrolysisQueue: 1.1, divertThreshold: 5.0 }
];

// Circular Economy Streams & Synthesis Data
export const CIRCULAR_STREAMS: CircularStreamMetric[] = [
  {
    material: 'Polyethylene Terephthalate (rPET)',
    symbol: 'PET-01',
    purityPct: 97.8,
    grade: 'Prime A+',
    dailyTonnage: 44.5,
    economicValueUsdTon: 1180,
    offsetCo2KgTon: 1420,
    secondaryUse: 'Food-grade thermoform packaging & high-tenacity filament'
  },
  {
    material: 'High-Density Polyethylene (rHDPE)',
    symbol: 'HDPE-02',
    purityPct: 96.4,
    grade: 'Grade A',
    dailyTonnage: 38.2,
    economicValueUsdTon: 940,
    offsetCo2KgTon: 1280,
    secondaryUse: 'Industrial drainage piping & blow-molded liquid containers'
  },
  {
    material: 'Thermophilic Organic Biogas Digestate',
    symbol: 'BIO-OG',
    purityPct: 98.6,
    grade: 'Prime A+',
    dailyTonnage: 92.0,
    economicValueUsdTon: 195,
    offsetCo2KgTon: 480,
    secondaryUse: 'Certified organic slow-release nitrogen fertilizer & grid-fed syngas'
  },
  {
    material: 'Aluminium Alloy 6061 & Castings',
    symbol: 'ALU-40',
    purityPct: 99.4,
    grade: 'Prime A+',
    dailyTonnage: 26.8,
    economicValueUsdTon: 2240,
    offsetCo2KgTon: 8900, // Aluminum remelting avoids 95% bauxite refining energy
    secondaryUse: 'Automotive structural brackets & architectural extrusions'
  },
  {
    material: 'Segregated Flint & Amber Glass Cullet',
    symbol: 'GLS-08',
    purityPct: 95.2,
    grade: 'Grade A',
    dailyTonnage: 31.0,
    economicValueUsdTon: 140,
    offsetCo2KgTon: 320,
    secondaryUse: 'Closed-loop furnace bottle blowing & lightweight cellular insulation'
  }
];

// Live Real-Time Incident / Bottleneck Alert Ticker
export const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: 'alt-01',
    timestamp: '09:04:12 AM',
    severity: 'high',
    facilityId: 'node-apex-mrf',
    facilityName: 'Apex Automated Sorting MRF',
    headline: 'Inflow Ingestion Spike Detected (+38%)',
    details: 'Arrival rate reached 32 trucks/hr against nominal 25 trucks/hr rating. Optical sorting conveyor 2 approaching jam limit.',
    actionRecommendation: 'Divert 18% of arriving payload to Central Transfer buffer and activate emergency sorting bay #5.'
  },
  {
    id: 'alt-02',
    timestamp: '08:58:34 AM',
    severity: 'medium',
    facilityId: 'node-north-urban',
    facilityName: 'North Urban Collection Hub',
    headline: 'High Compactor Hydraulic Load (94%)',
    details: 'Moisture sensor 02 reporting elevated slurry density in organic hopper. Truck queuing length reached 6.2 units.',
    actionRecommendation: 'Accelerate transfer truck cycle times and route organic fraction directly to Anaerobic Bioreactor.'
  },
  {
    id: 'alt-03',
    timestamp: '08:42:19 AM',
    severity: 'low',
    facilityId: 'node-bio-reactor',
    facilityName: 'Anaerobic Bioreactor & Syngas',
    headline: 'Optimal Syngas Generation Yield Achieved',
    details: 'Methane purity stabilized at 68.4%. Power generation turbines exporting 2.4 MW green power to municipal grid.',
    actionRecommendation: 'Maintain steady organic slurry feed rate at 16 trucks/hr.'
  }
];
