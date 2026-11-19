import type { PlaceWireJson, TwinHead, TwinTypeModule } from '@local-hosting/twinfile';
import { createHeadTwinTypeModule, err, isRecord, ok, TWIN_HEAD_SUFFIX } from '@local-hosting/twinfile';
import { buildTwinfile } from './build/build-twinfile.js';

export const kind = 'place' as const;

const head = createHeadTwinTypeModule({ kind, kinds: ['place'] });

export const module: TwinTypeModule<TwinHead, PlaceWireJson> = {
  kind,
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
      : err([{ code: 'E_SCHEMA', message: 'expected place wire (meta, place, digest)', file: TWIN_HEAD_SUFFIX }]),
};
