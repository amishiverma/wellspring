import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import {
  Truck,
  Building2,
  Cpu,
  Layers,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { WasteNode } from '../../types';

export const CustomWasteNode = memo(({ data }: NodeProps<WasteNode>) => {
  const {
    id,
    name,
    type,
    utilization,
    activeBays,
    queueLength,
    avgWaitMinutes,
    bottleneckStatus,
    pulseRed, // Explicit Amishi directive from agents.md
    currentLoad,
    capacity,
  } = data;

  const isCritical = bottleneckStatus === 'critical' || pulseRed;
  const isWarning = bottleneckStatus === 'warning';

  const typeConfig = {
    source: {
      badge: 'SOURCE SWARM',
      icon: <Truck className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
    },
    transfer: {
      badge: 'TRANSFER HUB',
      icon: <Building2 className="w-3.5 h-3.5 text-violet-400" />,
      color: 'border-violet-500/40 text-violet-300',
    },
    sorting: {
      badge: 'MRF OPTICAL',
      icon: <Cpu className="w-3.5 h-3.5 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
    },
    processing: {
      badge: 'CIRCULAR RE-FEED',
      icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-300',
    },
    sink: {
      badge: 'INERT RESIDUE',
      icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
      color: 'border-slate-500/40 text-slate-300',
    },
  }[type];

  const utilPct = Math.min(100, Math.round(utilization * 100));

  return (
    <motion.div
      animate={
        pulseRed
          ? {
              boxShadow: [
                '0 0 0px rgba(244, 63, 94, 0.4)',
                '0 0 25px rgba(244, 63, 94, 0.8)',
                '0 0 0px rgba(244, 63, 94, 0.4)',
              ],
              borderColor: ['rgba(244, 63, 94, 0.6)', 'rgba(244, 63, 94, 1)', 'rgba(244, 63, 94, 0.6)'],
              scale: [1, 1.015, 1],
            }
          : {}
      }
      transition={
        pulseRed
          ? {
              repeat: Infinity,
              duration: 1.8,
              ease: 'easeInOut',
            }
          : undefined
      }
      className={`relative w-72 rounded-2xl glass-panel p-4 border transition-all duration-200 cursor-pointer shadow-2xl ${
        isCritical
          ? 'border-rose-500/80 bg-rose-950/20'
          : isWarning
          ? 'border-amber-500/60 bg-amber-950/15'
          : 'border-white/[0.1] hover:border-emerald-500/50 hover:bg-slate-900/90'
      }`}
    >
      {/* Target input handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-obsidian-950"
      />

      {/* Top micro badge with status pill */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
            {typeConfig.icon}
          </span>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold uppercase">
            {typeConfig.badge}
          </span>
        </div>

        {pulseRed ? (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            BOTTLENECK
          </span>
        ) : isWarning ? (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            ELEVATED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            NOMINAL
          </span>
        )}
      </div>

      {/* Facility title */}
      <h4 className="text-sm font-display font-semibold text-white tracking-tight line-clamp-1 mb-2">
        {name}
      </h4>

      {/* Utilization bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
          <span className="text-slate-400">Traffic Intensity (ρ)</span>
          <span
            className={`font-bold ${
              isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {utilPct}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${utilPct}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full rounded-full ${
              isCritical
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
        </div>
      </div>

      {/* Queue & Bays stats footer */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono">
        <div className="bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
          <span className="block text-[9px] text-slate-400 uppercase">Bays (c)</span>
          <span className="text-xs font-bold text-white">{activeBays}</span>
        </div>

        <div className="bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
          <span className="block text-[9px] text-slate-400 uppercase">Queue (Lq)</span>
          <span
            className={`text-xs font-bold ${
              queueLength > 5 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {queueLength} trucks
          </span>
        </div>

        <div className="bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
          <span className="block text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-slate-400" /> Wq
          </span>
          <span
            className={`text-xs font-bold ${
              avgWaitMinutes > 15 ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {avgWaitMinutes}m
          </span>
        </div>
      </div>

      {/* Source output handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-obsidian-950"
      />
    </motion.div>
  );
});

CustomWasteNode.displayName = 'CustomWasteNode';
