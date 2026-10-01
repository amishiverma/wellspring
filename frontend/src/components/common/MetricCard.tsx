import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendGood?: boolean;
  icon: React.ReactNode;
  accentColor?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'violet';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  trend = 'neutral',
  trendGood = true,
  icon,
  accentColor = 'emerald',
  subtitle,
  onClick,
}) => {
  const colorMap = {
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      bar: 'bg-emerald-400',
    },
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]',
      bar: 'bg-cyan-400',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      bar: 'bg-amber-400',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
      bar: 'bg-rose-400',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
      bar: 'bg-violet-400',
    },
  };

  const scheme = colorMap[accentColor];

  const isPositiveTrend = trend === 'up';
  const isGood = trendGood ? isPositiveTrend : !isPositiveTrend;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative p-5 rounded-2xl glass-panel transition-all duration-300 border border-white/[0.08] ${scheme.border} ${scheme.glow} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/[0.02] blur-xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        {change && (
          <div
            className={`flex items-center gap-1 font-mono text-[11px] ${
              trend === 'neutral'
                ? 'text-slate-400'
                : isGood
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}

        {subtitle && (
          <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
};
