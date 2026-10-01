import { create } from 'zustand';
import { WasteNode, WasteEdge, IncidentAlert } from '../types';
import { INITIAL_NODES, INITIAL_EDGES, INITIAL_ALERTS } from '../data/mockData';
import { useSimStore } from './simStore';

interface GraphState {
  nodes: WasteNode[];
  edges: WasteEdge[];
  selectedNodeId: string | null;
  alerts: IncidentAlert[];
  isBackendSyncing: boolean;
  lastBackendError: string | null;

  // Actions
  setSelectedNodeId: (id: string | null) => void;
  updateNodeArrivalRate: (nodeId: string, deltaRate: number) => Promise<void>;
  addBaysToNode: (nodeId: string, bayCountDelta: number) => Promise<void>;
  setNodes: (nodes: WasteNode[]) => void;
  mitigateBottleneck: (facilityId: string) => Promise<void>;
  dismissAlert: (alertId: string) => void;
  rebalanceNetworkFlows: (divertPct: number) => Promise<void>;
  recalculateAllNodes: () => Promise<void>;
  fetchSimulationFromBackend: (isWhatIf?: boolean) => Promise<void>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeId: 'node-apex-mrf',
  alerts: INITIAL_ALERTS,
  isBackendSyncing: false,
  lastBackendError: null,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNodeArrivalRate: async (nodeId, deltaRate) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const newRate = Math.max(2, Math.round(node.arrivalRate + deltaRate));
        return {
          ...node,
          arrivalRate: newRate,
          currentLoad: Math.min(node.capacity, Math.round(newRate * 7.5)),
        };
      });
      return { nodes: updatedNodes };
    });
    await get().fetchSimulationFromBackend(true);
  },

  addBaysToNode: async (nodeId, bayCountDelta) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const newBays = Math.max(1, node.activeBays + bayCountDelta);
        return {
          ...node,
          activeBays: newBays,
          capacity: newBays * 60,
        };
      });
      return { nodes: updatedNodes };
    });
    await get().fetchSimulationFromBackend(true);
  },

  setNodes: (nodes) => set({ nodes }),

  mitigateBottleneck: async (facilityId) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== facilityId) return node;
        const extraBays = node.activeBays + 1;
        const easedArrival = Math.max(6, Math.round(node.arrivalRate * 0.82));
        return {
          ...node,
          arrivalRate: easedArrival,
          activeBays: extraBays,
          capacity: extraBays * 55,
          currentLoad: Math.round(node.currentLoad * 0.8),
        };
      });

      const updatedAlerts = state.alerts.filter((a) => a.facilityId !== facilityId);

      return {
        nodes: updatedNodes,
        alerts: [
          {
            id: `alt-${Date.now()}`,
            timestamp: 'Just now',
            severity: 'low',
            facilityId,
            facilityName: state.nodes.find((n) => n.id === facilityId)?.name || 'Facility',
            headline: 'Dynamic Mitigation Deployed Successfully',
            details: 'Active bays augmented by +1. Surge diverted by 18%. Utilization restored to nominal boundary.',
            actionRecommendation: 'Monitoring queue dissipation rate over the next 15-minute telemetry cycle.',
          },
          ...updatedAlerts,
        ],
      };
    });
    await get().fetchSimulationFromBackend(true);
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  rebalanceNetworkFlows: async (divertPct) => {
    const factor = 1 - divertPct / 100;
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === 'node-apex-mrf' || node.id === 'node-central-transfer') {
          const adjArrival = Math.round(node.arrivalRate * factor);
          return {
            ...node,
            arrivalRate: adjArrival,
            currentLoad: Math.round(node.currentLoad * factor),
          };
        }
        return node;
      });
      return { nodes: updatedNodes };
    });
    await get().fetchSimulationFromBackend(true);
  },

  recalculateAllNodes: async () => {
    await get().fetchSimulationFromBackend(true);
  },

  fetchSimulationFromBackend: async (isWhatIf = false) => {
    const { nodes, edges } = get();
    set({ isBackendSyncing: true, lastBackendError: null });

    const backendNodes = nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      capacity: n.capacity,
      currentLoad: n.currentLoad,
      position: n.position || { x: 0, y: 0 },
      arrivalRate: n.arrivalRate,
      serviceRate: n.serviceRate,
      activeBays: n.activeBays,
    }));
    
    const backendEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      distance: e.distanceKm,
      throughput: e.flowRate,
      vehicleType: e.transportMode,
    }));

    const simStoreState = useSimStore.getState();
    const parameters = {
      surgeMultiplier: simStoreState.surgeMultiplier,
      bayAdjustment: simStoreState.bayAdjustment,
      divertRatePct: simStoreState.divertRatePct,
      greenFleetPct: simStoreState.greenFleetPct,
    };

    try {
      const endpoint = isWhatIf ? '/api/whatif' : '/api/simulate';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: backendNodes, edges: backendEdges, parameters }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err?.detail ?? err?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const sim = data?.simulation ?? {};

      const queuingAnalysis: Record<string, any> = {};
      for (const m of (sim?.node_metrics?.queuing_analysis ?? [])) {
        queuingAnalysis[m.node_id] = m;
      }

      set((state) => ({
        isBackendSyncing: false,
        nodes: state.nodes.map((node) => {
          const m = queuingAnalysis[node.id];
          if (!m) return node;
          const util = m.utilization ?? node.utilization;
          const severity: 'nominal' | 'warning' | 'critical' =
            util >= 1.0 ? 'critical' : util >= 0.85 ? 'warning' : 'nominal';
          return {
            ...node,
            utilization: Math.round(util * 1000) / 1000,
            queueLength: m.queue_length != null
              ? Math.round(m.queue_length * 10) / 10
              : node.queueLength,
            avgWaitMinutes: m.wait_time_hours != null
              ? Math.round(m.wait_time_hours * 60 * 10) / 10
              : node.avgWaitMinutes,
            bottleneckStatus: severity,
            pulseRed: m.is_bottleneck ?? node.pulseRed,
          };
        }),
      }));

      if (sim.environmental_metrics && sim.optimizer_suggestions) {
        simStoreState.fetchAISummaryFromBackend(
          sim.environmental_metrics,
          sim.optimizer_suggestions
        );
      }
    } catch (err: any) {
      console.error('[graphStore] fetchSimulationFromBackend failed:', err);
      set({ isBackendSyncing: false, lastBackendError: err?.message ?? 'Unknown error' });
    }
  },
}));
