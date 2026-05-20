import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Incident } from './data';

mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW50b3Rvc28iLCJhIjoiY21wMXd2dThiMDNqaDJyc2ZxaXd5Ynk2NCJ9.oECIfYcNaamdGktBd7WyBg';

/* ── Inject Mapbox CSS once ── */
if (!document.getElementById('mapbox-gl-css')) {
  const link = document.createElement('link');
  link.id = 'mapbox-gl-css'; link.rel = 'stylesheet';
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css';
  document.head.appendChild(link);
}

/* ── Marker / Popup styles ── */
if (!document.getElementById('am-mb-styles')) {
  const s = document.createElement('style'); s.id = 'am-mb-styles';
  s.textContent = `

    /* CSS crítico do Mapbox: sem isso, os markers podem empilhar em coluna no WebView */
    .mapboxgl-map {
      font: 12px/20px Helvetica Neue, Arial, Helvetica, sans-serif;
      overflow: hidden;
      position: relative;
      -webkit-tap-highlight-color: rgb(0 0 0 / 0);
    }
    .mapboxgl-canvas-container,
    .mapboxgl-canvas {
      position: absolute;
      left: 0;
      top: 0;
    }
    .mapboxgl-canvas {
      width: 100%;
      height: 100%;
    }
    .mapboxgl-marker {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      will-change: transform;
      transform-origin: center center;
      pointer-events: auto;
    }
    .mapboxgl-marker-anchor-center {
      transform-origin: center center !important;
    }

    /* Marker base — no CSS rings (rings são GL layers agora) */
    @keyframes mbPopIn {
      0%   { transform: scale(0) translateY(6px); opacity: 0; }
      70%  { transform: scale(1.12) translateY(-2px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes mbBurst {
      0%   { box-shadow: 0 0 0 0 var(--mc, rgba(220,74,10,.8)); }
      60%  { box-shadow: 0 0 0 20px transparent; }
      100% { box-shadow: 0 0 0 32px transparent; }
    }
    @keyframes mbUserPulse {
      0%,100% { transform:scale(1); opacity:.7; }
      50%      { transform:scale(1.6); opacity:0; }
    }

    /* Marker wrapper preso ao transform do Mapbox */
    .am-mb-pin {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      /* Tell Mapbox this element's anchor is its center */
      will-change: transform;
    }
    .am-mb-pin-core {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.05rem;
      border: 2.5px solid rgba(255,255,255,.92);
      box-shadow: 0 4px 18px var(--shadow, rgba(0,0,0,.22)), 0 2px 6px rgba(0,0,0,.14);
      animation: mbPopIn .4s cubic-bezier(.175,.885,.32,1.275) both;
      position: relative; z-index: 1;
      transition: transform .15s;
    }
    .am-mb-pin:hover .am-mb-pin-core { transform: scale(1.12); }
    .am-mb-pin.is-active::before,
    .am-mb-pin.is-active::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 999px;
      border: 2px solid var(--mc, rgba(220,74,10,.65));
      background: var(--mcSoft, rgba(220,74,10,.18));
      animation: mbMarkerPulse 1.75s ease-out infinite;
      z-index: 0;
      pointer-events: none;
    }
    .am-mb-pin.is-active::after {
      animation-delay: .85s;
      opacity: .6;
    }
    .am-mb-pin.is-active .am-mb-pin-core {
      animation: mbPopIn .4s cubic-bezier(.175,.885,.32,1.275) both,
                 mbPinBeat 1.8s ease-in-out .45s infinite;
    }
    .am-mb-pin.is-new .am-mb-pin-core {
      animation: mbPopIn .4s cubic-bezier(.175,.885,.32,1.275) both,
                 mbBurst 1.6s ease-out .4s 1,
                 mbPinBeat 1.8s ease-in-out 1.1s infinite;
    }
    @keyframes mbMarkerPulse {
      0% { transform: scale(.55); opacity: .72; }
      65% { transform: scale(2.25); opacity: .06; }
      100% { transform: scale(2.55); opacity: 0; }
    }
    @keyframes mbPinBeat {
      0%,100% { transform: translateY(0) scale(1); }
      45% { transform: translateY(-3px) scale(1.09); }
      62% { transform: translateY(0) scale(1.02); }
    }

    /* User location dot */
    .am-mb-user-marker {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      will-change: transform;
    }
    .am-mb-userdot {
      position: relative;
      width: 18px; height: 18px; border-radius: 50%;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 0 0 5px rgba(37,99,235,.16), 0 4px 18px rgba(37,99,235,.65);
      isolation: isolate;
      animation: mbUserCore 1.8s ease-in-out infinite;
      pointer-events: none;
      z-index: 2;
    }
    .am-mb-userdot::before,
    .am-mb-userdot::after {
      content: ''; position: absolute; inset: -12px; border-radius: 50%;
      border: 2px solid rgba(37,99,235,.48);
      background: rgba(37,99,235,.18);
      animation: mbUserPulse 1.75s ease-out infinite;
      z-index: -1;
    }
    .am-mb-userdot::after {
      inset: -24px;
      background: rgba(37,99,235,.11);
      animation-delay: .75s;
    }
    @keyframes mbUserCore {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.18); }
    }

    /* Popup */
    .mapboxgl-popup { z-index: 9999 !important; }
    .mapboxgl-popup-content {
      padding: 0 !important; border-radius: 18px !important;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.1) !important;
      min-width: 230px; max-width: 290px;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .mapboxgl-popup-tip { display: none !important; }
    .mapboxgl-popup-close-button {
      top: 10px !important; right: 10px !important;
      font-size: 1rem !important; line-height: 1 !important;
      color: #94a3b8 !important; background: rgba(255,255,255,.8) !important;
      backdrop-filter: blur(4px);
      border-radius: 50% !important; border: none !important;
      width: 24px !important; height: 24px !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
    }
    .mapboxgl-marker {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      will-change: transform;
      transform-origin: center center;
      pointer-events: auto;
    }

    .mapboxgl-ctrl-group {
      border-radius: 14px !important;
      overflow: hidden !important;
      box-shadow: 0 10px 30px rgba(15,23,42,.16) !important;
      border: 1px solid rgba(15,23,42,.08) !important;
    }
    .mapboxgl-ctrl button {
      width: 34px !important;
      height: 34px !important;
    }
    .mapboxgl-ctrl-scale {
      border-radius: 10px !important;
      border: none !important;
      background: rgba(255,255,255,.82) !important;
      backdrop-filter: blur(8px);
      padding: 4px 8px !important;
      color: #0f172a !important;
      font-family: 'DM Sans', system-ui, sans-serif !important;
      font-weight: 700 !important;
    }
    .am-map-dark .mapboxgl-ctrl-scale {
      background: rgba(15,23,42,.72) !important;
      color: #e2e8f0 !important;
    }

    /* Mantém os créditos discretos, mas sem poluir a UI */
    .mapboxgl-ctrl-bottom-left,
    .mapboxgl-ctrl-bottom-right { opacity: .62; }
    .mapboxgl-ctrl-logo { display: none !important; }
  `;
  document.head.appendChild(s);
}

