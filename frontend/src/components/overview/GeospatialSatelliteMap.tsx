import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Maximize2,
  Navigation,
  Search,
  Crosshair,
  Flame,
  Mountain,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimStore } from '../../stores/simStore';
import { WasteNode } from '../../types';
import { getNodeStatus } from '../../utils/queueingMath';

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
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [, setHoveredNode] = useState<WasteNode | null>(null);

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
      }
    );

    // Free & Keyless OpenStreetMap Layer
    const streetTile = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
      }
    );

    layersRef.current.satelliteTile = satelliteTile;
    layersRef.current.streetTile = streetTile;

    // Default to satellite
    satelliteTile.addTo(map);

    // Initialize layer groups
    const heatwellsGroup = L.layerGroup().addTo(map);
    const flowArcsGroup = L.layerGroup().addTo(map);
    const sensorsGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

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

  // Render Geospatial Nodes, Curved Flow Arcs, Flux Heatmap Blobs & Sensors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const { markersGroup, flowArcsGroup, heatwellsGroup, sensorsGroup } = layersRef.current;
    if (!map || !markersGroup || !flowArcsGroup || !heatwellsGroup || !sensorsGroup) return;

    markersGroup.clearLayers();
    flowArcsGroup.clearLayers();
    heatwellsGroup.clearLayers();
    sensorsGroup.clearLayers();

    // 1. Render Functional "Flux Heatmap" Layer (Radial Gradient Heat-Blobs with blur radius 40-60px)
    if (mapMode === 'heatmap' || showPotentialWells) {
      nodes.forEach((node) => {
        const coords = FACILITY_GEO_COORDS[node.id];
        if (!coords) return;

        const status = getNodeStatus(node.utilization, node.queueLength);

        // Define soft radial gradient colors
        const radialGradientCSS =
          status === 'critical'
            ? 'radial-gradient(circle, rgba(244, 63, 94, 0.45) 0%, rgba(249, 115, 22, 0.22) 40%, rgba(244, 63, 94, 0) 75%)'
            : status === 'warning'
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.40) 0%, rgba(234, 179, 8, 0.18) 40%, rgba(245, 158, 11, 0) 75%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.15) 40%, rgba(16, 185, 129, 0) 75%)';

        const blobSize = Math.max(160, Math.min(260, node.currentLoad * 1.1 + 140));

        const heatmapBlobHtml = `
          <div style="
            width: ${blobSize}px;
            height: ${blobSize}px;
            margin-left: -${blobSize / 2}px;
            margin-top: -${blobSize / 2}px;
            border-radius: 50%;
            background: ${radialGradientCSS};
            filter: blur(48px);
            pointer-events: none;
            transition: opacity 0.5s ease-in-out;
          "></div>
        `;

        const heatmapIcon = L.divIcon({
          html: heatmapBlobHtml,
          className: 'flux-heatmap-blob',
          iconSize: [0, 0],
        });

        const heatMarker = L.marker([coords.lat, coords.lng], {
          icon: heatmapIcon,
          interactive: false,
        });

        heatMarker.addTo(heatwellsGroup);
      });
    }

    // 2. Draw Geodesic Curved Flow Arcs
    if (showActiveFleets) {
      edges.forEach((edge) => {
        const sourceCoord = FACILITY_GEO_COORDS[edge.source];
        const targetCoord = FACILITY_GEO_COORDS[edge.target];
        if (!sourceCoord || !targetCoord) return;

        const isCongested = edge.flowRate / edge.maxCapacity > 0.85;
        const strokeColor = isCongested ? '#f43f5e' : edge.id.includes('bio') ? '#38bdf8' : '#10b981';

        const midLat = (sourceCoord.lat + targetCoord.lat) / 2 + (targetCoord.lng - sourceCoord.lng) * 0.09;
        const midLng = (sourceCoord.lng + targetCoord.lng) / 2 - (targetCoord.lat - sourceCoord.lat) * 0.09;

        const curvePoints: [number, number][] = [];
        for (let t = 0; t <= 1; t += 0.05) {
          const lat = (1 - t) * (1 - t) * sourceCoord.lat + 2 * (1 - t) * t * midLat + t * t * targetCoord.lat;
          const lng = (1 - t) * (1 - t) * sourceCoord.lng + 2 * (1 - t) * t * midLng + t * t * targetCoord.lng;
          curvePoints.push([lat, lng]);
        }

        const baseLine = L.polyline(curvePoints, {
          color: isCongested ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.4)',
          weight: 4,
          opacity: 0.7,
        });
        baseLine.addTo(flowArcsGroup);

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

    // 4. Draw Dynamic Node Pins & Status Rings (Red / Yellow / Green based on live utilization / queue status)
    nodes.forEach((node) => {
      const coords = FACILITY_GEO_COORDS[node.id];
      if (!coords) return;

      const status = getNodeStatus(node.utilization, node.queueLength);

      // Determine colors based on explicit prompt thresholds:
      // Critical (≥85% or Q>8): Soft Rose/Red (bg-rose-500, border-rose-200, text-rose-700)
      // Elevated (70-84%): Warm Amber/Yellow (bg-amber-500, border-amber-200, text-amber-700)
      // Nominal (<70%): Fresh Emerald/Green (bg-emerald-500, border-emerald-200, text-emerald-700)
      const pinColorClasses =
        status === 'critical'
          ? 'bg-rose-500 border-rose-200 text-white shadow-[0_8px_20px_rgba(244,63,94,0.45)]'
          : status === 'warning'
          ? 'bg-amber-500 border-amber-200 text-white shadow-[0_8px_20px_rgba(245,158,11,0.45)]'
          : 'bg-emerald-500 border-emerald-200 text-white shadow-[0_8px_20px_rgba(16,185,129,0.40)]';

      const ringColor =
        status === 'critical'
          ? 'rgba(244, 63, 94, 0.45)'
          : status === 'warning'
          ? 'rgba(245, 158, 11, 0.45)'
          : 'rgba(16, 185, 129, 0.40)';

      const statusBadgeText =
        status === 'critical'
          ? 'text-rose-400'
          : status === 'warning'
          ? 'text-amber-400'
          : 'text-emerald-400';

      const statusLabel =
        status === 'critical'
          ? 'CRITICAL BOTTLENECK'
          : status === 'warning'
          ? 'ELEVATED LOAD'
          : 'OPTIMAL FLOW';

      // Icon Glyph
      const isCollection = node.type === 'source' || node.type === 'transfer';
      const isSorting = node.type === 'sorting';

      const iconGlyph = isCollection
        ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`
        : isSorting
        ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`
        : `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`;

      const displayName = node.name.length > 22 ? node.name.slice(0, 22) + '...' : node.name;
      const utilPct = Math.round((node.utilization > 1 ? node.utilization / 100 : node.utilization) * 100);

      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Animated Dynamic Status Ring -->
          <div class="absolute -inset-4 rounded-full animate-ping opacity-60 pointer-events-none" style="background-color: ${ringColor}"></div>
          <div class="absolute -inset-2.5 rounded-full animate-pulse opacity-40 pointer-events-none" style="background-color: ${ringColor}"></div>

          <!-- Central Dynamic Pin -->
          <div class="relative z-10 w-9 h-9 rounded-full ${pinColorClasses} border-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            ${iconGlyph}
          </div>

          <!-- Glass Popover Label -->
          <div class="absolute left-1/2 -top-14 -translate-x-1/2 pointer-events-none whitespace-nowrap z-20">
            <div class="px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex flex-col items-center">
              <span class="font-sans font-semibold text-[11px] leading-tight text-white">${displayName}</span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="font-sans text-[10px] ${statusBadgeText} font-bold leading-tight">${utilPct}% Utilization</span>
                <span class="text-stone-400 text-[9px]">• ${node.queueLength} trucks in Q</span>
              </div>
            </div>
            <!-- Arrow tip -->
            <div class="w-2 h-2 bg-slate-900/90 rotate-45 mx-auto -mt-1 border-r border-b border-white/20"></div>
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

  // Zoom Handlers (Task 4)
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

  // Search Logic (Task 4)
  const matchingNodes = searchLocation.trim()
    ? nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
          n.id.toLowerCase().includes(searchLocation.toLowerCase()) ||
          n.type.toLowerCase().includes(searchLocation.toLowerCase()) ||
          n.wasteTypes.some((wt) => wt.toLowerCase().includes(searchLocation.toLowerCase()))
      )
    : [];

  const handleSelectSearchedNode = (targetNode: WasteNode) => {
    const coords = FACILITY_GEO_COORDS[targetNode.id];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
    setSelectedNodeId(targetNode.id);
    setSearchLocation(targetNode.name);
    setIsSearchFocused(false);
  };

  return (
    <div className={`relative w-full h-full rounded-[32px] overflow-hidden bg-slate-950 shadow-inner ${className}`}>
      {/* 
        ========================================================================
        1. LEAFLET MAP CANVAS
        ========================================================================
      */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.4)] z-[5]" />

      {/* 
        ========================================================================
        2. TOP FLOATING MAP CONTROLS & LIVE SEARCH BAR
        ========================================================================
      */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Pill: View Modes (Satellite, Flux Heatmap, Topography) */}
        <div className="flex items-center bg-white/85 backdrop-blur-xl border border-white/85 p-1 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.06)] pointer-events-auto">
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
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-stone-600 hover:text-rose-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
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

        {/* Right Module: Live Search & Utility Controls */}
        <div className="flex items-center gap-2 pointer-events-auto relative">
          {/* Live Search Capsule */}
          <div className="relative w-56 sm:w-64">
            <div className="flex items-center bg-white/85 backdrop-blur-xl border border-white/85 rounded-full px-3.5 py-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
              <Search className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search facility name..."
                value={searchLocation}
                onChange={(e) => {
                  setSearchLocation(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matchingNodes.length > 0) {
                    handleSelectSearchedNode(matchingNodes[0]);
                  }
                }}
                className="bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none w-full font-sans"
              />
              {searchLocation && (
                <button
                  onClick={() => {
                    setSearchLocation('');
                    setIsSearchFocused(false);
                  }}
                  className="text-stone-400 hover:text-stone-700 ml-1 p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Live Search Suggestions Dropdown */}
            {isSearchFocused && searchLocation.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white/85 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto font-sans p-1">
                {matchingNodes.length > 0 ? (
                  matchingNodes.map((n) => {
                    const status = getNodeStatus(n.utilization, n.queueLength);
                    const statusDot =
                      status === 'critical'
                        ? 'bg-rose-500'
                        : status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';

                    return (
                      <button
                        key={n.id}
                        onClick={() => handleSelectSearchedNode(n)}
                        className="w-full text-left px-3.5 py-2 hover:bg-stone-100/80 rounded-xl transition flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <span className="font-medium text-xs text-stone-900 block truncate">
                            {n.name}
                          </span>
                          <span className="text-[10px] text-stone-500 capitalize block">
                            {n.type} • {n.arrivalRate} trucks/hr
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                          <span className="text-[10px] font-medium text-stone-600 uppercase">
                            {status}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-3 text-xs text-stone-400 text-center font-sans">
                    No matching facilities found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Circular Buttons */}
          <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-xl border border-white/85 p-1 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
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
        3. BOTTOM-LEFT FLOATING LEGEND CARD
        ========================================================================
      */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1.5 p-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-[11px] font-sans font-medium text-stone-700 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Critical / Bottleneck (≥85% or Q&gt;8)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Elevated / Warning (70–84%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Nominal / Optimal (&lt;70%)</span>
        </div>
      </div>

      {/* 
        ========================================================================
        4. BOTTOM-RIGHT ZOOM CONTROLS (Wired directly to map.zoomIn() / map.zoomOut())
        ========================================================================
      */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1 p-1 rounded-full bg-white/85 backdrop-blur-xl border border-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.08)] select-none pointer-events-auto">
        <button
          onClick={handleFitBounds}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition"
          title="Recenter Map"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-[1px] bg-stone-200" />
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition text-base font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-white transition text-base font-bold"
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
};
