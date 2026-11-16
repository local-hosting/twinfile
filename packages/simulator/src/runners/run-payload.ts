import { createPlaceTimelinePayload } from '../timeline/timeline.js';
import { scenarioUseMode } from '../timeline/phase-starts.js';
import { timelineOptionsFromTFPlace } from '../place/tf-place-timeline.js';
import type { TFPlace } from '../types/tf-runtime.js';
import type { ClockSpec } from '../types/twinfile-time.js';
import {
  eventBindingsFromBuilt,
  type Place,
} from '@local-hosting/twinfile-place';

export type RunPayloadOptions = {
  built: Place;
  layers: unknown;
  twinfile: Record<string, unknown>;
  runName: string;
  args: Record<string, unknown>;
  placeRoot: string;
  seed: number;
};

export type RunPayloadFromTFPlaceOptions = {
  place: TFPlace;
  layers: unknown;
  runName: string;
  args?: Record<string, unknown>;
  runners?: unknown[];
  /** MCP/CI analyst prompt — not authored on run.yaml */
  testPrompt?: string;
};

/** Runner stdin from a {@link TFPlace} (`TFPlace.compose` / {@link TFPlace.load}). */
export function createRunPayloadFromTFPlace(options: RunPayloadFromTFPlaceOptions): Record<string, unknown> {
  const timelineOpts = timelineOptionsFromTFPlace(options.place);
  const args = options.args ?? options.place.resolvedArgs ?? {};
  const eventBindings = eventBindingsFromBuilt(options.place.data);
  return {
    place: options.place.data,
    digest: options.place.digest,
    layers: options.layers,
    scenario: {
      name: options.runName,
      args: { ...args, unitRoot: options.place.unitRoot },
      metrics: [],
      ...(options.runners?.length ? { runners: options.runners } : {}),
      ...(options.testPrompt ? { test_prompt: options.testPrompt } : {}),
    },
    eventBindings,
    seed: options.place.seed ?? 1,
    ...(timelineOpts
      ? { timeline: createPlaceTimelinePayload({ ...timelineOpts, resolvedArgs: args }) }
      : {}),
  };
}

/** Runner stdin payload; adds a precomputed `timeline` when the scenario declares a `clock`. */
export function createRunPayload(options: RunPayloadOptions): Record<string, unknown> {
  const clock = options.twinfile.clock as ClockSpec | undefined;
  const events = (options.built.events ?? []) as Record<string, unknown>[];
  const use = options.twinfile.use as { runners?: unknown } | undefined;
  const runners = Array.isArray(use?.runners) ? use.runners : undefined;
  const eventBindings = eventBindingsFromBuilt(options.built.data);
  return {
    digest: options.built.digest,
    meta: options.built.meta,
    place: options.built.data,
    layers: options.layers,
    scenario: {
      name: options.runName,
      args: { ...options.args, unitRoot: options.placeRoot },
      metrics: [],
      ...(runners ? { runners } : {}),
    },
    eventBindings,
    seed: options.seed,
    ...(clock
      ? {
          timeline: createPlaceTimelinePayload({
            clock,
            place: options.built.data,
            placeRoot: options.placeRoot,
            seed: options.seed,
            events,
            resolvedArgs: options.args,
            mode: scenarioUseMode(options.twinfile),
          }),
        }
      : {}),
  };
}
