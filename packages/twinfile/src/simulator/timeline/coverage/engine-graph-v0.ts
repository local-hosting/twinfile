import {
  buildPlaceGraph,
  exposureLossAlongPath,
  shortestPath,
  spacesOnPath,
} from './graph.js';
import { resolveProfile } from './profiles.js';
import type { CoverageMetric, CoverageProfileDef, PlaceGraphEdge, RadioAsset } from './types.js';

function assetRadio(asset: Record<string, unknown>): RadioAsset {
  const radio = asset.radio;
  if (!radio || typeof radio !== 'object' || Array.isArray(radio)) {
    throw new Error(`asset "${String(asset.id)}" needs radio.protocol for coverage`);
  }
  const row = radio as Record<string, unknown>;
  const protocol = row.protocol;
  if (protocol !== 'wifi' && protocol !== 'ble' && protocol !== 'lora') {
    throw new Error(`asset "${String(asset.id)}": radio.protocol must be wifi, ble, or lora`);
  }
  return {
    protocol,
    ...(typeof row.tx_power_dbm === 'number' ? { tx_power_dbm: row.tx_power_dbm } : {}),
  };
}

function txPowerDbm(radio: RadioAsset, profile: CoverageProfileDef): number {
  return radio.tx_power_dbm ?? profile.default_tx_power_dbm ?? 20;
}

function pathLossDb(distanceM: number, profile: CoverageProfileDef): number {
  const pl0 = profile.pl0 ?? 40;
  const n = profile.path_loss_n ?? 2.5;
  const d = Math.max(distanceM, 1);
  return pl0 + 10 * n * Math.log10(d);
}

function edgeLosses(pathEdges: PlaceGraphEdge[], profile: CoverageProfileDef): number {
  let total = 0;
  const routeKinds = profile.route_kind_db ?? {};
  const openingDb = profile.opening_db ?? 5;
  for (const edge of pathEdges) {
    if (edge.via === 'opening') total += openingDb;
    else if (edge.routeKind) total += routeKinds[edge.routeKind] ?? 0;
  }
  return total;
}

export type CoverageSampleInput = {
  mergedPlace: Record<string, unknown>;
  radioAssetId: string;
  targetSpaceId: string;
  metric: CoverageMetric;
  thresholdDbm?: number;
  profileId?: string;
  engineId?: string;
};

export function sampleCoverageGraphV0(input: CoverageSampleInput): number | null {
  if (input.engineId && input.engineId !== 'graph-v0') {
    throw new Error(`coverage engine "${input.engineId}" is not supported`);
  }

  const assets = (input.mergedPlace.assets ?? []) as Array<Record<string, unknown>>;
  const asset = assets.find((a) => a.id === input.radioAssetId);
  if (!asset) throw new Error(`coverage track references unknown radio asset "${input.radioAssetId}"`);
  const radioSpace = asset.space;
  if (typeof radioSpace !== 'string') {
    throw new Error(`asset "${input.radioAssetId}" needs space for coverage`);
  }

  const radio = assetRadio(asset);
  const profile = resolveProfile(input.mergedPlace, input.profileId, radio.protocol);
  const graph = buildPlaceGraph(input.mergedPlace);
  const openingPathM = profile.opening_path_m ?? 8;

  if (!graph.spaces.has(input.targetSpaceId)) {
    throw new Error(`coverage track references unknown space "${input.targetSpaceId}"`);
  }

  const tx = txPowerDbm(radio, profile);
  const offset = profile.same_space_offset_db ?? -40;

  if (radioSpace === input.targetSpaceId) {
    const rssi = tx + offset;
    return metricValue(input.metric, rssi, input.thresholdDbm ?? -75);
  }

  const path = shortestPath(graph, radioSpace, input.targetSpaceId, openingPathM);
  if (!path) {
    return input.metric === 'served' ? 0 : null;
  }

  if (profile.max_range_m !== undefined && path.distance_m > profile.max_range_m) {
    return input.metric === 'served' ? 0 : null;
  }

  const pathSpaces = spacesOnPath(radioSpace, input.targetSpaceId, path.edges);
  const loss =
    pathLossDb(path.distance_m, profile) +
    exposureLossAlongPath(graph, pathSpaces, profile.exposure_db ?? {}) +
    edgeLosses(path.edges, profile);

  const rssi = tx - loss;
  return metricValue(input.metric, rssi, input.thresholdDbm ?? -75);
}

function metricValue(metric: CoverageMetric, rssiDbm: number, thresholdDbm: number): number {
  if (metric === 'rssi_dbm') return rssiDbm;
  return rssiDbm >= thresholdDbm ? 1 : 0;
}