/* ── Constants ── */
const STYLE_LIGHT = 'mapbox://styles/mapbox/streets-v12';   // verde, limpo, bom pro Brasil
const STYLE_DARK  = 'mapbox://styles/mapbox/dark-v11';
const CENTER: [number, number] = [-40.8886, -3.9256];
const INITIAL_ZOOM = 10;

/* ── Type config ── */
const TYPE_CFG: Record<string, { bg: string; glow: string; shadow: string }> = {
  fire:    { bg: '#ea580c', glow: 'rgba(234,88,12,.5)',  shadow: 'rgba(234,88,12,.32)' },
  flood:   { bg: '#1d4ed8', glow: 'rgba(29,78,216,.5)',  shadow: 'rgba(29,78,216,.32)' },
  recycle: { bg: '#0d4f2e', glow: 'rgba(13,79,46,.45)',  shadow: 'rgba(13,79,46,.28)' },
};

function markerSvg(type: string, resolved = false): string {
  if (resolved) return `<span style="font-size:1rem;line-height:1">✓</span>`;
  if (type === 'flood') return `<span style="font-size:1.05rem;line-height:1">🌊</span>`;
  if (type === 'recycle') return `<span style="font-size:1.05rem;line-height:1">♻️</span>`;
  return `<span style="font-size:1.05rem;line-height:1">🔥</span>`;
}

