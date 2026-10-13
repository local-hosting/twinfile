import { createHash } from 'node:crypto';

import { canonicalizeJson } from './merge.js';

export function sha256Digest(value: unknown): string {
  const body = canonicalizeJson(value);
  const hex = createHash('sha256').update(body, 'utf8').digest('hex');
  return `sha256:${hex}`;
}

export type LayerChainInput = {
  parent: string | null;
  content: string;
  kind: string;
  ref: string;
};

export function layerChainDigest(input: LayerChainInput): string {
  return sha256Digest({
    parent: input.parent,
    content: input.content,
    kind: input.kind,
    ref: input.ref,
  });
}

export type PlaceImageDigestInput = {
  meta: Record<string, unknown>;
  place: Record<string, unknown>;
  layers: string[];
};

export function placeImageDigest(input: PlaceImageDigestInput): string {
  return sha256Digest(input);
}

export type BundleDigestInput = PlaceImageDigestInput;
