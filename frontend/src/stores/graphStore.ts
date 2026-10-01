import { create } from 'zustand';
import { WasteNode, WasteEdge, IncidentAlert } from '../types';
import { INITIAL_NODES, INITIAL_EDGES, INITIAL_ALERTS } from '../data/mockData';
import { calculateErlangC } from '../utils/queueingMath';

interface GraphState {
  nodes: WasteNode[];
  edges: WasteEdge[];
  selectedNodeId: string | null;
  alerts: IncidentAlert[];
  
  // Actions
  setSelectedNodeId: (id: string | null) => void;
  updateNodeArrivalRate: (nodeId: string, deltaRate: number) => void;
  addBaysToNode: (nodeId: string, bayCountDelta: number) => void;
  setNodes: (nodes: WasteNode[]) => void;
  mitigateBottleneck: (facilityId: string) => void;
  dismissAlert: (alertId: string) => void;
  rebalanceNetworkFlows: (divertPct: number) => void;
  recalculateAllNodes: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeId: 'node-apex-mrf',
  alerts: INITIAL_ALERTS,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNodeArrivalRate: (nodeId, deltaRate) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const newRate = Math.max(2, Math.round(node.arrivalRate + deltaRate));
        const q = calculateErlangC(newRate, node.serviceRate, node.activeBays);
        return {
          ...node,
          arrivalRate: newRate,
          currentLoad: Math.min(node.capacity, Math.round(newRate * 7.5)),
          utilization: Math.round(q.utilization * 1000) / 1000,
          queueLength: Math.round(q.queueLength * 10) / 10,
          avgWaitMinutes: Math.round(q.avgWaitMinutes * 10) / 10,
          bottleneckStatus: q.severity,
          pulseRed: q.isBottleneck,
        };
      });
      return { nodes: updatedNodes };
    });
  },

  addBaysToNode: (nodeId, bayCountDelta) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const newBays = Math.max(1, node.activeBays + bayCountDelta);
        const q = calculateErlangC(node.arrivalRate, node.serviceRate, newBays);
        return {
          ...node,
          activeBays: newBays,
          capacity: newBays * 60,
          utilization: Math.round(q.utilization * 1000) / 1000,
          queueLength: Math.round(q.queueLength * 10) / 10,
          avgWaitMinutes: Math.round(q.avgWaitMinutes * 10) / 10,
          bottleneckStatus: q.severity,
          pulseRed: q.isBottleneck,
        };
      });
      return { nodes: updatedNodes };
    });
  },

  setNodes: (nodes) => set({ nodes }),

  mitigateBottleneck: (facilityId) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id !== facilityId) return node;
        const extraBays = node.activeBays + 1;
        const easedArrival = Math.max(6, Math.round(node.arrivalRate * 0.82));
        const q = calculateErlangC(easedArrival, node.serviceRate, extraBays);
        return {
          ...node,
          arrivalRate: easedArrival,
          activeBays: extraBays,
          capacity: extraBays * 55,
          currentLoad: Math.round(node.currentLoad * 0.8),
          utilization: Math.round(q.utilization * 1000) / 1000,
          queueLength: Math.round(q.queueLength * 10) / 10,
          avgWaitMinutes: Math.round(q.avgWaitMinutes * 10) / 10,
          bottleneckStatus: q.severity,
          pulseRed: q.isBottleneck,
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
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  rebalanceNetworkFlows: (divertPct) => {
    set((state) => {
      const factor = 1 - divertPct / 100;
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === 'node-apex-mrf' || node.id === 'node-central-transfer') {
          const adjArrival = Math.round(node.arrivalRate * factor);
          const q = calculateErlangC(adjArrival, node.serviceRate, node.activeBays);
          return {
            ...node,
            arrivalRate: adjArrival,
            currentLoad: Math.round(node.currentLoad * factor),
            utilization: Math.round(q.utilization * 1000) / 1000,
            queueLength: Math.round(q.queueLength * 10) / 10,
            avgWaitMinutes: Math.round(q.avgWaitMinutes * 10) / 10,
            bottleneckStatus: q.severity,
            pulseRed: q.isBottleneck,
          };
        }
        return node;
      });
      return { nodes: updatedNodes };
    });
  },

  recalculateAllNodes: () => {
    set((state) => {
      const updated = state.nodes.map((node) => {
        const q = calculateErlangC(node.arrivalRate, node.serviceRate, node.activeBays);
        return {
          ...node,
          utilization: Math.round(q.utilization * 1000) / 1000,
          queueLength: Math.round(q.queueLength * 10) / 10,
          avgWaitMinutes: Math.round(q.avgWaitMinutes * 10) / 10,
          bottleneckStatus: q.severity,
          pulseRed: q.isBottleneck,
        };
      });
      return { nodes: updated };
    });
  },
}));
