
import type { PlayerPatchPublishResult } from '../host/types/player-context.js';
import { TFPlace } from '../types/tf-runtime.js';
import type { TFPlaceState } from '../types/tf-place-state.js';
import type { WorldSessionAdvance } from '../types/world-session.js';
import {
  applyAdvanceToPlaceState,
  tfPlaceStateFromSample,
} from './build-place-state.js';
import {
  createTFPlaceSession,
  type CreateTFPlaceSessionOptions,
  type TFPlaceSession,
} from './tf-place-session.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile-place';

export type CreateTFPlaceRuntimeOptions = CreateTFPlaceSessionOptions & {
  /** Publish session edges on the module bus when place state updates (default `true`). */
  publishOnAdvance?: boolean;
};

export type TFPlaceRuntime = {
  readonly place: TFPlace;
  readonly session: TFPlaceSession;
  readonly state: TFPlaceState;
  readonly lastPatch: PlayerPatchPublishResult | undefined;
  observe(handler: (state: TFPlaceState) => void): () => void;
  seek(toT: number): TFPlaceState;
  detach(): void;
};

function resolveInput(
  input: BuildTwinfileResult | TFPlace,
  seed: number,
): { place: TFPlace; result: BuildTwinfileResult } {
  if (input instanceof TFPlace) {
    const result = input.compose;
    if (!result) {
      throw new Error('TFPlaceRuntime requires TFPlace.compose (load or compose before session)');
    }
    return { place: input, result };
  }
  const place = TFPlace.compose(input, { seed });
  return { place, result: input };
}

/**
 * Each {@link TFPlace} observes clock, weather programmes, and module messages;
 * {@link TFPlaceState} updates on session advances (simulator world — not manifest `mode:`).
 */
export function createTFPlaceRuntime(
  input: BuildTwinfileResult | TFPlace,
  options: CreateTFPlaceRuntimeOptions = {},
): TFPlaceRuntime | undefined {
  const seed = options.seed ?? 1;
  const publishOnAdvance = options.publishOnAdvance !== false;
  const tfSession = createTFPlaceSession(input, {
    ...options,
    publishOnAdvance: false,
  });
  if (!tfSession) return undefined;

  const { result } = resolveInput(input, seed);
  let state = tfPlaceStateFromSample(
    tfSession.weathers,
    tfSession.world.playheadT,
    tfSession.world.sample(),
    [],
    result,
  );
  let lastPatch: PlayerPatchPublishResult | undefined;
  const observers = new Set<(state: TFPlaceState) => void>();

  const applyAdvance = (advance: WorldSessionAdvance) => {
    const applied = applyAdvanceToPlaceState(result, tfSession.weathers, advance, publishOnAdvance);
    state = applied.state;
    if (applied.patch) lastPatch = applied.patch;
    for (const handler of observers) handler(state);
  };

  const offAdvance = tfSession.session.on('advance', applyAdvance);

  return {
    place: tfSession.place,
    session: tfSession,
    get state() {
      return state;
    },
    get lastPatch() {
      return lastPatch;
    },
    observe(handler: (state: TFPlaceState) => void) {
      observers.add(handler);
      return () => observers.delete(handler);
    },
    seek(toT: number): TFPlaceState {
      const sample = tfSession.seek(toT);
      if (tfSession.world.playheadT === state.t && sample === state.sample) {
        return state;
      }
      return state;
    },
    detach() {
      offAdvance();
      observers.clear();
      tfSession.detach();
    },
  };
}
