import { omitNullishDeep } from './omit-nullish-deep.js';
import { parseSAM } from '../schemas/sam.schema.js';
import type { SAM } from '../types/sam.js';

export type SamJson = {
  document: Record<string, unknown>;
  characters: unknown[];
  venues?: unknown[];
  arcTemplate?: Record<string, unknown>;
  scenes?: unknown[];
  binding: Record<string, unknown>;
  episodeArc?: Record<string, unknown>;
};

/** JSON export of a SAM document. */
export function samToJSON(sam: SAM): Record<string, unknown> {
  const {
    id,
    title,
    revision,
    version,
    summary,
    characters,
    venues,
    arcTemplate,
    scenes,
    binding,
    episodeArc,
  } = sam;

  const document: Record<string, unknown> = { version, id, title, revision };
  if (summary !== undefined) document.summary = summary;

  return omitNullishDeep({
    document,
    characters,
    ...(venues?.length ? { venues } : {}),
    ...(arcTemplate ? { arcTemplate } : {}),
    ...(scenes?.length ? { scenes } : {}),
    binding,
    ...(episodeArc ? { episodeArc } : {}),
  });
}

export function samFromJSON(json: unknown): SAM {
  const raw = json as SamJson & Record<string, unknown>;
  const doc = raw.document ?? {};

  return parseSAM({
    ...doc,
    characters: raw.characters,
    venues: raw.venues,
    arcTemplate: (raw as SamJson).arcTemplate,
    scenes: raw.scenes,
    binding: raw.binding,
    episodeArc: raw.episodeArc,
  });
}
