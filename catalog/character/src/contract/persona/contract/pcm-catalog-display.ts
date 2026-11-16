import type { PCM } from '../types/pcm.js';

/** Org catalog id for a mounted PCM (`persona.id` or document `id`). */
export function pcmCatalogId(pcm: PCM): string {
  return pcm.persona?.id?.trim() || pcm.id.trim();
}

/** Display label for org persona lists and MCP formatters. */
export function pcmCatalogLabel(pcm: PCM): string {
  const pcmId = pcmCatalogId(pcm);
  return (
    pcm.persona?.label?.trim() ||
    pcm.persona?.exemplar?.name?.trim() ||
    pcm.title?.trim() ||
    pcmId
  );
}

/** Persona segment token for catalog tables (may be empty). */
export function pcmCatalogSegment(pcm: PCM): string {
  return pcm.persona?.segment?.trim() ?? '';
}
