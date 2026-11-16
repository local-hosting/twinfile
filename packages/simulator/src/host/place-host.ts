import {
  buildTwinfileSummary,
  summaryInputFromBuild,
  type BuildTwinfileResult,
  Twinfile,
} from '@doppler-group/twinfile-place';
import {
  formatTwinfileSummaryMarkdown,
  renderTwinfileSummaryAscii,
  type Result,
  type TwinfileSummaryV1,
} from '@doppler-group/twinfile-core';

import { describeTwinAt } from '../narrate/describe-twin.js';
import { openPlaceTimeline } from '../place/tf-place-timeline.js';
import { resolveScrubT } from '../timeline/scrub.js';
import { TFPlace, type TFPlaceLoadOptions } from '../types/tf-runtime.js';
import type { TimelineSample } from '../types/twinfile-time.js';
import type { TwinNarrative } from '../narrate/place-narrative.js';

export type PlaceHostOpenOptions = TFPlaceLoadOptions;

export type PlaceHostNarrativeOptions = {
  spaceId?: string;
  t?: number;
  seed?: number;
};

/** Summaries and narrative for a loaded {@link TFPlace} (authoring / MCP / CLI). */
export class PlaceHost {
  readonly #place: TFPlace;
  readonly #compose: BuildTwinfileResult;

  private constructor(place: TFPlace) {
    if (!place.compose) {
      throw new Error('PlaceHost requires TFPlace.compose (use TFPlace.load or TFPlace.compose)');
    }
    this.#place = place;
    this.#compose = place.compose;
  }

  static async load(unit: Twinfile | string, options: PlaceHostOpenOptions = {}): Promise<Result<PlaceHost>> {
    const loaded = await TFPlace.load(unit, options);
    if (!loaded.ok) return loaded;
    return { ok: true, value: new PlaceHost(loaded.value) };
  }

  static for(place: TFPlace): PlaceHost {
    return new PlaceHost(place);
  }

  get place(): TFPlace {
    return this.#place;
  }

  get compose(): BuildTwinfileResult {
    return this.#compose;
  }

  get digest(): string {
    return this.#compose.digest;
  }

  get root(): string {
    return this.#compose.loaded.root;
  }

  summary(): TwinfileSummaryV1 {
    return buildTwinfileSummary(summaryInputFromBuild(this.#compose));
  }

  summaryMarkdown(): string {
    return formatTwinfileSummaryMarkdown(this.summary());
  }

  summaryAscii(): string {
    return renderTwinfileSummaryAscii(this.summary());
  }

  narrative(options: PlaceHostNarrativeOptions = {}): TwinNarrative {
    const mergedPlace = this.#place.data;
    const clock = this.#place.clock;
    const resolvedArgs = this.#place.resolvedArgs ?? {};

    let sample: TimelineSample | undefined;
    if (clock) {
      const placeMeta = mergedPlace.place as { timezone?: string } | undefined;
      const timezone = placeMeta?.timezone;
      if (timezone) {
        const t = options.t !== undefined ? options.t : resolveScrubT(clock, {}, timezone);
        const seeded = TFPlace.compose(this.#compose, { seed: options.seed ?? this.#place.seed ?? 1 });
        sample = openPlaceTimeline(seeded).at(t);
      }
    }

    return describeTwinAt({
      place: mergedPlace,
      twinfile: this.#compose.loaded.twinfile,
      spaceId: options.spaceId,
      sample,
      events: this.#place.events,
      clock,
      resolvedArgs,
    });
  }
}

