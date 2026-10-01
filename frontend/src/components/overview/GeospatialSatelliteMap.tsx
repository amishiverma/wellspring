import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Search,
  Crosshair,
  Sliders,
  Flame,
  Radio,
  Mountain,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimStore } from '../../stores/simStore';
import { WasteNode } from '../../types';

export const FACILITY_GEO_COORDS: Record<string, { lat: number; lng: number }> = {
  'node-north-urban': { lat: 19.1850, lng: 72.8600 },
  'node-east-ind': { lat: 19.1300, lng: 72.9350 },
  'node-central-transfer': { lat: 19.0700, lng: 72.8750 },
  'node-apex-mrf': { lat: 19.0480, lng: 72.9150 },
  'node-bio-reactor': { lat: 19.0150, lng: 72.8850 },
  'node-polymer-pyrolysis': { lat: 19.0650, lng: 73.0100 },
  'node-metallurgy-refeed': { lat: 19.0300, lng: 73.0350 },
  'node-landfill-sink': { lat: 18.9850, lng: 73.0600 },
};

interface GeospatialSatelliteMapProps {
  className?: string;
}

export const GeospatialSatelliteMap: React.FC<GeospatialSatelliteMapProps> = ({ className = '' }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    satelliteTile?: L.TileLayer;
    streetTile?: L.TileLayer;
    markersGroup?: L.LayerGroup;
    flowArcsGroup?: L.LayerGroup;
    heatwellsGroup?: L.LayerGroup;
    sensorsGroup?: L.LayerGroup;
  }>({});

  const { nodes, edges, setSelectedNodeId } = useGraphStore();
  const { sensors } = useSimStore();

  const [mapMode, setMapMode] = useState<'satellite' | 'heatmap' | 'topography'>('satellite');
  const [showPotentialWells, setShowPotentialWells] = useState<boolean>(true);
  const [showActiveFleets, setShowActiveFleets] = useState<boolean>(true);
  const [showSensorDensity, setShowSensorDensity] = useState<boolean>(false);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<WasteNode | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over metropolitan urban river corridor
    const map = L.map(mapContainerRef.current, {
      center: [19.0750, 72.9400],
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Esri World Imagery (Photorealistic Satellite Layer)
    const satelliteTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c', 'd'],
      }
    );

    // CartoDB Voyager / Streets (Clean Street Layer)
    const streetTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    );

    layersRef.current.satelliteTile = satelliteTile;
    layersRef.current.streetTile = streetTile;

    // Default to satellite
    satelliteTile.addTo(map);

    // Initialize layer groups
    const markersGroup = L.layerGroup().addTo(map);
    const flowArcsGroup = L.layerGroup().addTo(map);
    const heatwellsGroup = L.layerGroup().addTo(map);
    const sensorsGroup = L.layerGroup().addTo(map);

    layersRef.current.markersGroup = markersGroup;
    layersRef.current.flowArcsGroup = flowArcsGroup;
    layersRef.current.heatwellsGroup = heatwellsGroup;
    layersRef.current.sensorsGroup = sensorsGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Map Style
  useEffect(() => {
    const map = mapInstanceRef.current;
    const { satelliteTile, streetTile } = layersRef.current;
    if (!map || !satelliteTile || !streetTile) return;

    if (mapMode === 'satellite' || mapMode === 'heatmap') {
      if (map.hasLayer(streetTile)) map.removeLayer(streetTile);
      if (!map.hasLayer(satelliteTile)) satelliteTile.addTo(map);
    } else {
      if (map.hasLayer(satelliteTile)) map.removeLayer(satelliteTile);
      if (!map.hasLayer(streetTile)) streetTile.addTo(map);
    }
  }, [mapMode]);

  // Render Geospatial Nodes, Curved Flow Arcs, Potential Wells & Sensors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const { markersGroup, flowArcsGroup, heatwellsGroup, sensorsGroup } = layersRef.current;
    if (!map || !markersGroup || !flowArcsGroup || !heatwellsGroup || !sensorsGroup) return;

    markersGroup.clearLayers();
    flowArcsGroup.clearLayers();
    heatwellsGroup.clearLayers();
    sensorsGroup.clearLayers();

    // 1. Draw Potential Wells Heatmap (Gravity Wells)
    if (showPotentialWells || mapMode === 'heatmap') {
      nodes.forEach((node) => {
        const coords = FACILITY_GEO_COORDS[node.id];
        if (!coords) return;

        const isCritical = node.bottleneckStatus === 'critical' || node.pulseRed;
        const isWarning = node.bottleneckStatus === 'warning';
        const color = isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';
        const radius = Math.max(650, node.currentLoad * 4.8);

        // Radiant potential well circle
        const circle = L.circle([coords.lat, coords.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: isCritical ? 0.3 : 0.14,
          weight: 1.5,
          dashArray: isCritical ? '4, 4' : undefined,
        });

        circle.addTo(heatwellsGroup);
      });
    }

    // 2. Draw Geodesic Curved Flow Arcs matching reference design
    if (showActiveFleets) {
      edges.forEach((edge) => {
        const sourceCoord = FACILITY_GEO_COORDS[edge.source];
        const targetCoord = FACILITY_GEO_COORDS[edge.target];
        if (!sourceCoord || !targetCoord) return;

        const isCongested = edge.flowRate / edge.maxCapacity > 0.85;
        const strokeColor = isCongested ? '#f43f5e' : edge.id.includes('bio') ? '#38bdf8' : '#10b981';

        // Calculate a gentle curved midpoint for geodesic arc aesthetics
        const midLat = (sourceCoord.lat + targetCoord.lat) / 2 + (targetCoord.lng - sourceCoord.lng) * 0.09;
        const midLng = (sourceCoord.lng + targetCoord.lng) / 2 - (targetCoord.lat - sourceCoord.lat) * 0.09;

        // Generate curved points
        const curvePoints: [number, number][] = [];
        for (let t = 0; t <= 1; t += 0.05) {
          const lat = (1 - t) * (1 - t) * sourceCoord.lat + 2 * (1 - t) * t * midLat + t * t * targetCoord.lat;
          const lng = (1 - t) * (1 - t) * sourceCoord.lng + 2 * (1 - t) * t * midLng + t * t * targetCoord.lng;
          curvePoints.push([lat, lng]);
        }

        // Draw background line
        const baseLine = L.polyline(curvePoints, {
          color: isCongested ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.4)',
          weight: 4,
          opacity: 0.7,
        });
        baseLine.addTo(flowArcsGroup);

        // Draw animated pulse line
        const animatedLine = L.polyline(curvePoints, {
          color: strokeColor,
          weight: 2.5,
          dashArray: '8, 12',
          className: 'flow-arc-pulse',
        });
        animatedLine.addTo(flowArcsGroup);
      });
    }

    // 3. Draw Sensor Swarm Density
    if (showSensorDensity) {
      sensors.forEach((sensor, index) => {
        const base = Object.values(FACILITY_GEO_COORDS)[index % 8];
        if (!base) return;

        const jitterLat = base.lat + ((index * 13) % 17 - 8) * 0.004;
        const jitterLng = base.lng + ((index * 19) % 23 - 11) * 0.004;

        const isHighFill = sensor.fillLevelPct >= 85;
        const beaconColor = isHighFill ? '#f43f5e' : '#10b981';

        const beaconMarker = L.circleMarker([jitterLat, jitterLng], {
          radius: 3.5,
          color: '#ffffff',
          fillColor: beaconColor,
          fillOpacity: 0.9,
          weight: 1,
        });

        beaconMarker.bindTooltip(
          `<div class="font-sans text-xs"><b>${sensor.sensorCode}</b><br/>Fill: ${sensor.fillLevelPct}% | NIR: ${sensor.opticalPurityPct}%</div>`,
          { className: 'bg-white/90 text-stone-800 p-2 rounded-xl shadow-md border border-white' }
        );

        beaconMarker.addTo(sensorsGroup);
      });
    }

    // 4. Draw Interactive Geospatial Nodes (Exact Radar Pins from reference image)
    nodes.forEach((node) => {
      const coords = FACILITY_GEO_COORDS[node.id];
      if (!coords) return;

      const isCritical = node.bottleneckStatus === 'critical' || node.pulseRed;
      const isWarning = node.bottleneckStatus === 'warning';

      // Determine pin color and glyph
      const isCollection = node.type === 'source' || node.type === 'transfer';
      const isSorting = node.type === 'sorting';
      const isProcessing = node.type === 'processing';
      const isSink = node.type === 'sink';

      const ringColor = isCritical
        ? 'rgba(244, 63, 94, 0.4)'
        : isCollection
        ? 'rgba(16, 185, 129, 0.35)'
        : isSorting
        ? 'rgba(56, 189, 248, 0.35)'
        : 'rgba(245, 158, 11, 0.35)';

      const badgeColor = isCritical
        ? 'bg-rose-500 text-white'
        : isCollection
        ? 'bg-emerald-500 text-white'
        : isSorting
        ? 'bg-sky-500 text-white'
        : 'bg-amber-500 text-white';

      const iconGlyph = isCollection
        ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`
        : isSorting
        ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`
        : `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`;

      const displayName = node.name.length > 22 ? node.name.slice(0, 22) + '...' : node.name;
      const throughputLabel = `${Math.round(node.currentLoad)} MT/Day`;

      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Animated Radar Pulse Circles -->
          <div class="absolute -inset-4 rounded-full animate-ping opacity-60 pointer-events-none" style="background-color: ${ringColor}"></div>
          <div class="absolute -inset-2.5 rounded-full animate-pulse opacity-40 pointer-events-none" style="background-color: ${ringColor}"></div>

          <!-- Central Glowing Circular Pin -->
          <div class="relative z-10 w-9 h-9 rounded-full ${badgeColor} border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            ${iconGlyph}
          </div>

          <!-- Elegant Dark Glass Label Popover (Matching Reference Image) -->
          <div class="absolute left-1/2 -top-12 -translate-x-1/2 pointer-events-none whitespace-nowrap z-20">
            <div class="px-3 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-white shadow-xl flex flex-col items-center">
              <span class="font-sans font-semibold text-[11px] leading-tight text-white">${displayName}</span>
              <span class="font-mono text-[9px] text-emerald-400 font-medium leading-tight">${throughputLabel}</span>
            </div>
            <!-- Arrow tip -->
            <div class="w-2 h-2 bg-slate-900/85 rotate-45 mx-auto -mt-1 border-r border-b border-white/20"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-geo-node',
        iconSize: [0, 0],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedNodeId(node.id);
      });

      marker.on('mouseover', () => {
        setHoveredNode(node);
      });

      marker.on('mouseout', () => {
        setHoveredNode(null);
      });

      marker.addTo(markersGroup);
    });
  }, [nodes, edges, sensors, showPotentialWells, showActiveFleets, showSensorDensity, mapMode, setSelectedNodeId]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const lats = Object.values(FACILITY_GEO_COORDS).map((c) => c.lat);
    const lngs = Object.values(FACILITY_GEO_COORDS).map((c) => c.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className={`relative w-full h-full rounded-[32px] overflow-hidden bg-slate-950 shadow-inner ${className}`}>
      {/* 
        ========================================================================
        1. LEAFLET MAP CANVAS (Satellite Imagery)
        ========================================================================
      */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Atmospheric Mist & Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.4)] z-[5]" />

      {/* 
        ========================================================================
        2. TOP FLOATING MAP CONTROLS (Exact Pill Design from Reference Image)
        ========================================================================
      */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Pill: Mode Switcher (Satellite, Flux Heatmap, Topography) */}
        <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white/85 p-1 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.06)] pointer-events-auto">
          <button
            onClick={() => setMapMode('satellite')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              mapMode === 'satellite'
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => {
              setMapMode('heatmap');
              setShowPotentialWells(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              mapMode === 'heatmap'
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Flux Heatmap</span>
          </button>

          <button
            onClick={() => setMapMode('topography')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              mapMode === 'topography'
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-stone-500" />
            <span>Topography</span>
          </button>
        </div>

        {/* Right Pill: Location Search & Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search Capsule */}
          <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-white/85 rounded-full px-3.5 py-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.06)] w-52 sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none w-full font-sans"
            />
          </div>

          {/* Quick Action Circular Buttons */}
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xl border border-white/85 p-1 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setShowActiveFleets(!showActiveFleets)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                showActiveFleets ? 'bg-slate-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Toggle Flow Arcs"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleFitBounds}
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition"
              title="Recenter Map"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleFitBounds}
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition"
              title="Expand View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        3. BOTTOM-LEFT FLOATING LEGEND CARD (Matching Reference Image)
        ========================================================================
      */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1.5 p-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-[11px] font-sans font-medium text-stone-700 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Collection Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Sorting Facility</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Transfer Station</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Processing Plant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Landfill Sink</span>
        </div>
      </div>

      {/* 
        ========================================================================
        4. BOTTOM-RIGHT ZOOM CAPSULE (Matching Reference Image)
        ========================================================================
      */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 p-1 rounded-full bg-white/80 backdrop-blur-xl border border-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.08)] select-none">
        <button
          onClick={handleFitBounds}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition"
          title="Recenter / Compass"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-[1px] bg-stone-200" />
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition text-base font-semibold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition text-base font-semibold"
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
};
