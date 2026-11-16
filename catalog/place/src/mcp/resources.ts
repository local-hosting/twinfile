import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  buildProcessorTypeCatalogResource,
  buildProcessorsResourceFromTwinfile,
  loadTwinfile,
  parseModuleGraphFromTwinfile,
} from '@doppler-group/twinfile-core';
import { explainField } from '../query/place-query.js';

import {
  mcpLayersUri,
  mcpPlaceWireUri,
  mcpProcessorsUri,
  mcpRefKeyMismatch,
  mcpResourceTemplates,
  parseMcpLayersUri,
  parseMcpPlaceRowUri,
  parseMcpPlaceWireUri,
  parseMcpProcessorsUri,
} from './mcp-uri.js';
import { openServedPlace, type McpServeOptions } from './open-served-place.js';

export { mcpResourceTemplates } from './mcp-uri.js';

export type McpResourceListing = {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
};

export type McpResourceTemplate = {
  uriTemplate: string;
  name: string;
  mimeType: string;
  description: string;
};

const JSON_MIME = 'application/json';

export async function listTwinResources(
  unitDir: string,
  options: McpServeOptions = {},
): Promise<{ ok: true; resources: McpResourceListing[] } | { ok: false; error: string }> {
  const opened = await openServedPlace(unitDir, options);
  if (!opened.ok) return opened;
  const refKey = opened.built.refKey;
  const resources: McpResourceListing[] = [
    {
      uri: mcpPlaceWireUri(refKey),
      name: refKey,
      mimeType: JSON_MIME,
      description: `Built Place ${refKey} — Place.toWire() (meta, merged place, digest).`,
    },
    {
      uri: mcpLayersUri(refKey),
      name: `${refKey} layers`,
      mimeType: JSON_MIME,
      description: `Layer chain for ${refKey}.`,
    },
    {
      uri: 'twin://processor-types',
      name: 'processor-types',
      mimeType: JSON_MIME,
      description: 'Patch module type catalog for canvas palettes (conf/patch-module-types.yaml).',
    },
  ];
  const loaded = loadTwinfile(opened.built.loaded.root);
  if (loaded.ok && parseModuleGraphFromTwinfile(loaded.value.twinfile)) {
    resources.push({
      uri: mcpProcessorsUri(refKey),
      name: `${refKey} processors`,
      mimeType: JSON_MIME,
      description:
        'Processor patch graph for canvas UIs: resolved graph plus twinfile.patch.ui.v1 (ports, cords, binds).',
    });
  }
  for (const run of runNames(opened.built.loaded.root)) {
    resources.push({
      uri: `twin://runs/${run}`,
      name: run,
      mimeType: JSON_MIME,
      description: `Run records for ${run}.`,
    });
  }
  return { ok: true, resources };
}

export async function readTwinResource(
  unitDir: string,
  uri: string,
  options: McpServeOptions = {},
): Promise<{ ok: true; uri: string; mimeType: string; text: string } | { ok: false; error: string }> {
  const opened = await openServedPlace(unitDir, options);
  if (!opened.ok) return opened;
  const { built } = opened;
  const digest = built.digest;
  const servedRef = built.refKey;
  if (uri === 'twin://processor-types') {
    return jsonBody(uri, buildProcessorTypeCatalogResource());
  }
  const wire = parseMcpPlaceWireUri(uri);
  if (wire) {
    if (wire !== 'legacy') {
      const drift = mcpRefKeyMismatch(wire.refKey, servedRef);
      if (drift) return { ok: false, error: drift };
    }
    return jsonBody(uri, { refKey: servedRef, ...built.toWire() });
  }
  const layers = parseMcpLayersUri(uri);
  if (layers) {
    if (layers !== 'legacy') {
      const drift = mcpRefKeyMismatch(layers.refKey, servedRef);
      if (drift) return { ok: false, error: drift };
    }
    return jsonBody(uri, {
      refKey: servedRef,
      digest,
      layers: built.layers.map((layer) => ({ ref: layer.ref, kind: layer.kind, chain: layer.chain })),
    });
  }
  const processors = parseMcpProcessorsUri(uri);
  if (processors) {
    if (processors !== 'legacy') {
      const drift = mcpRefKeyMismatch(processors.refKey, servedRef);
      if (drift) return { ok: false, error: drift };
    }
    const loaded = loadTwinfile(built.loaded.root);
    if (!loaded.ok) return { ok: false, error: 'load failed' };
    const resource = buildProcessorsResourceFromTwinfile(loaded.value.twinfile, { digest });
    if (!resource) return { ok: false, error: 'manifest has no processors:' };
    return jsonBody(uri, { refKey: servedRef, ...resource });
  }
  const place = parseMcpPlaceRowUri(uri);
  if (place) {
    const drift = mcpRefKeyMismatch(place.refKey, servedRef);
    if (drift) return { ok: false, error: drift };
    const row = explainField(built.data, place.collection, place.id);
    if (!row) return { ok: false, error: `no ${place.collection} row ${place.id}` };
    return jsonBody(uri, { refKey: servedRef, digest, ...row });
  }
  const run = matchRun(uri);
  if (run) {
    const path = join(built.loaded.root, 'runs', `${run}.jsonl`);
    if (!existsSync(path)) return { ok: false, error: `no run ${run}` };
    return jsonBody(uri, { digest, run, records: readFileSync(path, 'utf8') });
  }
  return { ok: false, error: `unsupported resource ${uri}` };
}

function jsonBody(uri: string, body: unknown): { ok: true; uri: string; mimeType: string; text: string } {
  return { ok: true, uri, mimeType: JSON_MIME, text: JSON.stringify(body) };
}

function runNames(root: string): string[] {
  const dir = join(resolve(root), 'runs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl') && !name.endsWith('.sent.jsonl'))
    .map((name) => name.slice(0, -'.jsonl'.length))
    .filter((name) => matchRun(`twin://runs/${name}`))
    .sort();
}

function matchRun(uri: string): string | undefined {
  const match = /^twin:\/\/runs\/([A-Za-z0-9][A-Za-z0-9._-]{0,80})$/.exec(uri);
  return match?.[1];
}
