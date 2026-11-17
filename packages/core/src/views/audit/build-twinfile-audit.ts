import { composeHeadUnitDocument } from '../../compose/compose-head-unit.js';
import type { CatalogUnitResolveOptions, LoadedTwinHeadUnit } from '../../load/load-twin-head-unit.js';
import { resolveCatalogUnitRef } from '../../load/load-twin-head-unit.js';
import { twinfileDisplayName } from '../../twinfile/display-name.js';
import type { Result } from '../../types/twin-error.js';
import { ok } from '../../types/twin-error.js';
import {
  collectPlaceAnchorIds,
  extractCharacterFields,
  extractContextFields,
  extractEventPitch,
  extractResourceKind,
  extractStoryBless,
  extractStoryFields,
  listPlaceStageRows,
  parseTwinfileLinks,
} from './extract-head-fields.js';
import {
  collectStoryAuditLinks,
  hrefInInvolvesLinks,
  incompleteLinkRows,
  storyAuditLinksIncludePlace,
} from './collect-story-audit-links.js';
import { storySceneResourceHintFindings } from './story-scene-resource-hints.js';
import type {
  TwinfileAuditCardV1,
  TwinfileAuditFindingV1,
  TwinfileAuditLensRowV1,
  TwinfileAuditLinkedUnitV1,
} from './types.js';

function headString(doc: Record<string, unknown>, key: string): string {
  const value = doc[key];
  return typeof value === 'string' ? value.trim() : '';
}

function pushLens(rows: TwinfileAuditLensRowV1[], id: string, label: string, detail?: string): void {
  if (rows.some((row) => row.id === id)) return;
  rows.push({ id, label, detail });
}

function resolveComposedDoc(
  unit: LoadedTwinHeadUnit,
  options: CatalogUnitResolveOptions,
): Record<string, unknown> {
  if (!options.examplesRoot) return unit.doc;
  const composed = composeHeadUnitDocument(unit.doc, unit.twinfilePath, options);
  return composed.ok ? composed.value : unit.doc;
}

