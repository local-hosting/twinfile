import type { CatalogUnitResolveOptions, LoadedTwinHeadUnit } from '../../load/load-twin-head-unit.js';
import { resolveCatalogUnitRef } from '../../load/load-twin-head-unit.js';
import { composeHeadUnitDocument } from '../../compose/compose-head-unit.js';
import { isRecord } from '../../doc/is-record.js';
import { parseTwinfileLinks, type TwinfileAuditLink } from './extract-head-fields.js';

function resolveComposedDoc(
  unit: LoadedTwinHeadUnit,
  options: CatalogUnitResolveOptions,
): Record<string, unknown> {
  if (!options.examplesRoot) return unit.doc;
  const composed = composeHeadUnitDocument(unit.doc, unit.twinfilePath, options);
  return composed.ok ? composed.value : unit.doc;
}

function linkKey(link: TwinfileAuditLink): string {
  return `${link.rel}\0${link.href}\0${link.anchor ?? ''}`;
}

function mergeLinks(base: TwinfileAuditLink[], extra: TwinfileAuditLink[]): TwinfileAuditLink[] {
  const seen = new Set(base.map(linkKey));
  const out = [...base];
  for (const link of extra) {
    const key = linkKey(link);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

/** Story overlays often omit place; inherit `links` from the `from:` chain. */
export function collectStoryAuditLinks(
  doc: Record<string, unknown>,
  _unit: LoadedTwinHeadUnit,
  options: CatalogUnitResolveOptions,
): TwinfileAuditLink[] {
  let links = parseTwinfileLinks(doc);
  let from = typeof doc.from === 'string' ? doc.from.trim() : '';
  const visited = new Set<string>();

  while (from && !visited.has(from)) {
    visited.add(from);
    const parent = resolveCatalogUnitRef(from, options);
    if (!parent.ok) break;
    const parentDoc = resolveComposedDoc(parent.value, options);
    links = mergeLinks(links, parseTwinfileLinks(parentDoc));
    from = typeof parentDoc.from === 'string' ? parentDoc.from.trim() : '';
  }

  return links;
}

export function storyAuditLinksIncludePlace(
  links: readonly TwinfileAuditLink[],
  options: CatalogUnitResolveOptions,
  resolveComposed: (unit: LoadedTwinHeadUnit) => Record<string, unknown>,
): boolean {
  for (const link of links) {
    const resolved = resolveCatalogUnitRef(link.href, options);
    if (!resolved.ok) continue;
    const peer = resolveComposed(resolved.value);
    const kind = String(peer.kind ?? resolved.value.kind);
    if (kind === 'place') return true;
    if (kind !== 'context') continue;
    for (const ctxLink of parseTwinfileLinks(peer)) {
      const nested = resolveCatalogUnitRef(ctxLink.href, options);
      if (!nested.ok) continue;
      const nestedDoc = resolveComposed(nested.value);
      if (String(nestedDoc.kind ?? nested.value.kind) === 'place') return true;
    }
  }
  return false;
}

export function hrefInInvolvesLinks(href: string, links: readonly TwinfileAuditLink[]): boolean {
  const target = href.trim();
  return links.some((link) => link.rel.toLowerCase() === 'involves' && link.href === target);
}

export function incompleteLinkRows(doc: Record<string, unknown>): number {
  if (!Array.isArray(doc.links)) return 0;
  return doc.links.filter((raw) => isRecord(raw) && (typeof raw.href !== 'string' || !raw.href.trim()))
    .length;
}