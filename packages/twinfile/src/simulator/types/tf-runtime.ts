import {
  Twinfile,
  PlaceType,
  type BuildTwinfileOptions,
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';
import {
  err,
  ok,
  resolveExamplesRoot,
  resolveTwinfileAnchor,
  type Result,
  type TwinfileUseMode,
} from '@local-hosting/twinfile';

import type { ClockSpec } from './twinfile-time.js';

/** Scenario session grid (`clock:` on a run, or host-supplied). */
export type TFClock = ClockSpec;

export type TFPlaceOptions = {
  seed?: number;
};

export type TFPlaceLoadOptions = BuildTwinfileOptions & {
  examplesRoot?: string;
  seed?: number;
};

type TFPlaceFields = {
  data: Record<string, unknown>;
  unitRoot: string;
  digest?: string;
  clock?: TFClock;
  seed: number;
  events?: Record<string, unknown>[];
  resolvedArgs?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  mode?: TwinfileUseMode;
  compose?: BuildTwinfileResult;
};

/**
 * Built spatial twin — {@link TFPlace.load} from {@link Twinfile} (`<unit>.twin.yaml`).
 * `TF*` is the formal type prefix (distinct from operational `TF_` env vars).
 */
export class TFPlace {
  /** Merged place graph. */
  readonly data: Record<string, unknown>;
  /** Directory root for feed / replay path resolution. */
  readonly unitRoot: string;
  readonly digest?: string;
  readonly clock?: TFClock;
  readonly seed: number;
  readonly events?: Record<string, unknown>[];
  readonly resolvedArgs?: Record<string, unknown>;
  readonly meta?: Record<string, unknown>;
  readonly mode?: TwinfileUseMode;
  /** Present when produced via {@link TFPlace.load} or {@link TFPlace.compose}. */
  readonly compose?: BuildTwinfileResult;

  private constructor(fields: TFPlaceFields) {
    this.data = fields.data;
    this.unitRoot = fields.unitRoot;
    this.digest = fields.digest;
    this.clock = fields.clock;
    this.seed = fields.seed;
    this.events = fields.events;
    this.resolvedArgs = fields.resolvedArgs;
    this.meta = fields.meta;
    this.mode = fields.mode;
    this.compose = fields.compose;
  }

  /** Build from an on-disk Twinfile unit. */
  static async load(unit: Twinfile | string, options: TFPlaceLoadOptions = {}): Promise<Result<TFPlace>> {
    const twinfile = typeof unit === 'string' ? Twinfile.at(unit) : unit;
    const dir = twinfile.root;
    const examplesRoot =
      options.examplesRoot ?? resolveExamplesRoot(dir);
    if (!examplesRoot) {
      return err([{ code: 'E_CATALOG', message: 'TF_TWINFILE_ROOT or examplesRoot required', file: dir }]);
    }
    const built = await twinfile.build({
      ...options,
      examplesRoot,
      writeLock: options.writeLock ?? false,
    });
    if (!built.ok) return built;
    return ok(TFPlace.compose(built.value, { seed: options.seed ?? 1 }));
  }

  /**
   * Host wiring snapshot from `twin build` (`Place.meta.placeType`) — in/out wires, not live values.
   * Use {@link TFPlaceState} on {@link TFPlaceRuntime} for occupancy and signal values at `t`.
   */
  hostSurface(): PlaceType | undefined {
    const raw = this.compose?.meta?.placeType;
    return raw ? PlaceType.fromJSON(raw) : undefined;
  }

  /** Wrap an existing compose result (workbench / MCP serve cache). */
  static compose(result: BuildTwinfileResult, options: TFPlaceOptions = {}): TFPlace {
    const { loaded } = result;
    const meta = result.meta ?? {};
    const clock =
      typeof meta.clock === 'object' && meta.clock !== null
        ? (meta.clock as TFClock)
        : (loaded.twinfile.clock as TFClock | undefined);
    const resolvedArgs =
      typeof meta.resolvedArgs === 'object' && meta.resolvedArgs !== null
        ? (meta.resolvedArgs as Record<string, unknown>)
        : {};
    const unitRoot = resolveTwinfileAnchor(loaded.root, {
      ...loaded.twinfile,
      twinfilePath: loaded.twinfilePath,
    });
    return new TFPlace({
      data: result.data,
      unitRoot,
      digest: result.digest,
      clock,
      seed: options.seed ?? 1,
      events: (result.events ?? []) as Record<string, unknown>[],
      resolvedArgs,
      meta,
      compose: result,
    });
  }

}

/** Host world: one or more built places. */
export type TFWorld = {
  places: readonly TFPlace[];
  activePlaceIndex?: number;
};

export function activeTFPlace(world: TFWorld): TFPlace {
  const index = world.activePlaceIndex ?? 0;
  const place = world.places[index];
  if (!place) {
    throw new Error(`TFWorld has no place at index ${index}`);
  }
  return place;
}
