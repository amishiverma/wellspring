/**
 * Accurate M/M/c Erlang-C Queueing Math Engine
 * Used to calculate facility utilization, wait probabilities, queue lengths, and bottleneck metrics.
 */

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

export interface ErlangCCalculation {
  utilization: number; // rho
  probWait: number; // P(Wait > 0)
  queueLength: number; // Lq (trucks)
  avgWaitMinutes: number; // Wq (minutes)
  totalSystemTimeMinutes: number; // W (minutes)
  isBottleneck: boolean;
  severity: 'nominal' | 'warning' | 'critical';
}

export function calculateErlangC(
  arrivalRate: number, // lambda (trucks/hour)
  serviceRate: number, // mu (trucks/bay/hour)
  bays: number // c (number of service bays)
): ErlangCCalculation {
  if (arrivalRate <= 0 || serviceRate <= 0 || bays <= 0) {
    return {
      utilization: 0,
      probWait: 0,
      queueLength: 0,
      avgWaitMinutes: 0,
      totalSystemTimeMinutes: 0,
      isBottleneck: false,
      severity: 'nominal',
    };
  }

  // Traffic intensity rho = lambda / (c * mu)
  const totalCapacity = bays * serviceRate;
  const rawRho = arrivalRate / totalCapacity;
  const cappedRho = Math.min(rawRho, 0.985); // numerical stability

  // Calculate sum: sum_{k=0}^{c-1} ( (c*rho)^k / k! )
  const a = arrivalRate / serviceRate; // offered load = c * rho
  let sumK = 0;
  for (let k = 0; k < bays; k++) {
    sumK += Math.pow(a, k) / factorial(k);
  }

  // Erlang C numerator and term
  const termC = Math.pow(a, bays) / (factorial(bays) * (1 - cappedRho));
  const probWait = Math.min(Math.max(termC / (sumK + termC), 0), 0.999);

  // Queue length Lq = P(Wait > 0) * rho / (1 - rho)
  const queueLength = (probWait * cappedRho) / (1 - cappedRho);

  // Average wait time in queue Wq = Lq / lambda (hours -> minutes)
  const avgWaitMinutes = (queueLength / arrivalRate) * 60;

  // Total time in system W = Wq + 1/mu
  const serviceTimeMinutes = (1 / serviceRate) * 60;
  const totalSystemTimeMinutes = avgWaitMinutes + serviceTimeMinutes;

  let severity: 'nominal' | 'warning' | 'critical' = 'nominal';
  if (rawRho >= 0.88 || avgWaitMinutes > 25) {
    severity = 'critical';
  } else if (rawRho >= 0.75 || avgWaitMinutes > 12) {
    severity = 'warning';
  }

  return {
    utilization: rawRho,
    probWait,
    queueLength: Math.max(0, queueLength),
    avgWaitMinutes: Math.max(0, avgWaitMinutes),
    totalSystemTimeMinutes: Math.max(0, totalSystemTimeMinutes),
    isBottleneck: rawRho >= 0.85,
    severity,
  };
}

/**
 * Calculates CO2e emissions based on fleet travel and idle waiting queues
 * Emission factors:
 * - Diesel heavy truck transit: 2.68 kg CO2e / liter (avg 0.38 L / km = ~1.02 kg CO2e / km)
 * - Diesel idle queueing: 2.45 kg CO2e / idle-truck-hour (0.0408 kg CO2e / idle-minute)
 */
export function calculateEmissions(
  totalFlowMTHr: number,
  avgDistanceKm: number,
  totalWaitMinutesAllTrucks: number,
  greenFleetRatio: number = 0.25
): {
  transitEmissionsKg: number;
  idleEmissionsKg: number;
  totalEmissionsKg: number;
  avertedEmissionsKg: number;
} {
  // Base diesel transit emissions
  const truckTrips = Math.ceil(totalFlowMTHr / 12); // ~12 MT per heavy truck
  const transitDieselKg = truckTrips * avgDistanceKm * 1.02;
  const transitActualKg = transitDieselKg * (1 - greenFleetRatio * 0.7); // EV trucks save 70% LC emissions

  // Idle emissions from queue bottlenecks
  const idleDieselKg = (totalWaitMinutesAllTrucks / 60) * 2.45 * truckTrips * 0.5;

  const totalEmissionsKg = transitActualKg + idleDieselKg;
  const baselineEmissionsKg = transitDieselKg * 1.35; // unoptimized baseline
  const avertedEmissionsKg = Math.max(0, baselineEmissionsKg - totalEmissionsKg);

  return {
    transitEmissionsKg: Math.round(transitActualKg * 10) / 10,
    idleEmissionsKg: Math.round(idleDieselKg * 10) / 10,
    totalEmissionsKg: Math.round(totalEmissionsKg * 10) / 10,
    avertedEmissionsKg: Math.round(avertedEmissionsKg * 10) / 10,
  };
}
