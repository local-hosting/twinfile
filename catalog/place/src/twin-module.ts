import type { PlaceWireJson, TwinHead, TwinTypeModule } from '@doppler-group/twinfile-core';
import { createHeadTwinTypeModule, err, isRecord, ok } from '@doppler-group/twinfile-core';
import { buildTwinfile } from './build/build-twinfile.js';

export const headFile = 'Place.yaml';
export const kind = 'place' as const;

const head = createHeadTwinTypeModule({ kind, headFile, kinds: ['place', 'mixin'] });

export const module: TwinTypeModule<TwinHead, PlaceWireJson> = {
  kind,
  headFile,
  parse: head.parse,
  validate: head.validate,
  build: async (dir, opts) => {
    const built = await buildTwinfile(dir, opts);
    return built.ok ? ok(built.value.toWire()) : built;
  },
  toJSON: (built) => ({ ...built }),
  fromJSON: (json) =>
    isRecord(json) && isRecord(json.meta) && isRecord(json.place) && typeof json.digest === 'string'
      ? ok({ meta: json.meta, place: json.place, digest: json.digest })
      : err([{ code: 'E_SCHEMA', message: 'expected place wire (meta, place, digest)', file: headFile }]),
};