/* ── Build marker DOM element ── */
function markerEl(type: string, resolved: boolean, isNew: boolean): HTMLElement {
  const c   = TYPE_CFG[type] || TYPE_CFG.fire;
  const bg  = resolved ? '#94a3b8' : c.bg;
  const op  = resolved ? '0.58' : '1';

  const wrap = document.createElement('div');
  wrap.className = `am-mb-pin${resolved ? ' is-resolved' : ' is-active'}${isNew ? ' is-new' : ''}`;

  wrap.style.setProperty('--mc', resolved ? 'rgba(148,163,184,.35)' : c.shadow);
  wrap.style.setProperty('--mcSoft', resolved ? 'rgba(148,163,184,.10)' : c.shadow.replace('.42', '.18').replace('.38', '.16').replace('.35', '.16'));
  const core = document.createElement('div');
  core.className = 'am-mb-pin-core';
  core.style.cssText = [
    `background:${bg}`,
    `opacity:${op}`,
    `--shadow:${c.shadow}`,
    resolved ? '' : `box-shadow:0 4px 18px ${c.shadow},0 2px 6px rgba(0,0,0,.14)`,
  ].filter(Boolean).join(';');
  core.style.color = 'white';
  core.innerHTML = markerSvg(type, resolved);
  wrap.appendChild(core);
  return wrap;
}

/* ── Popup HTML ── */
function popupHTML(inc: Incident): string {
  const resolved  = inc.status === 'resolvido';
  const dispatched = inc.status === 'despachado';
  const c         = TYPE_CFG[inc.type] || TYPE_CFG.fire;
  const iconHtml  = markerSvg(inc.type, resolved);
  const strip     = resolved ? '#94a3b8' : dispatched ? '#2563eb' : c.bg;
  const stripBg   = resolved ? 'rgba(148,163,184,.08)' :
                    dispatched ? 'rgba(37,99,235,.09)' :
                    inc.type === 'fire'    ? 'rgba(234,88,12,.07)'  :
                    inc.type === 'flood'   ? 'rgba(29,78,216,.07)'  :
                                            'rgba(13,79,46,.07)';
  const sev       = inc.severity === 'high' ? 'CRÍTICO' : inc.severity === 'medium' ? 'MODERADO' : 'INFO';
  const sevCss    = inc.severity === 'high'
    ? 'background:#fef2f2;color:#b91c1c'
    : inc.severity === 'medium'
    ? 'background:#fffbeb;color:#92400e'
    : 'background:#f0fdf4;color:#15803d';
  const statusHtml = resolved
    ? '<span style="display:inline-flex;align-items:center;gap:4px;color:#15803d;font-weight:900;background:#dcfce7;border:1px solid #bbf7d0;border-radius:999px;padding:2px 7px">✓ Resolvido</span>'
    : dispatched
    ? '<span style="display:inline-flex;align-items:center;gap:4px;color:#2563eb;font-weight:900;background:#dbeafe;border:1px solid #bfdbfe;border-radius:999px;padding:2px 7px">↗ Equipe a caminho</span>'
    : '<span style="display:inline-flex;align-items:center;gap:4px;color:#ef4444;font-weight:800;background:#fef2f2;border:1px solid #fecaca;border-radius:999px;padding:2px 7px">⬤ Ativo</span>';
  const photoHtml = inc.photoURL
    ? `<div style="margin:10px 0 4px"><img src="${inc.photoURL}"
        style="width:100%;max-height:140px;object-fit:cover;border-radius:10px;cursor:zoom-in;display:block"
        onclick="window.__lbOpen('${inc.id}')" /></div>`
    : '';
  const resolveBtn = (!resolved && inc.type !== 'recycle')
    ? `<button onclick="window.__resolve('${inc.id}')"
        style="margin-top:10px;width:100%;padding:9px;border-radius:12px;border:1.5px solid #d1fae5;
               background:linear-gradient(135deg,#dcfce7,#f0fdf4);font-size:.8rem;cursor:pointer;font-family:inherit;
               font-weight:900;color:#15803d;transition:background .18s">
        ${dispatched ? '✓ Validar chegada/resolução' : '✓ Validar resolução'}
       </button>`
    : `<div style="margin-top:10px;width:100%;padding:9px;border-radius:12px;border:1px solid #bbf7d0;background:#f0fdf4;color:#15803d;font-size:.78rem;font-weight:900;text-align:center">
        Resolução confirmada no sistema
       </div>`;

  return `
  <div style="font-family:'DM Sans',system-ui">
    <div style="height:5px;background:${strip}"></div>
    <div style="padding:14px 15px 15px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="width:30px;height:30px;border-radius:9px;background:${stripBg};
                     display:inline-flex;align-items:center;justify-content:center;
                     color:${strip};font-size:1rem;flex-shrink:0">${iconHtml}</span>
        <div style="font-weight:700;font-size:.9rem;color:#0e1a0e;line-height:1.3;flex:1">${inc.title}</div>
      </div>
      <div style="font-size:.72rem;color:#6b7c6b;padding-left:38px;margin-bottom:8px">
        ${inc.time} · ${statusHtml}
      </div>
      <div style="font-size:.8rem;color:#334155;line-height:1.6">${inc.desc}</div>
      ${photoHtml}
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-top:12px;padding-top:10px;border-top:1px solid rgba(15,26,15,.07)">
        <span style="font-size:.67rem;font-weight:700;padding:3px 9px;
                     border-radius:99px;${sevCss}">${sev}</span>
        <span style="font-size:.69rem;color:#94a3b8">
          ${inc.userId ? 'Comunidade' : 'Monitoramento'}
        </span>
      </div>
      ${resolveBtn}
    </div>
  </div>`;
}

