import React, { useEffect, useRef, useState } from 'react';
import { Zap, Activity, CheckCircle2, RotateCcw } from 'lucide-react';

interface GravFluxCanvasProps {
  className?: string;
  intensity?: number;
  onIntensityChange?: (newVal: number) => void;
}

interface GravityWell {
  id: string;
  name: string;
  subtitle: string;
  potentialText: string;
  statusText: string;
  statusType: 'nominal' | 'high_pull' | 'equilibrium';
  xRatio: number; // 0 to 1
  yRatio: number; // 0 to 1
  mass: number;
  radius: number;
  primaryColor: string; // Hex
  accentColor: string; // Hex
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  history: { x: number; y: number }[];
  targetWellIndex: number;
  life: number;
  maxLife: number;
  speedMultiplier: number;
  baseHue: number;
}

export const GravFluxCanvas: React.FC<GravFluxCanvasProps> = ({
  className = '',
  intensity = 1.2,
  onIntensityChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'streamlines' | 'equipotential'>('streamlines');
  const [localIntensity, setLocalIntensity] = useState<number>(intensity);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  const [fluxMetric, setFluxMetric] = useState<number>(184);

  // Sync internal intensity state if prop changes
  useEffect(() => {
    setLocalIntensity(intensity);
  }, [intensity]);

  const handleSliderChange = (val: number) => {
    setLocalIntensity(val);
    if (onIntensityChange) onIntensityChange(val);
  };

  const handleRebalance = () => {
    setIsRebalancing(true);
    setFluxMetric(142);
    setTimeout(() => {
      setFluxMetric(184);
      setIsRebalancing(false);
    }, 1200);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 500;
    };

    window.addEventListener('resize', handleResize);

    // 3 Primary Facility Potential Wells (Anchor points)
    const wells: GravityWell[] = [
      {
        id: 'node-1',
        name: 'North Collection Hub',
        subtitle: 'Potential: -2.4 kJ/t (Nominal)',
        potentialText: '-2.4 kJ/t',
        statusText: 'Nominal',
        statusType: 'nominal',
        xRatio: 0.22,
        yRatio: 0.50,
        mass: 140,
        radius: 20,
        primaryColor: '#10b981', // Green
        accentColor: '#34d399',
        pulse: 0,
      },
      {
        id: 'node-2',
        name: 'Apex Central MRF',
        subtitle: 'Potential: -6.8 kJ/t (High Pull)',
        potentialText: '-6.8 kJ/t',
        statusText: 'High Pull',
        statusType: 'high_pull',
        xRatio: 0.52,
        yRatio: 0.42,
        mass: 340, // High pull central bottleneck
        radius: 28,
        primaryColor: '#f59e0b', // Amber / Cyan
        accentColor: '#f43f5e',
        pulse: 1.2,
      },
      {
        id: 'node-3',
        name: 'Polymer Re-Feed',
        subtitle: 'Potential: -1.8 kJ/t (Equilibrium)',
        potentialText: '-1.8 kJ/t',
        statusText: 'Equilibrium',
        statusType: 'equilibrium',
        xRatio: 0.80,
        yRatio: 0.56,
        mass: 160,
        radius: 22,
        primaryColor: '#38bdf8', // Sky / Violet
        accentColor: '#8b5cf6',
        pulse: 2.4,
      },
    ];

    // Initialize fluid particle vector streamlines
    const PARTICLE_COUNT = Math.min(140, Math.floor(width / 6));
    let particles: Particle[] = [];

    const initParticle = (pIndex?: number): Particle => {
      const wellIndex = Math.random() < 0.6 ? 1 : Math.random() < 0.5 ? 0 : 2;
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = 80 + Math.random() * (width * 0.4);
      const targetWell = wells[wellIndex];
      const spawnX = targetWell.xRatio * width + Math.cos(angle) * spawnRadius;
      const spawnY = targetWell.yRatio * height + Math.sin(angle) * spawnRadius;

      return {
        x: Math.max(20, Math.min(width - 20, spawnX)),
        y: Math.max(20, Math.min(height - 20, spawnY)),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        history: [],
        targetWellIndex: wellIndex,
        life: 0,
        maxLife: 180 + Math.random() * 220,
        speedMultiplier: 0.8 + Math.random() * 0.6,
        baseHue: 160, // Emerald baseline
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(initParticle(i));
    }

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.015 * localIntensity;

      // Clear canvas with deep obsidian motion blur trail
      ctx.fillStyle = 'rgba(13, 20, 16, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // Compute actual well pixel coordinates
      const wellCoords = wells.map((w) => ({
        ...w,
        x: w.xRatio * width,
        y: w.yRatio * height + (w.id === 'node-1' ? Math.sin(time * 0.8) * 8 : w.id === 'node-2' ? Math.cos(time * 0.6) * 10 : Math.sin(time * 0.9) * 12),
      }));

      // 1. Draw Equipotential Contour Rings (Concentric Potential Field Lines)
      wellCoords.forEach((well) => {
        const ringRadii = [35, 70, 110, 160, 220];
        ringRadii.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(well.x, well.y, r, 0, Math.PI * 2);
          ctx.strokeStyle =
            well.statusType === 'high_pull'
              ? `rgba(245, 158, 11, ${0.14 - idx * 0.025})`
              : well.statusType === 'nominal'
              ? `rgba(16, 185, 129, ${0.12 - idx * 0.02})`
              : `rgba(56, 189, 248, ${0.12 - idx * 0.02})`;
          ctx.lineWidth = viewMode === 'equipotential' ? 1.5 : 0.8;
          if (viewMode === 'equipotential') {
            ctx.setLineDash([4, 6]);
          } else {
            ctx.setLineDash([2, 8]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });

      // 2. Animate Well Pulse Ripples (Node 2 has animated gentle pulse ripple rings)
      wellCoords.forEach((well) => {
        well.pulse = (well.pulse + 0.03) % (Math.PI * 2);

        // Radiant potential well shading
        const radGrad = ctx.createRadialGradient(well.x, well.y, 4, well.x, well.y, well.radius * 3.8);
        radGrad.addColorStop(0, well.primaryColor + '45');
        radGrad.addColorStop(0.5, well.primaryColor + '12');
        radGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius * 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer ripple ring for Central MRF (Node 2)
        if (well.statusType === 'high_pull') {
          const rippleR = well.radius + 15 + Math.sin(well.pulse) * 14;
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(well.x, well.y, rippleR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner glowing core dot
        ctx.fillStyle = well.primaryColor;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Render Fluid Vector Motion (Laminar Streamlines with Soft Gradient Tails)
      particles.forEach((p, idx) => {
        p.life += 1;
        if (p.life > p.maxLife) {
          particles[idx] = initParticle(idx);
          return;
        }

        // Calculate gravitational acceleration toward wells (N-body gravity simulation)
        let fx = 0;
        let fy = 0;

        const mainWell = wellCoords[p.targetWellIndex];
        const apexWell = wellCoords[1]; // Apex MRF bottleneck well

        // Distance to main assigned well
        const dxMain = mainWell.x - p.x;
        const dyMain = mainWell.y - p.y;
        const distMain = Math.sqrt(dxMain * dxMain + dyMain * dyMain);

        // Distance to central bottleneck well (Apex MRF)
        const dxApex = apexWell.x - p.x;
        const dyApex = apexWell.y - p.y;
        const distApex = Math.sqrt(dxApex * dxApex + dyApex * dyApex);

        // Pull forces
        if (distMain > 8) {
          const force = (mainWell.mass * 0.08 * localIntensity) / (distMain + 30);
          fx += (dxMain / distMain) * force;
          fy += (dyMain / distMain) * force;
        }

        // Apex MRF strong central pull force
        if (distApex > 8) {
          const apexForce = (apexWell.mass * 0.12 * localIntensity) / (distApex + 25);
          fx += (dxApex / distApex) * apexForce;
          fy += (dyApex / distApex) * apexForce;
        }

        // Tangential velocity component for laminar swirl geodesics
        const swirlAngle = Math.atan2(dyApex, dxApex) + Math.PI * 0.45;
        fx += Math.cos(swirlAngle) * 0.18 * localIntensity;
        fy += Math.sin(swirlAngle) * 0.18 * localIntensity;

        p.vx = (p.vx + fx * 0.04) * 0.94;
        p.vy = (p.vy + fy * 0.04) * 0.94;

        p.x += p.vx * p.speedMultiplier;
        p.y += p.vy * p.speedMultiplier;

        // Record history for smooth laminar tail streamlines
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > (viewMode === 'streamlines' ? 16 : 8)) {
          p.history.shift();
        }

        // Particle color shift: Shift from ambient emerald (hue 160) to amber (hue 38) as accelerating into central bottleneck
        const proximityToBottleneck = Math.max(0, 1 - distApex / 280); // 0 (far) to 1 (near bottleneck)
        const currentHue = 160 - proximityToBottleneck * 122; // 160 (emerald) -> 38 (amber/coral)
        const currentSat = 85 + proximityToBottleneck * 15;
        const currentLight = 58 + proximityToBottleneck * 12;

        // Draw Streamline Trail
        if (p.history.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let h = 1; h < p.history.length; h++) {
            ctx.lineTo(p.history[h].x, p.history[h].y);
          }

          const alphaVal = Math.min(1, (p.life / 20)) * Math.min(1, (p.maxLife - p.life) / 30) * 0.75;
          ctx.strokeStyle = `hsla(${currentHue}, ${currentSat}%, ${currentLight}%, ${alphaVal})`;
          ctx.lineWidth = 1.2 + proximityToBottleneck * 1.4;
          ctx.stroke();
        }

        // Draw Particle Leading Head
        const headAlpha = Math.min(1, p.life / 10) * 0.9;
        ctx.fillStyle = `hsla(${currentHue}, 95%, 70%, ${headAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + proximityToBottleneck * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [localIntensity, viewMode]);

  return (
    <div
      className={`rounded-[32px] overflow-hidden shadow-2xl relative border border-white/20 bg-gradient-to-br from-[#131c17] via-[#0d1410] to-[#080d0a] h-[520px] w-full flex flex-col justify-between font-sans select-none ${className}`}
    >
      {/* 
        ========================================================================
        1. MODERNIZED TOP HEADER (Title + Segmented View Pills + Slider Pill)
        ========================================================================
      */}
      <div className="relative z-20 p-5 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Subtitle */}
        <div>
          <h3 className="font-sans text-base font-semibold text-white/90 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Spatial Gravitational Field
          </h3>
          <p className="text-xs text-white/50 font-normal mt-0.5">
            Live kinetic particle flux converging into facility potential wells
          </p>
        </div>

        {/* Right: View Mode Segmented Pills & Custom Frosted Velocity Slider */}
        <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
          {/* Segmented View Pills */}
          <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/15 p-1 rounded-full shadow-lg">
            <button
              onClick={() => setViewMode('streamlines')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                viewMode === 'streamlines'
                  ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Streamlines
            </button>

            <button
              onClick={() => setViewMode('equipotential')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                viewMode === 'equipotential'
                  ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Equipotential Rings
            </button>
          </div>

          {/* Custom Frosted Velocity Slider Pill */}
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl border border-white/15 px-4 py-1.5 rounded-full shadow-lg">
            <span className="text-xs font-medium text-white/70">Flux Velocity:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={localIntensity}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="accent-emerald-400 w-24 cursor-pointer"
            />
            <span className="text-xs font-semibold text-emerald-400 tabular-nums">
              {localIntensity.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. HTML5 CANVAS + TOPOGRAPHIC CONTOUR OVERLAY
        ========================================================================
      */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

        {/* 
          Topographic Contour Lines SVG (Concentric SVG rings radiating from facility wells)
        */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="well1Shade" cx="22%" cy="50%" r="20%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="well2Shade" cx="52%" cy="42%" r="28%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="well3Shade" cx="80%" cy="56%" r="22%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Shading zones */}
          <rect width="100%" height="100%" fill="url(#well1Shade)" />
          <rect width="100%" height="100%" fill="url(#well2Shade)" />
          <rect width="100%" height="100%" fill="url(#well3Shade)" />

          {/* Concentric Topographic Rings around Node 1 (North Collection Hub) */}
          <g stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="4 6">
            <circle cx="22%" cy="50%" r="40" />
            <circle cx="22%" cy="50%" r="80" />
            <circle cx="22%" cy="50%" r="130" />
            <circle cx="22%" cy="50%" r="190" />
          </g>

          {/* Concentric Topographic Rings around Node 2 (Apex Central MRF - Bottleneck) */}
          <g stroke="#f59e0b" strokeWidth="1.2" fill="none" strokeDasharray="3 5">
            <circle cx="52%" cy="42%" r="50" />
            <circle cx="52%" cy="42%" r="95" />
            <circle cx="52%" cy="42%" r="150" />
            <circle cx="52%" cy="42%" r="220" />
          </g>

          {/* Concentric Topographic Rings around Node 3 (Polymer Re-Feed) */}
          <g stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="4 6">
            <circle cx="80%" cy="56%" r="45" />
            <circle cx="80%" cy="56%" r="85" />
            <circle cx="80%" cy="56%" r="140" />
            <circle cx="80%" cy="56%" r="200" />
          </g>
        </svg>

        {/* 
          Facility Well Sleek Floating Glass Labels (Requirement 2)
        */}
        {/* Node 1 (Green): North Collection Hub */}
        <div
          className="absolute left-[22%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
          style={{ transform: 'translate(-50%, -150%)' }}
        >
          <div className="px-3.5 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-sans font-semibold text-xs text-white">
                North Collection Hub
              </span>
            </div>
            <span className="text-[10px] font-medium text-emerald-400 mt-0.5">
              Potential: -2.4 kJ/t (Nominal)
            </span>
          </div>
        </div>

        {/* Node 2 (Cyan/Amber): Apex Central MRF (Surrounded by animated gentle pulse ripple rings) */}
        <div
          className="absolute left-[52%] top-[42%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
          style={{ transform: 'translate(-50%, -160%)' }}
        >
          <div className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl flex flex-col items-center ring-2 ring-amber-500/30">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-sans font-semibold text-xs text-white">
                Apex Central MRF
              </span>
            </div>
            <span className="text-[10px] font-medium text-amber-400 mt-0.5">
              Potential: -6.8 kJ/t (High Pull)
            </span>
          </div>
        </div>

        {/* Node 3 (Violet/Sky): Polymer Re-Feed */}
        <div
          className="absolute left-[80%] top-[56%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
          style={{ transform: 'translate(-50%, -150%)' }}
        >
          <div className="px-3.5 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="font-sans font-semibold text-xs text-white">
                Polymer Re-Feed
              </span>
            </div>
            <span className="text-[10px] font-medium text-sky-400 mt-0.5">
              Potential: -1.8 kJ/t (Equilibrium)
            </span>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        3. BOTTOM TELEMETRY STATUS RIBBON (Requirement 5)
        ========================================================================
      */}
      <div className="relative z-20 m-4 p-3.5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-xs text-white/90 flex flex-wrap items-center justify-between gap-3 shadow-xl pointer-events-auto">
        <div className="flex flex-wrap items-center gap-4">
          {/* Total Kinetic Flux */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60">Total Kinetic Flux:</span>
            <span className="font-semibold text-white tabular-nums">
              {fluxMetric} MT/h
            </span>
          </div>

          <span className="text-white/20 hidden sm:inline">•</span>

          {/* Equilibrium State */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white/60">Equilibrium State:</span>
            <span className="font-semibold text-emerald-400">
              Stable (ΔE &lt; 0.02)
            </span>
          </div>
        </div>

        {/* Action Button: Rebalance Field */}
        <button
          onClick={handleRebalance}
          disabled={isRebalancing}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-300 ${isRebalancing ? 'animate-spin' : ''}`} />
          <span>{isRebalancing ? 'Rebalancing...' : '⚡ Rebalance Field'}</span>
        </button>
      </div>
    </div>
  );
};
