import type { TwinMessageV1 } from '@doppler-group/twinfile-core';

/** Role expectation on a catalog event (`expects`); matches core contract checker shape. */
export type ExpectsRole = {
  kind: string;
  min: number;
};

import type { SituationPulseEdge, SituationPulseKind } from './situation-pulse.js';

/** Inbound timeline / player trigger for a catalog event id. */
export type PlaceEventRequest = {
  type: string;
  phase?: string;
  edge?: SituationPulseEdge;
  pulse?: SituationPulseKind;
  args?: Record<string, unknown>;
  until?: string;
  at?: string;
  seq?: number;
  from?: TwinMessageV1['from'];
  to?: TwinMessageV1['to'];
};

/** Catalog entry: metadata + optional custom `request`; default emits `twin:situation`. */
export type PlaceEvent = {
  id: string;
  name: string;
  version?: string;
  stability?: string;
  catalogKind?: 'situation' | 'event';
  phases?: string[];
  timetable?: Record<string, string>;
  expects?: Record<string, ExpectsRole>;
  args?: Record<string, unknown>;
  layers?: string[];
  catalog?: Record<string, unknown>;
  request(req: PlaceEventRequest): TwinMessageV1[];
};

export type PlaceEventHead = Record<string, unknown> & {
  twinfile: number;
  kind: 'situation' | 'event';
  id: string;
  name: string;
  version: string;
};
