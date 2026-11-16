import {
  PlaceType,
  controlTypeForId,
  twinfileWithEffectiveProcessors,
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import {
  PatchContext,
  PatchProgram,
  buildSituationMessage,
  situationPulseHandler,
  type ContextSlice,
  type PatchTrace,
} from '@doppler-group/twinfile-core';

import type { PlayerContextPulse } from './types/player-context.js';

function defaultSituationHead(ref: string): Record<string, unknown> {
  const slug = ref.includes('/') ? ref.split('/').pop()! : ref;
  return { id: slug, version: '0.1.0', phases: ['warning', 'all-clear', 'notice', 'release'] };
}

function headsFromBuild(result: BuildTwinfileResult, ref: string): Record<string, unknown>[] {
  const bundled = (result.situations ?? []) as Record<string, unknown>[];
  const slug = ref.includes('/') ? ref.split('/').pop()! : ref;
  const fromBundle = bundled.find((h) => h.id === slug || h.id === ref);
  if (fromBundle) return bundled;
  return [...bundled, defaultSituationHead(ref)];
}

function sliceFromPlayer(body: PlayerContextPulse): ContextSlice {
  return {
    situations: body.situations,
    signals: body.signals,
    feeds: body.feeds?.map((row) => ({ ...row })),
  };
}

function validateTriggerFeeds(placeType: PlaceType, body: PlayerContextPulse): string | undefined {
  for (const feed of body.feeds ?? []) {
    if (feed.wire !== 'signal:trigger') continue;
    const value = feed.value;
    if (!value || typeof value !== 'object') continue;
    const controlId = (value as { control?: unknown }).control;
    if (typeof controlId !== 'string') continue;
    if (!placeType.acceptsControl(controlId)) {
      return `Place does not accept control ${controlId}`;
    }
    const parsed = controlTypeForId(controlId).parsePayload(value);
    if (!parsed.ok) return parsed.errors[0]?.message ?? 'Invalid control payload';
  }
  return undefined;
}

export function traceWireSummary(trace: PatchTrace): string[] {
  const wires = new Set<string>();
  for (const row of trace.entries) {
    wires.add(row.message.wire);
  }
  return [...wires];
}

export function applyPlayerContextPulse(
  result: BuildTwinfileResult,
  body: PlayerContextPulse,
): { ok: true; trace: PatchTrace } | { ok: false; error: string } {
  const twinfile = twinfileWithEffectiveProcessors(result.loaded.twinfile);
  const placeType = PlaceType.fromBuilt({
    twinfile,
    place: result.data as Record<string, unknown>,
  });
  const feedError = validateTriggerFeeds(placeType, body);
  if (feedError) return { ok: false, error: feedError };

  const program = PatchProgram.fromBuilt({
    twinfile,
    place: result.data as Record<string, unknown>,
    situations: headsFromBuild(result, body.situations?.[0]?.ref ?? 'severe-weather'),
  });
  if (!program) {
    return { ok: false, error: 'Place has no processor graph' };
  }
  const graph = program.graph.raw;
  const routesSituationToAlert = (graph.connections ?? []).some(
    (c) => c.from.module === 'context-situations' && c.from.port === 'alert',
  );
  if (routesSituationToAlert) {
    program.setHandler(
      'context-situations',
      situationPulseHandler({ alertTo: { module: 'context-signals', port: 'alert' } }),
    );
  } else if (graph.modules.some((m) => m.id === 'context-situations')) {
    program.setHandler('context-situations', situationPulseHandler({}));
  }
  const slice = sliceFromPlayer({
    ...body,
    situations: body.situations?.map((row) => ({
      ...row,
      enabled: true,
      target: row.target ?? { module: 'context-situations', port: 'in' },
    })),
  });
  const trace: PatchTrace = { entries: [] };

  const heads = headsFromBuild(result, body.pulses?.[0]?.ref ?? body.situations?.[0]?.ref ?? 'severe-weather');
  const headByRef = new Map<string, Record<string, unknown>>();
  for (const h of heads) {
    const id = typeof h.id === 'string' ? h.id : '';
    if (id) headByRef.set(id, h);
  }

  const target = { module: 'context-situations', port: 'in' as const };
  for (const pulse of body.pulses ?? []) {
    const slug = pulse.ref.includes('/') ? pulse.ref.split('/').pop()! : pulse.ref;
    const head = headByRef.get(slug) ?? defaultSituationHead(slug);
    const built = buildSituationMessage({
      situationHead: head,
      phase: pulse.phase,
      pulse: pulse.pulse ?? 'fast',
      edge: pulse.edge,
      to: target,
    });
    if (!built.ok) continue;
    const routed = program.publish(built.value);
    if (routed.ok) trace.entries.push(routed.value);
    for (const msg of program.route(built.value)) {
      const pub = program.publish(msg);
      if (pub.ok) trace.entries.push(pub.value);
    }
  }

  const hasAmbient =
    (body.situations?.length ?? 0) > 0 || (body.feeds?.length ?? 0) > 0 || Object.keys(body.signals ?? {}).length > 0;
  if (hasAmbient) {
    trace.entries.push(...program.curry(new PatchContext(slice)).flush().entries);
  }

  return { ok: true, trace };
}
