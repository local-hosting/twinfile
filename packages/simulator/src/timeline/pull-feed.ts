import type { FeedProtocol, FeedRow } from '../types/twinfile-time.js';

import { parseInstant } from './clock.js';

export type FeedPullRequest = {
  protocol: Exclude<FeedProtocol, 'file'>;
  url: string;
  deviceId: string;
  observedProperty: string;
  unit?: string;
};

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

type Row = Record<string, unknown>;

function asRecord(value: unknown, where: string): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${where}: expected an object`);
  }
  return value as Row;
}

function requireInstant(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${where}: expected an RFC 3339 instant`);
  return value;
}

function requireNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${where}: expected a number`);
  return value;
}

async function readJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`feed pull ${url}: HTTP ${response.status}`);
  return response.json();
}

function rowFrom(request: FeedPullRequest, value: number, observedAt: string, availableAt?: string): FeedRow {
  if (availableAt && parseInstant(availableAt, 'available_at') < parseInstant(observedAt, 'observed_at')) {
    throw new Error(`feed pull ${request.deviceId}: available_at ${availableAt} is before observed_at`);
  }
  return {
    device_id: request.deviceId,
    observed_property: request.observedProperty,
    value,
    observed_at: observedAt,
    ...(request.unit ? { unit: request.unit } : {}),
    ...(availableAt ? { available_at: availableAt } : {}),
  };
}

function mapSensorThings(request: FeedPullRequest, observation: unknown): FeedRow {
  const row = asRecord(observation, 'sensorthings observation');
  const observedAt = requireInstant(row.phenomenonTime, 'phenomenonTime');
  const available = row.resultTime === undefined ? undefined : requireInstant(row.resultTime, 'resultTime');
  return rowFrom(request, requireNumber(row.result, 'result'), observedAt, available);
}

async function pullSensorThings(request: FeedPullRequest, fetchImpl: FetchLike): Promise<FeedRow[]> {
  const rows: FeedRow[] = [];
  let page: string | undefined = request.url;
  for (let hop = 0; hop < 10 && page; hop += 1) {
    const body = asRecord(await readJson(fetchImpl, page), 'sensorthings page');
    const values = Array.isArray(body.value) ? body.value : [body];
    for (const observation of values) rows.push(mapSensorThings(request, observation));
    page = typeof body['@iot.nextLink'] === 'string' ? body['@iot.nextLink'] : undefined;
  }
  if (rows.length === 0) throw new Error(`feed pull ${request.deviceId}: SensorThings returned no observations`);
  return rows;
}

function mapNgsi(request: FeedPullRequest, entity: unknown): FeedRow {
  const row = asRecord(entity, 'ngsi-ld entity');
  const property = asRecord(row[request.observedProperty], request.observedProperty);
  const observedAt = requireInstant(property.observedAt, 'observedAt');
  const available = row.dateModified === undefined ? undefined : requireInstant(row.dateModified, 'dateModified');
  return rowFrom(request, requireNumber(property.value, 'value'), observedAt, available);
}

async function pullNgsiLd(request: FeedPullRequest, fetchImpl: FetchLike): Promise<FeedRow[]> {
  const body = await readJson(fetchImpl, request.url);
  const entities = Array.isArray(body) ? body : [body];
  if (entities.length === 0) throw new Error(`feed pull ${request.deviceId}: NGSI-LD returned no entities`);
  return entities.map((entity) => mapNgsi(request, entity));
}

/** Pull live observations into the JSON Lines rows the clock already samples. */
export async function pullFeedRows(request: FeedPullRequest, fetchImpl: FetchLike = fetch): Promise<FeedRow[]> {
  switch (request.protocol) {
    case 'sensorthings':
      return pullSensorThings(request, fetchImpl);
    case 'ngsi-ld':
      return pullNgsiLd(request, fetchImpl);
    default: {
      const neverProtocol: never = request.protocol;
      throw new Error(`feed pull: unsupported protocol ${String(neverProtocol)}`);
    }
  }
}

export function feedRowsToJsonl(rows: FeedRow[]): string {
  if (rows.length === 0) throw new Error('feed pull: no rows to write');
  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}