interface MapViewProps {
  incidents: Incident[];
  filter: string;
  darkMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  flyTarget: { lat: number; lng: number; zoom: number } | null;
  onToast: (inc: Incident) => void;
  gpsTarget?: [number, number] | null;
  userLocation?: [number, number] | null;
  userAccuracy?: number;
  heatVisible?: boolean;
  onResolve?: (id: string) => void;
  onLightbox?: (url: string, caption: string) => void;
  newIncidentId?: string | null;
}

export function MapView({
  incidents, filter, darkMode, onMapClick, flyTarget, onToast,
  gpsTarget, userLocation, heatVisible = false,
  onResolve, onLightbox, newIncidentId,
}: MapViewProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<mapboxgl.Map | null>(null);
  const markersRef     = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef  = useRef<mapboxgl.Marker | null>(null);
  const popupRef       = useRef<mapboxgl.Popup | null>(null);
  const darkRef        = useRef(darkMode);
  const [mapLoaded, setMapLoaded] = useState(false);

  const filtered = (filter === 'all' || filter === 'ibiapaba' || filter === 'heat')
    ? incidents
    : incidents.filter(i => i.type === filter);

  /* Global callbacks for popup buttons */
  useEffect(() => {
    (window as any).__resolve = (id: string) => {
      onResolve?.(id);
      popupRef.current?.remove();
    };
    (window as any).__lbOpen = (id: string) => {
      const inc = incidents.find(i => i.id === id);
      if (inc?.photoURL) onLightbox?.(inc.photoURL, inc.title);
    };
  }, [incidents, onResolve, onLightbox]);

  /* ── Init map once ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: darkRef.current ? STYLE_DARK : STYLE_LIGHT,
      center: CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 1.4,        // permite afastar e ver o mapa todo
      maxZoom: 20,
      pitch: 38,            // visual 3D premium
      maxPitch: 70,
      bearing: -8,
      projection: { name: 'globe' }, // visual global/360 do Mapbox
      attributionControl: true,
      dragRotate: true,
      pitchWithRotate: true,
      touchZoomRotate: true,
      cooperativeGestures: false,
    });

    // Controles profissionais: zoom, bússola/360, pitch e escala.
    map.addControl(new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');

    // Habilita rotação 360 no desktop e no mobile.
    map.dragRotate.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.enableRotation();

    const applyMapFeel = () => {
      try { map.setProjection({ name: 'globe' } as any); } catch (_) {}
      try {
        map.setFog({
          color: darkRef.current ? '#081827' : '#dbeafe',
          'high-color': darkRef.current ? '#12325a' : '#3b82f6',
          'horizon-blend': darkRef.current ? 0.08 : 0.16,
          'space-color': darkRef.current ? '#020617' : '#071426',
          'star-intensity': darkRef.current ? 0.24 : 0.18,
        } as any);
      } catch (_) {}
      setTimeout(() => map.resize(), 80);
    };
    map.on('style.load', applyMapFeel);

    // Clique no mapa (fora de marcadores)
    map.on('click', e => {
      // Não dispara se clicou num marcador
      const el = e.originalEvent.target as HTMLElement;
      if (el.closest('.am-mb-pin')) return;
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });

    // Cursor pointer sobre marcadores
    map.on('mousemove', e => {
      const el = e.originalEvent.target as HTMLElement;
      map.getCanvas().style.cursor = el.closest('.am-mb-pin') ? 'pointer' : '';
    });

    map.once('load', () => setMapLoaded(true));

    mapRef.current = map;
    return () => {
      map.off('style.load', applyMapFeel);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Dark mode toggle ── */
  useEffect(() => {
    darkRef.current = darkMode;
    const map = mapRef.current;
    if (!map) return;

    const styleUrl = darkMode ? STYLE_DARK : STYLE_LIGHT;
    const applyVisuals = () => {
      try { map.setProjection({ name: 'globe' } as any); } catch (_) {}
      try {
        map.setFog({
          color: darkMode ? '#081827' : '#dbeafe',
          'high-color': darkMode ? '#12325a' : '#3b82f6',
          'horizon-blend': darkMode ? 0.08 : 0.16,
          'space-color': darkMode ? '#020617' : '#071426',
          'star-intensity': darkMode ? 0.24 : 0.18,
        } as any);
      } catch (_) {}
      setTimeout(() => {
        try { map.resize(); map.triggerRepaint(); } catch (_) {}
      }, 90);
    };

    const reloadStyle = () => {
      try { popupRef.current?.remove(); } catch (_) {}
      try { map.stop(); } catch (_) {}
      try {
        map.setStyle(styleUrl, { diff: false } as any);
        map.once('style.load', applyVisuals);
        map.once('idle', applyVisuals);
      } catch (_) {
        try { map.setStyle(styleUrl); map.once('style.load', applyVisuals); } catch (_) {}
      }
    };

    if (map.loaded() || map.isStyleLoaded()) reloadStyle();
    else map.once('load', reloadStyle);
  }, [darkMode]);

  /* ── Radar ring GL layers (substituem CSS rings — seguem o mapa) ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addRings = () => {
      // Remove existing
      ['am-rings-layer', 'am-rings-layer2'].forEach(id => {
        try { if (map.getLayer(id)) map.removeLayer(id); } catch (_) {}
      });
      try { if (map.getSource('am-rings')) map.removeSource('am-rings'); } catch (_) {}

      const active = filtered.filter(i => i.status !== 'resolvido');
      if (!active.length) return;

      const colors: Record<string, string> = { fire: '#ea580c', flood: '#1d4ed8', recycle: '#0d4f2e' };

      map.addSource('am-rings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: active.map(inc => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [inc.lng, inc.lat] },
            properties: { color: colors[inc.type] || '#ea580c' },
          })),
        },
      });

      // Outer ring — pulsa via paint expression
      map.addLayer({
        id: 'am-rings-layer',
        type: 'circle',
        source: 'am-rings',
        paint: {
          'circle-radius': 26,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.12,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.35,
          'circle-pitch-alignment': 'map',   // cola no plano do mapa
          'circle-pitch-scale': 'map',
        },
      });

      map.addLayer({
        id: 'am-rings-layer2',
        type: 'circle',
        source: 'am-rings',
        paint: {
          'circle-radius': 40,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.05,
          'circle-stroke-width': 1,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.18,
          'circle-pitch-alignment': 'map',
          'circle-pitch-scale': 'map',
        },
      });
    };

    if (map.isStyleLoaded()) addRings();
    map.on('style.load', addRings);
    return () => { map.off('style.load', addRings); };
  }, [filtered]);

  /* ── Sync DOM markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      const ids = new Set(filtered.map(i => i.id));

      // Remove stale
      markersRef.current.forEach((m, id) => {
        if (!ids.has(id)) { m.remove(); markersRef.current.delete(id); }
      });

      // Add/update markers
      filtered.forEach(inc => {
        const existing = markersRef.current.get(inc.id);
        const resolved = inc.status === 'resolvido';
        if (existing) {
          const existingEl = existing.getElement();
          if (existingEl.dataset.status === String(inc.status || 'ativo')) {
            existing.setLngLat([inc.lng, inc.lat]);
            return;
          }
          existing.remove();
          markersRef.current.delete(inc.id);
        }
        const isNew    = inc.id === newIncidentId;
        const el = markerEl(inc.type, resolved, isNew);
        el.dataset.status = String(inc.status || 'ativo');

        el.addEventListener('click', e => {
          e.stopPropagation();
          onToast(inc);
          popupRef.current?.remove();
          const popup = new mapboxgl.Popup({
            offset: [0, -20],
            closeButton: true,
            maxWidth: '290px',
            className: 'am-popup',
            anchor: 'bottom',
          })
            .setLngLat([inc.lng, inc.lat])
            .setHTML(popupHTML(inc))
            .addTo(map);
          popupRef.current = popup;
        });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        })
          .setLngLat([inc.lng, inc.lat])
          .addTo(map);

        markersRef.current.set(inc.id, marker);
      });
    };

    if (map.isStyleLoaded()) sync();
    else map.once('load', sync);
    map.on('style.load', sync);
    return () => { map.off('style.load', sync); };
  }, [filtered, newIncidentId, onResolve, onToast]);

  /* ── Fly to incident ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    const go = () => map.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: flyTarget.zoom,
      duration: 1200,
      pitch: 38,
      essential: true,
    });
    if (map.isStyleLoaded()) go(); else map.once('load', go);
  }, [flyTarget]);

  /* ── GPS fly ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !gpsTarget) return;
    const go = () => map.flyTo({ center: [gpsTarget[1], gpsTarget[0]], zoom: 15, pitch: 38, duration: 1500, essential: true });
    if (map.isStyleLoaded()) go(); else map.once('load', go);
  }, [gpsTarget]);

  /* ── User location dot ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [userLocation[1], userLocation[0]];

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(lngLat);
      return;
    }

    const el = document.createElement('div');
    el.className = 'am-mb-user-marker';

    const dot = document.createElement('div');
    dot.className = 'am-mb-userdot';
    el.appendChild(dot);

    const add = () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(lngLat);
        return;
      }
      userMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport',
      })
        .setLngLat(lngLat)
        .addTo(map);
    };
    if (map.isStyleLoaded()) add(); else map.once('load', add);
  }, [userLocation]);

  /* ── Heatmap GL layer ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basePoints: [number, number, number][] = [
      [-40.9897, -3.7319, 0.9], [-40.8649, -4.0488, 0.75], [-41.1068, -4.2843, 0.88],
      [-40.99,   -3.73,   0.6], [-40.87,   -4.05,   0.5],  [-40.90,   -3.95,   0.55],
      [-41.0,    -4.15,   0.62],[-40.98,   -3.80,   0.42], [-41.0,    -4.30,   0.65],
    ];
    const livePoints: [number, number, number][] = incidents
      .filter(i => i.status !== 'resolvido')
      .map(i => [i.lng, i.lat, i.severity === 'high' ? 1.0 : i.severity === 'medium' ? 0.65 : 0.35]);

    const geoData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [...basePoints, ...livePoints].map(([lng, lat, w]) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { w },
      })),
    };

    const applyHeat = () => {
      try {
        if (map.getSource('am-heat')) {
          (map.getSource('am-heat') as mapboxgl.GeoJSONSource).setData(geoData);
          map.setLayoutProperty('am-heat-layer', 'visibility', heatVisible ? 'visible' : 'none');
          return;
        }
        map.addSource('am-heat', { type: 'geojson', data: geoData });
        map.addLayer({
          id: 'am-heat-layer',
          type: 'heatmap',
          source: 'am-heat',
          layout: { visibility: heatVisible ? 'visible' : 'none' },
          paint: {
            'heatmap-weight'    : ['interpolate', ['linear'], ['get', 'w'], 0, 0, 1, 1],
            'heatmap-intensity' : 1.3,
            'heatmap-radius'    : 55,
            'heatmap-opacity'   : 0.7,
            'heatmap-color'     : [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, '#fef3c7',
              0.5, '#f97316',
              0.8, '#ef4444',
              1.0, '#991b1b',
            ],
          },
        });
      } catch (_) {}
    };

    if (map.isStyleLoaded()) applyHeat(); else map.once('load', applyHeat);
    map.on('style.load', applyHeat);
    return () => { map.off('style.load', applyHeat); };
  }, [heatVisible, incidents]);

  return (
    <div
      className={`am-map-frame ${darkMode ? 'am-map-dark' : 'am-map-light'}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {!mapLoaded && (
        <div className="am-map-loading">
          <div className="am-map-loading-dot"></div>
          <span>Carregando mapa…</span>
        </div>
      )}
    </div>
  );
}
