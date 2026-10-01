import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Wifi,
  Battery,
  Thermometer,
  Droplets,
  Eye,
  Activity,
  Sliders,
  Terminal,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useSimStore } from '../../stores/simStore';
import { SensorTelemetry } from '../../types';

export const SensorSwarmView: React.FC = () => {
  const { sensors, packetLogs, tickTelemetry } = useSimStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [warningThreshold, setWarningThreshold] = useState<number>(85);
  const [opticalFloor, setOpticalFloor] = useState<number>(90);
  const [selectedSensor, setSelectedSensor] = useState<SensorTelemetry | null>(sensors[0]);

  const filteredSensors = sensors.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.streamType === selectedFilter;
  });

  const categories = [
    { id: 'all', label: 'All Streams' },
    { id: 'polymer', label: 'Polymers (PET/HDPE)' },
    { id: 'organic', label: 'Organics' },
    { id: 'metals', label: 'Metals & Alloys' },
    { id: 'glass', label: 'Glass Cullet' },
    { id: 'mixed', label: 'Mixed Solid' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>STEP 01 • SPATIAL IOT TELEMETRY SWARM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            Autonomous Sensor Network &amp; Edge Ingestion
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-light">
            Real-time optical NIR spectrometers, hydraulic compactor strain gauges, and ultrasonic
            fill telemetry continuously broadcasting volumetric density and material purity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => tickTelemetry()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-mono transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Force Swarm Ping</span>
          </button>
        </div>
      </div>

      {/* Filter and Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Active Node Swarm</span>
          <span className="text-2xl font-display font-bold text-white mt-1 block">48 / 48 Nodes</span>
          <span className="text-[10px] font-mono text-emerald-400 mt-1 block">100% Mesh Reachability</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Optical Spectral Purity</span>
          <span className="text-2xl font-display font-bold text-cyan-300 mt-1 block">96.8% Avg</span>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">NIR Hyperspectral Scanners</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Elevated Fill Alerts</span>
          <span className="text-2xl font-display font-bold text-rose-400 mt-1 block">3 Bins &gt; 90%</span>
          <span className="text-[10px] font-mono text-rose-400 mt-1 block">Compactor Cycle Required</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Mesh Packet Latency</span>
          <span className="text-2xl font-display font-bold text-emerald-400 mt-1 block">14.2 ms</span>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">LoRaWAN + 5G NB-IoT</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1 pl-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
              selectedFilter === cat.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Telemetry Grid & Deep Sensor Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Grid (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredSensors.map((sensor) => {
              const isSelected = selectedSensor?.id === sensor.id;
              const isAlert = sensor.fillLevelPct >= warningThreshold || sensor.status === 'alert';
              const isWarning = sensor.status === 'warning';

              return (
                <motion.div
                  key={sensor.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`p-4 rounded-2xl glass-panel border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.2)] bg-cyan-950/20'
                      : isAlert
                      ? 'border-rose-500/60 bg-rose-950/10'
                      : isWarning
                      ? 'border-amber-500/40'
                      : 'border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAlert ? 'bg-rose-500 animate-ping' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      {sensor.sensorCode}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                        isAlert
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {sensor.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 font-sans mb-3">
                    {sensor.facilityName}
                  </p>

                  {/* Fill Level Gauge */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Fill Capacity</span>
                      <span
                        className={`font-bold ${
                          sensor.fillLevelPct >= 90
                            ? 'text-rose-400'
                            : sensor.fillLevelPct >= 75
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {sensor.fillLevelPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${sensor.fillLevelPct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          sensor.fillLevelPct >= 90
                            ? 'bg-rose-500'
                            : sensor.fillLevelPct >= 75
                            ? 'bg-amber-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Micro Sensors row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      <span>{sensor.temperatureC}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>{sensor.opticalPurityPct}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <Battery className="w-3 h-3 text-violet-400" />
                      <span>{sensor.batteryPct}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sensor Deep Inspector & Packet Terminal */}
        <div className="space-y-6">
          {/* Selected Node Details */}
          {selectedSensor && (
            <div className="p-5 rounded-3xl glass-panel border border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-display font-bold text-white text-sm">
                    {selectedSensor.sensorCode}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedSensor.lastPingTimestamp}
                </span>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Facility Station:</span>
                  <span className="text-white font-sans">{selectedSensor.facilityName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Stream Classification:</span>
                  <span className="text-cyan-300 uppercase">{selectedSensor.streamType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Volumetric Fill:</span>
                  <span className="text-white font-bold">{selectedSensor.fillLevelPct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Optical NIR Purity:</span>
                  <span className="text-emerald-400 font-bold">{selectedSensor.opticalPurityPct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Moisture Content:</span>
                  <span className="text-white">{selectedSensor.moisturePct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Compactor Vibration:</span>
                  <span className="text-white">{selectedSensor.vibrationHz} Hz</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Signal RSSI:</span>
                  <span className="text-white">{selectedSensor.signalRssi} dBm</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Raw Hex Frame:</span>
                  <span className="text-violet-300 text-[10px]">{selectedSensor.packetHex}</span>
                </div>
              </div>
            </div>
          )}

          {/* Threshold Tuning Sliders */}
          <div className="p-5 rounded-3xl glass-panel border border-white/[0.08]">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-white text-sm">
                Swarm Calibration Controls
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Bin Warning Threshold</span>
                  <span className="text-white font-bold">{warningThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Optical Purity Floor</span>
                  <span className="text-white font-bold">{opticalFloor}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="98"
                  value={opticalFloor}
                  onChange={(e) => setOpticalFloor(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Real-time Streaming Packet Terminal */}
          <div className="p-5 rounded-3xl glass-panel border border-white/[0.08]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-400" />
                <h3 className="font-display font-bold text-white text-sm">
                  Live LoRaWAN Telemetry Stream
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="mt-3 p-3 rounded-xl bg-obsidian-950 font-mono text-[10px] text-slate-300 h-44 overflow-y-auto space-y-1.5 border border-white/[0.04]">
              {packetLogs.map((log, idx) => (
                <div key={idx} className="leading-tight text-emerald-400/90 hover:text-white transition">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
