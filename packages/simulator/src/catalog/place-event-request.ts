import {
  buildSituationMessage,
  err,
  ok,
  type Result,
  type TwinError,
  type TwinMessageV1,
} from '@local-hosting/twinfile-core';

import type { PlaceEvent, PlaceEventRequest } from '../types/place-event.js';

import { placeEventCatalogKind, placeEventRef, placeEventToHead } from './place-event-head.js';

function defaultPhase(event: Omit<PlaceEvent, 'request'>, req: PlaceEventRequest): string {
  if (req.phase) return req.phase;
  if (event.phases?.length) return event.phases[0]!;
  const keys = event.timetable ? Object.keys(event.timetable) : [];
  if (keys.length) return keys[0]!;
  return 'active';
}

export function placeEventRequestMessages(
  event: Omit<PlaceEvent, 'request'>,
  req: PlaceEventRequest,
): Result<TwinMessageV1[], TwinError[]> {
  if (req.type && req.type !== event.id) {
    return err([
      {
        code: 'E_SITUATION',
        message: `event id "${event.id}" does not match request type "${req.type}"`,
      },
    ]);
  }
  const head = placeEventToHead(event);
  const phase = defaultPhase(event, req);
  const pulse = req.pulse ?? 'fast';
  const edge = req.edge ?? 'enter';
  const situationRef =
    placeEventCatalogKind(event) === 'situation'
      ? placeEventRef(event)
      : `twinfile/event/${event.id}:${event.version ?? '1.0.0'}`;
  const built = buildSituationMessage({
    situationHead: head,
    situationRef,
    phase,
    pulse,
    edge,
    at: req.at,
    seq: req.seq,
    args: req.args,
    until: req.until,
    from: req.from,
    to: req.to,
  });
  if (!built.ok) return built;
  return ok([built.value]);
}

export function definePlaceEvent(
  def: Omit<PlaceEvent, 'request'> & { request?: PlaceEvent['request'] },
): PlaceEvent {
  const { request: customRequest, ...rest } = def;
  const base: Omit<PlaceEvent, 'request'> = { ...rest, version: def.version ?? '1.0.0' };
  const request: PlaceEvent['request'] =
    customRequest ??
    ((req: PlaceEventRequest) => {
      const messages = placeEventRequestMessages(base, req);
      if (!messages.ok) return [];
      return messages.value;
    });
  return { ...base, request };
}
