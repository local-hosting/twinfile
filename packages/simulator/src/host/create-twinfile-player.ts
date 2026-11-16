import type { WorldSession } from '../timeline/world-session.js';
import type { SessionClockBus } from '../types/session-clock-bus.js';
import type { TimelineSample } from '../types/twinfile-time.js';
import { createTFPlaceRuntime } from '../session/tf-place-runtime.js';

import type { PlayerPatchPublishResult } from './types/player-context.js';
import type { SessionClockEventHandlers } from './session-event-manager.js';
import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export type CreateTwinfilePlayerOptions = {
  seed?: number;
  playheadT?: number;
  /** Subscribe `advance` → patch module bus (default `true`). */
  publishOnAdvance?: boolean;
};

export type TwinfilePlayer = {
  readonly bus: SessionClockBus;
  readonly session: WorldSession;
  readonly timezone: string;
  /** Last patch publish from an advance (when `publishOnAdvance`). */
  readonly lastPatch: PlayerPatchPublishResult | undefined;
  seek(toT: number): TimelineSample;
  attachEvents(handlers: SessionClockEventHandlers): () => void;
  detach(): void;
};

export function createTwinfilePlayer(
  result: BuildTwinfileResult,
  options?: CreateTwinfilePlayerOptions,
): TwinfilePlayer | undefined {
  const runtime = createTFPlaceRuntime(result, options);
  if (!runtime) return undefined;
  const tf = runtime.session;

  const eventUnsubs: Array<() => void> = [];

  return {
    bus: tf.session,
    session: tf.world,
    timezone: tf.timezone,
    get lastPatch() {
      return runtime.lastPatch;
    },
    seek(toT: number) {
      runtime.seek(toT);
      return tf.world.sample();
    },
    attachEvents(handlers: SessionClockEventHandlers) {
      const off = tf.attachSessionHandlers(handlers);
      eventUnsubs.push(off);
      return off;
    },
    detach() {
      runtime.detach();
    },
  };
}

export { createTFPlaceRuntime, type TFPlaceRuntime, type CreateTFPlaceRuntimeOptions } from '../session/tf-place-runtime.js';
export {
  createTFPlaceSession,
  type TFPlaceSession,
  type CreateTFPlaceSessionOptions,
} from '../session/tf-place-session.js';