export function buildTwinfileAudit(
  unit: LoadedTwinHeadUnit,
  options: CatalogUnitResolveOptions = {},
): Result<TwinfileAuditCardV1> {
  const doc = resolveComposedDoc(unit, options);
  const kind = headString(doc, 'kind') || unit.kind;
  const findings: TwinfileAuditFindingV1[] = [];
  const linked: TwinfileAuditLinkedUnitV1[] = [];

  const lenses: TwinfileAuditCardV1['lenses'] = {
    cast: [],
    stage: [],
    motive: [],
    path: [],
    props: [],
    bless: [],
  };

  const incomplete = incompleteLinkRows(unit.doc);
  if (incomplete > 0) {
    findings.push({
      level: 'gap',
      code: 'LINK_INCOMPLETE',
      message: `links has ${incomplete} row(s) missing href`,
    });
  }

  const links =
    kind === 'story'
      ? collectStoryAuditLinks(unit.doc, unit, options)
      : parseTwinfileLinks(doc);

  let involvesPlace = false;
  let involvesCharacter = false;
  const involvedResourceIds = new Set<string>();

  for (const link of links) {
    const resolved = resolveCatalogUnitRef(link.href, options);
    const entry: TwinfileAuditLinkedUnitV1 = {
      rel: link.rel,
      href: link.href,
      resolved: resolved.ok,
      anchor: link.anchor,
    };
    if (resolved.ok) {
      const peer = resolveComposedDoc(resolved.value, options);
      entry.kind = headString(peer, 'kind') || resolved.value.kind;
      entry.id = headString(peer, 'id');
      entry.name = twinfileDisplayName(peer);

      const rel = link.rel.toLowerCase();
      if (rel === 'involves' || rel === 'operates') {
        if (entry.kind === 'character') {
          involvesCharacter = true;
          const fields = extractCharacterFields(peer);
          const detail = [fields.role, fields.title].filter(Boolean).join(' · ');
          pushLens(lenses.cast, entry.id || link.href, entry.name || entry.id || link.href, detail);
          for (const goal of fields.goals.slice(0, 3)) {
            pushLens(lenses.motive, `${entry.id}:goal`, goal);
          }
        } else if (entry.kind === 'place') {
          involvesPlace = true;
          pushLens(lenses.stage, entry.id || link.href, entry.name || entry.id || link.href);
          for (const row of listPlaceStageRows(peer)) {
            pushLens(lenses.stage, row.id, row.label);
          }
        } else if (entry.kind === 'resource') {
          if (entry.id) involvedResourceIds.add(entry.id);
          const kindLabel = extractResourceKind(peer);
          const anchorNote = link.anchor ? `anchor ${link.anchor}` : undefined;
          pushLens(
            lenses.props,
            entry.id || link.href,
            entry.name || entry.id || link.href,
            [kindLabel, anchorNote].filter(Boolean).join(' · '),
          );
        } else if (entry.kind === 'event') {
          const pitch = extractEventPitch(peer);
          pushLens(lenses.motive, entry.id || link.href, entry.name || entry.id || link.href, pitch);
        } else if (entry.kind === 'context') {
          const fields = extractContextFields(peer);
          pushLens(
            lenses.motive,
            entry.id || link.href,
            fields.label ?? entry.name ?? entry.id ?? link.href,
            fields.context,
          );
        }
      }

      if (rel === 'locatedin' && entry.kind === 'place' && link.anchor) {
        const anchors = collectPlaceAnchorIds(peer);
        if (!anchors.has(link.anchor)) {
          findings.push({
            level: 'gap',
            code: 'ANCHOR_MISSING',
            message: `Resource anchor "${link.anchor}" is not in place ${entry.id ?? link.href} assets, stations, spaces, sensors, or visits`,
          });
        }
      }

      if (rel === 'operates' && entry.kind === 'resource') {
        const kindLabel = extractResourceKind(peer);
        pushLens(
          lenses.props,
          entry.id || link.href,
          entry.name || entry.id || link.href,
          kindLabel,
        );
      }
    } else {
      findings.push({
        level: 'gap',
        code: 'LINK_UNRESOLVED',
        message: `Could not resolve link ${link.rel} → ${link.href}`,
      });
    }
    linked.push(entry);
  }

  if (kind === 'story') {
    const story = extractStoryFields(doc);
    if (story.pitch) pushLens(lenses.motive, 'pitch', story.pitch);
    for (const scene of story.scenes) {
      const label = scene.label ?? scene.id;
      pushLens(lenses.path, scene.id, label);
    }
    if (story.scenes.length > 0 && !story.pitch) {
      findings.push({
        level: 'warn',
        code: 'STORY_NO_PITCH',
        message: 'Story has scenes but no pitch',
      });
    }
    const hasPlace =
      involvesPlace ||
      storyAuditLinksIncludePlace(links, options, (peer) => resolveComposedDoc(peer, options));
    if (!hasPlace) {
      findings.push({
        level: 'gap',
        code: 'STORY_NO_PLACE',
        message:
          'Story has no resolved place (direct involves, inherited from:, or via involves context)',
      });
    }
    if (!involvesCharacter) {
      findings.push({
        level: 'gap',
        code: 'STORY_NO_CHARACTER',
        message: 'Story has no resolved involves character link',
      });
    }

    const involvesLinks = links.filter((link) => link.rel.toLowerCase() === 'involves');
    findings.push(...storySceneResourceHintFindings(story.scenes, involvedResourceIds));

    for (const bless of extractStoryBless(doc)) {
      const blessId = `${bless.character}×${bless.context ?? '—'}`;
      pushLens(lenses.bless, blessId, blessId, bless.context);
      const character = resolveCatalogUnitRef(bless.character, options);
      if (!character.ok) {
        findings.push({
          level: 'gap',
          code: 'BLESS_UNRESOLVED',
          message: `bless character could not resolve: ${bless.character}`,
        });
      } else if (!hrefInInvolvesLinks(bless.character, involvesLinks)) {
        findings.push({
          level: 'warn',
          code: 'BLESS_NOT_INVOLVED',
          message: `bless character not in story involves links: ${bless.character}`,
        });
      }
      if (bless.context) {
        const context = resolveCatalogUnitRef(bless.context, options);
        if (!context.ok) {
          findings.push({
            level: 'gap',
            code: 'BLESS_UNRESOLVED',
            message: `bless context could not resolve: ${bless.context}`,
          });
        } else if (!hrefInInvolvesLinks(bless.context, involvesLinks)) {
          findings.push({
            level: 'warn',
            code: 'BLESS_NOT_INVOLVED',
            message: `bless context not in story involves links: ${bless.context}`,
          });
        }
      }
    }
  }

  if (kind === 'character') {
    const fields = extractCharacterFields(doc);
    const detail = [fields.role, fields.title].filter(Boolean).join(' · ');
    pushLens(lenses.cast, headString(doc, 'id'), twinfileDisplayName(doc), detail);
    for (const goal of fields.goals) pushLens(lenses.motive, `goal:${goal}`, goal);
    for (const frustration of fields.frustrations) {
      pushLens(lenses.motive, `frustration:${frustration}`, frustration);
    }
  }

  if (kind === 'resource') {
    const located = links.find((row) => row.rel.toLowerCase() === 'locatedin');
    const kindLabel = extractResourceKind(doc);
    pushLens(lenses.props, headString(doc, 'id'), twinfileDisplayName(doc), kindLabel);
    if (located?.anchor) {
      pushLens(lenses.stage, located.anchor, `Anchor at ${located.href}`, located.anchor);
    }
    const selfLink = links.find((row) => row.rel.toLowerCase() === 'locatedin');
    if (selfLink) {
      const place = resolveCatalogUnitRef(selfLink.href, options);
      if (place.ok && selfLink.anchor) {
        const anchors = collectPlaceAnchorIds(resolveComposedDoc(place.value, options));
        if (anchors.has(selfLink.anchor)) {
          findings.push({
            level: 'info',
            code: 'ANCHOR_OK',
            message: `locatedIn anchor "${selfLink.anchor}" exists on place`,
          });
        }
      }
    }
  }

  if (kind === 'place') {
    pushLens(lenses.stage, headString(doc, 'id'), twinfileDisplayName(doc));
    for (const row of listPlaceStageRows(doc)) {
      pushLens(lenses.stage, row.id, row.label);
    }
    const anchors = collectPlaceAnchorIds(doc);
    for (const assetId of [...anchors].sort()) {
      pushLens(lenses.props, assetId, assetId, 'place asset');
    }
  }

  if (kind === 'event') {
    const pitch = extractEventPitch(doc);
    if (pitch) pushLens(lenses.motive, 'pitch', pitch);
  }

  if (kind === 'context') {
    const fields = extractContextFields(doc);
    pushLens(lenses.motive, headString(doc, 'id'), fields.label ?? twinfileDisplayName(doc), fields.context);
  }

  const card: TwinfileAuditCardV1 = {
    schema: 'twinfile.audit.v1',
    header: {
      id: headString(doc, 'id'),
      name: twinfileDisplayName(doc),
      kind,
      version: headString(doc, 'version'),
      stability: headString(doc, 'stability') || undefined,
    },
    lenses,
    findings,
    linked,
  };

  return ok(card);
}