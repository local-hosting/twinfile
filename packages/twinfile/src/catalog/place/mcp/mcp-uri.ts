import type { McpResourceTemplate } from './resources.js';

const REF_KEY = 'twinfile/[a-z0-9][a-z0-9-]*:[^/]+';
const COLLECTION = '[a-z][a-z0-9-]*';
const ROW_ID = '[a-z0-9][a-z0-9-]{0,62}';

export function mcpPlaceWireUri(refKey: string): string {
  return `twin://${refKey}/place`;
}

export function mcpLayersUri(refKey: string): string {
  return `twin://${refKey}/layers`;
}

export function mcpProcessorsUri(refKey: string): string {
  return `twin://${refKey}/processors`;
}

export function mcpResourceTemplates(refKey: string): McpResourceTemplate[] {
  return [
    {
      uriTemplate: `twin://${refKey}/place/{collection}/{id}`,
      name: 'place-row',
      mimeType: 'application/json',
      description: `One row in ${refKey}, with Place.digest.`,
    },
    {
      uriTemplate: 'twin://runs/{run}',
      name: 'run',
      mimeType: 'application/json',
      description: 'Records written by a named run, with Place.digest.',
    },
  ];
}

export type McpPlaceRowRef = {
  refKey?: string;
  collection: string;
  id: string;
};

export function parseMcpPlaceWireUri(uri: string): { refKey: string } | 'legacy' | undefined {
  if (uri === 'twin://place') return 'legacy';
  const match = new RegExp(`^twin://(${REF_KEY})/place$`).exec(uri);
  if (!match?.[1]) return undefined;
  return { refKey: match[1] };
}

export function parseMcpPlaceRowUri(uri: string): McpPlaceRowRef | undefined {
  const legacy = new RegExp(`^twin://place/(${COLLECTION})/(${ROW_ID})$`).exec(uri);
  if (legacy?.[1] && legacy[2]) {
    return { collection: legacy[1], id: legacy[2] };
  }
  const scoped = new RegExp(`^twin://(${REF_KEY})/place/(${COLLECTION})/(${ROW_ID})$`).exec(uri);
  if (scoped?.[1] && scoped[2] && scoped[3]) {
    return { refKey: scoped[1], collection: scoped[2], id: scoped[3] };
  }
  return undefined;
}

export function parseMcpLayersUri(uri: string): { refKey: string } | 'legacy' | undefined {
  if (uri === 'twin://layers') return 'legacy';
  const match = new RegExp(`^twin://(${REF_KEY})/layers$`).exec(uri);
  if (!match?.[1]) return undefined;
  return { refKey: match[1] };
}

export function parseMcpProcessorsUri(uri: string): { refKey: string } | 'legacy' | undefined {
  if (uri === 'twin://processors') return 'legacy';
  const match = new RegExp(`^twin://(${REF_KEY})/processors$`).exec(uri);
  if (!match?.[1]) return undefined;
  return { refKey: match[1] };
}

export function mcpRefKeyMismatch(requested: string | undefined, served: string): string | undefined {
  if (!requested || requested === served) return undefined;
  return `ref mismatch: uri is ${requested} but served unit is ${served}`;
}
