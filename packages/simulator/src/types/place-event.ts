import type { TwinMessageV1 } from '@local-hosting/twinfile-core';

/** Role expectation on a catalog event (`expects`); matches core contract checker shape. */
export type ExpectsRole = {
  kind: string;
  min: number;
};

import type { EventPulseEdge, EventPulseKind } from './event-pulse.js';

/** Inbound timeline / player trigger for a catalog event id. */
export type PlaceEventRequest = {
  type: string;
  phase?: string;
  edge?: EventPulseEdge;
  pulse?: EventPulseKind;
  args?: Record<string, unknown>;
  until?: string;
  at?: string;
  seq?: number;
  from?: TwinMessageV1['from'];
  to?: TwinMessageV1['to'];
};

/** Catalog entry: metadata + optional custom `request`; default emits `twin:event`. */
export type PlaceEvent = {
  id: string;
  name: string;
  version?: string;
  stability?: string;
  phases?: string[];
  expects?: Record<string, ExpectsRole>;
  args?: Record<string, unknown>;
  layers?: string[];
  catalog?: Record<string, unknown>;
  request(req: PlaceEventRequest): TwinMessageV1[];
};

export type PlaceEventHead = Record<string, unknown> & {
  twinfile: number;
  kind: 'event';
  id: string;
  name: string;
  version: string;
};
