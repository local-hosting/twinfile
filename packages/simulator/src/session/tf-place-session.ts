
import { placeTimezoneFromBuild } from '../host/tf-place.js';
import { publishSessionEdgesToPatch } from '../host/publish-edges.js';
import {
  attachSessionClockEventManager,
  type SessionClockEventHandlers,
} from '../host/session-event-manager.js';
import type { PlayerPatchPublishResult } from '../host/types/player-context.js';
import { timelineOptionsFromTFPlace } from '../place/tf-place-timeline.js';
import { createWorldSession, type WorldSession } from '../timeline/world-session.js';
import { createTFWeathersFromPlace } from '../weather/tf-weather.js';
import type { Weather as TFWeather } from '../weather/weather.js';
import { createTFSessionBus, type TFSessionBus } from '../types/tf-session-bus.js';
import { createTFMessageBus, type TFMessageBus } from '../types/tf-message-bus.js';
import { TFPlace, type TFClock } from '../types/tf-runtime.js';
import type { TimelineSample } from '../types/twinfile-time.js';
import type { WorldSessionAdvance } from '../types/world-session.js';
import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export type CreateTFPlaceSessionOptions = {
  seed?: number;
  playheadT?: number;
  /** Bridge session `advance` edges → patch publish (default `true`). */
  publishOnAdvance?: boolean;
  recordSession?: boolean;
};

export type TFPlaceSession = {
  readonly place: TFPlace;
  readonly clock: TFClock | undefined;
  readonly weathers: readonly TFWeather[];
  readonly session: TFSessionBus;
  readonly messages: TFMessageBus;
  readonly world: WorldSession;
  readonly timezone: string;
  readonly lastPatch: PlayerPatchPublishResult | undefined;
  seek(toT: number): TimelineSample;
  attachSessionHandlers(handlers: SessionClockEventHandlers): () => void;
  detach(): void;
};

function resolvePlaceInput(
  input: BuildTwinfileResult | TFPlace,
  seed: number,
): { place: TFPlace; result: BuildTwinfileResult } {
  if (input instanceof TFPlace) {
    const result = input.compose;
    if (!result) {
      throw new Error('TFPlaceSession requires TFPlace.compose (load or compose before session)');
    }
    return { place: input, result };
  }
  const place = TFPlace.compose(input, { seed });
  return { place, result: input };
}

/** Playback façade: place observes clock, weather programmes, session + module buses. */
export function createTFPlaceSession(
  input: BuildTwinfileResult | TFPlace,
  options: CreateTFPlaceSessionOptions = {},
): TFPlaceSession | undefined {
  const seed = options.seed ?? 1;
  const { place, result } = resolvePlaceInput(input, seed);
  const timeline = timelineOptionsFromTFPlace(place);
  if (!timeline) return undefined;

  const timezone = placeTimezoneFromBuild(result);
  const clock = place.clock;
  const weathers = createTFWeathersFromPlace(
    timeline.clock,
    timeline.situations,
    timeline.resolvedArgs ?? {},
  );
  const session = createTFSessionBus(options.recordSession ? { record: true } : undefined);
  const messages = createTFMessageBus();
  const world = createWorldSession({
    ...timeline,
    playheadT: options.playheadT ?? 0,
    bus: session,
  });

  let lastPatch: PlayerPatchPublishResult | undefined;
  const publishOnAdvance = options.publishOnAdvance !== false;
  const offAdvance = publishOnAdvance
    ? session.on('advance', (advance: WorldSessionAdvance) => {
        lastPatch = publishSessionEdgesToPatch(result, advance.edges);
      })
    : () => undefined;

  const handlerUnsubs: Array<() => void> = [];

  return {
    place,
    clock,
    weathers,
    session,
    messages,
    world,
    timezone,
    get lastPatch() {
      return lastPatch;
    },
    seek(toT: number) {
      return world.seek(toT);
    },
    attachSessionHandlers(handlers: SessionClockEventHandlers) {
      const off = attachSessionClockEventManager(session, handlers);
      handlerUnsubs.push(off);
      return off;
    },
    detach() {
      offAdvance();
      for (const off of handlerUnsubs) off();
      session.clear();
    },
  };
}
