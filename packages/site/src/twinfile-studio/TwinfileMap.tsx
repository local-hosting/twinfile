'use client';

import { createElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { resolveMapboxKeyFromEnv, resolveMaptilerKeyFromEnv } from '@local-hosting/geokit/env/map-credentials';
import { firstEnv, readRuntimeEnv } from '@local-hosting/geokit/env/primitives';

import '@local-hosting/geokit/ui/theme.css';

import { placePinSupportsIsochrone } from './map-place-pin.js';
import type { LngLat, MapDraft, TwinfileFeature } from './types/map-draft.js';

const LEGACY_MAPTILER_KEYS = ['NEXT_PUBLIC_MAPTILER_KEY'] as const;

function resolveMaptilerApiKey(explicit?: string): string | undefined {
  return (
    explicit?.trim() ||
    resolveMaptilerKeyFromEnv() ||
    firstEnv(readRuntimeEnv(), LEGACY_MAPTILER_KEYS)
  );
}

export type TwinfileMapProps = {
  draft: MapDraft;
  /** Remount map when the unit changes (e.g. shop → airport). */
  unitKey?: string;
  mapProvider?: string;
  apiKey?: string;
  /** Mapbox token. Geokit uses it for the live isochrone. */
  mapboxToken?: string;
};

type GkMapElement = HTMLElement & { resizeAndRepaintMap?: () => void };

let geokitLoadPromise: Promise<void> | undefined;
let geokitLoadToken: string | undefined;

/** Hosts `gk-map`. Drawing colors come from the geokit theme. */
export function TwinfileMap({
  draft,
  unitKey,
  mapProvider,
  apiKey,
  mapboxToken: mapboxTokenProp,
}: TwinfileMapProps) {
  const mapboxToken = mapboxTokenProp ?? resolveMapboxKeyFromEnv();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mapEl, setMapEl] = useState<GkMapElement | null>(null);
  const [geokitReady, setGeokitReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [mapMountId, setMapMountId] = useState(0);
  const sizedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const tokenKey = mapboxToken ?? '';
    if (geokitLoadPromise && geokitLoadToken !== tokenKey) {
      geokitLoadPromise = undefined;
    }
    geokitLoadToken = tokenKey;
    geokitLoadPromise ??= loadGeokitElements(mapboxToken);
    void geokitLoadPromise
      .then(async () => {
        if (typeof customElements !== 'undefined') {
          await customElements.whenDefined('gk-map');
        }
        if (!cancelled) setGeokitReady(true);
      })
      .catch((error: unknown) => {
        console.error(error);
        geokitLoadPromise = undefined;
        if (!cancelled) setGeokitReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!container) return;
    sizedRef.current = false;

    const measure = (): void => {
      const ready = container.clientWidth >= 48 && container.clientHeight >= 48;
      setContainerReady(ready);
      if (ready && !sizedRef.current) {
        sizedRef.current = true;
        setMapMountId((id) => id + 1);
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [container, unitKey]);

  useEffect(() => {
    if (!container || !mapEl) return;
    const ro = new ResizeObserver(() => mapEl.resizeAndRepaintMap?.());
    ro.observe(container);
    return () => ro.disconnect();
  }, [container, mapEl]);

  useEffect(() => {
    if (!mapEl || !containerReady || !geokitReady) return;
    const handle = window.requestAnimationFrame(() => {
      mapEl.resizeAndRepaintMap?.();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [mapEl, containerReady, geokitReady, draft.features.length, draft.camera.lat, draft.camera.lng]);

  const mapOverlays = useMemo(
    () =>
      mapChildren(draft.features, geokitReady && Boolean(mapboxToken)).filter(
        (child): child is Exclude<ReactNode, null | undefined | false> =>
          child !== null && child !== undefined && child !== false,
      ),
    [draft.features, geokitReady, mapboxToken],
  );

  const camera = draft.camera;
  const resolvedKey = resolveMaptilerApiKey(apiKey);
  const canRenderMap = Boolean(mapProvider || resolvedKey);
  return createElement(
    'div',
    { ref: setContainer, className: 'twinfile-editor__map' },
    !canRenderMap
      ? createElement(
          'p',
          {
            className: 'twinfile-editor__map-hint',
            style: mapHintStyle,
          },
          'Map needs MAPTILER_KEY in geokit/.env (set GEOKIT_MAP_API_KEY or MAPTILER_KEY).',
        )
      : !geokitReady
        ? createElement('p', { className: 'twinfile-editor__map-hint', style: mapHintStyle }, 'Loading map…')
        : !containerReady
          ? createElement('p', { className: 'twinfile-editor__map-hint', style: mapHintStyle }, 'Preparing map…')
          : createElement(
              'gk-map',
              {
                ref: setMapEl,
                key: `${unitKey ?? 'twinfile-map'}:${mapMountId}`,
                theme: 'dark',
                'map-style': 'dataviz-dark',
                lat: String(camera.lat),
                lng: String(camera.lng),
                zoom: String(mapboxToken ? frameIsochroneZoom(camera.zoom) : camera.zoom),
                ...(mapProvider
                  ? { provider: mapProvider }
                  : resolvedKey
                    ? { provider: 'maptiler' }
                    : {}),
                ...(resolvedKey ? { 'api-key': resolvedKey } : {}),
              },
              ...mapOverlays,
            ),
  );
}

const mapHintStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  margin: 0,
  padding: '1rem',
  textAlign: 'center' as const,
  fontSize: '0.875rem',
  color: 'var(--tf-prose-muted, #8b949e)',
};

function mapChildren(features: TwinfileFeature[], showIsochrone: boolean): ReactNode[] {
  const overlays: ReactNode[] = [];
  for (const [index, feature] of features.entries()) {
    if (feature.geometry.type !== 'Point') continue;
    const [lng, lat] = feature.geometry.coordinates;
    const id = `${feature.properties.id}:${index}`;
    const cell = feature.properties.h3;
    if (cell) overlays.push(h3Cell(id, cell));
    if (showIsochrone && placePinSupportsIsochrone(feature)) overlays.push(isochrone(id, lat, lng));
  }
  return [...overlays, ...features.map((feature, index) => renderFeature(feature, index))];
}

function h3Cell(id: string, h3: string): ReactNode {
  return geokitElement(`h3:${id}`, 'gk-h3', {
    'h3-index': h3,
  });
}

function isochrone(id: string, lat: number, lng: number): ReactNode {
  return geokitElement(`isochrone:${id}`, 'gk-isochrone', {
    lat: String(lat),
    lng: String(lng),
    time: '15',
    mode: 'driving',
    render: 'polygon',
    visible: 'true',
  });
}

/** Geokit elements expose getter-only fields such as `time` and `glow`. Set attributes directly. */
function geokitElement(key: string, tag: string, attrs: Record<string, string>): ReactNode {
  return createElement(tag, {
    key,
    ref: (node: HTMLElement | null) => {
      if (!node) return;
      for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    },
  });
}

function renderFeature(feature: TwinfileFeature, index: number): ReactNode {
  const key = `${feature.properties.id}:${index}`;
  const geometry = feature.geometry;
  switch (geometry.type) {
    case 'Point': {
      const [lng, lat] = geometry.coordinates;
      return geokitElement(key, 'gk-point', {
        lat: String(lat),
        lng: String(lng),
        size: '4',
        glow: '',
        'point-id': feature.properties.id,
        ...(feature.properties.name ? { 'point-name': feature.properties.name } : {}),
      });
    }
    case 'LineString':
      return createElement('gk-polyline', {
        key,
        points: JSON.stringify(latLngPairs(geometry.coordinates)),
      });
    case 'Polygon': {
      const ring = geometry.coordinates[0];
      if (!ring || ring.length === 0) return null;
      return createElement('gk-polygon', {
        key,
        points: JSON.stringify(latLngPairs(ring)),
      });
    }
    default: {
      const unreachable: never = geometry;
      throw new Error(`Unknown geometry ${String(unreachable)}`);
    }
  }
}

/** Load geokit in the browser. Its element classes extend HTMLElement. */
async function loadGeokitElements(mapboxToken?: string): Promise<void> {
  const ui = await import('@local-hosting/geokit/ui');
  void ui.MapElement;
  void ui.PointElement;
  void ui.PolygonElement;
  void ui.PolylineElement;
  void ui.H3Element;
  void ui.IsochroneElement;
  if (!mapboxToken) return;
  try {
    await registerMapboxTravel(mapboxToken);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Register Mapbox directly. ensureMapboxApiReady imports the plugin through a
 * variable, which webpack cannot bundle, so the isochrone router stays empty.
 */
async function registerMapboxTravel(mapboxToken: string): Promise<void> {
  const mapbox = await import('@local-hosting/geokit/mapbox');
  await mapbox.registerMapboxPlugin({ mapboxAccessToken: mapboxToken });
  const routers = await import('@local-hosting/geokit/service/setup-capability-routers');
  await routers.rebuildCapabilityRouters();
}

/** A 15-minute drive contour is wider than a street-level pin. */
function frameIsochroneZoom(authored: number): number {
  return Math.min(authored, 11);
}

/** Geokit shape attributes take `[lat, lng]` pairs. */
function latLngPairs(coordinates: LngLat[]): Array<[number, number]> {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}
