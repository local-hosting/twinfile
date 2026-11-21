import {
  dtprElementIconUrl,
  flattenInlineElementIds,
  humanizeDtprElementId,
  resolveDtprSchemaVersion,
} from '@local-hosting/twinfile-core';

import { renderJsonViewerHtml } from '../lib/json-viewer-html.js';

export type RenderDtprHtmlOptions = {
  elementLabels?: ReadonlyMap<string, string>;
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type TwinfileInlineDtpr = {
  schema?: string;
  type?: 'device' | 'ai';
  elements?: Record<string, readonly string[]>;
  accountable?: string;
  sign?: { qr?: string };
};

export type TwinfileDatachainRef = {
  datachain: string;
};

function isDatachainRef(dtpr: unknown): dtpr is TwinfileDatachainRef {
  return (
    typeof dtpr === 'object' &&
    dtpr !== null &&
    typeof (dtpr as TwinfileDatachainRef).datachain === 'string' &&
    (dtpr as TwinfileDatachainRef).datachain.length > 0
  );
}

function isInlineDtpr(dtpr: unknown): dtpr is TwinfileInlineDtpr {
  if (typeof dtpr !== 'object' || dtpr === null) return false;
  const row = dtpr as TwinfileInlineDtpr;
  return typeof row.schema === 'string' || typeof row.type === 'string' || row.elements !== undefined;
}

function elementCaption(elementId: string, labels?: ReadonlyMap<string, string>): string {
  return labels?.get(elementId) ?? humanizeDtprElementId(elementId);
}

function renderElementBadge(
  schemaVersion: string,
  elementId: string,
  labels?: ReadonlyMap<string, string>,
): string {
  const caption = elementCaption(elementId, labels);
  const iconUrl = dtprElementIconUrl(schemaVersion, elementId);
  if (!iconUrl) {
    return `<span class="dtpr-badge dtpr-badge-fallback">${escapeHtml(caption)}</span>`;
  }
  const alt = escapeHtml(caption);
  const src = escapeHtml(iconUrl);
  return [
    '<figure class="dtpr-badge">',
    `<img src="${src}" width="36" height="36" alt="${alt}" loading="lazy" decoding="async" />`,
    `<figcaption>${alt}</figcaption>`,
    '</figure>',
  ].join('');
}

function renderInlineElementBadges(
  schemaVersion: string,
  elements: Record<string, readonly string[]>,
  labels?: ReadonlyMap<string, string>,
): string {
  const parts: string[] = ['<div class="dtpr-badge-sections">'];
  for (const [category, ids] of Object.entries(elements)) {
    if (!Array.isArray(ids) || ids.length === 0) continue;
    parts.push('<section class="dtpr-badge-section">');
    parts.push(`<h3 class="dtpr-cat">${escapeHtml(humanizeDtprElementId(category))}</h3>`);
    parts.push('<div class="dtpr-badge-grid">');
    for (const raw of ids) {
      parts.push(renderElementBadge(schemaVersion, String(raw), labels));
    }
    parts.push('</div></section>');
  }
  parts.push('</div>');
  return parts.join('');
}

/** HTML fragment for one Twinfile `dtpr` value (inline or datachain URI). */
export function renderDtprHtmlFragment(dtpr: unknown, options: RenderDtprHtmlOptions = {}): string {
  if (dtpr === undefined || dtpr === null) {
    return '<p class="dtpr-missing">No disclosure attached.</p>';
  }

  if (isDatachainRef(dtpr)) {
    const uri = escapeHtml(dtpr.datachain);
    return [
      '<section class="dtpr datachain-ref">',
      '<p class="dtpr-label">Datachain</p>',
      `<p><a class="dtpr-link" href="${uri}" rel="noopener noreferrer">${uri}</a></p>`,
      '<p class="dtpr-hint">Resolve this datachain in a DTPR viewer for full badge layout.</p>',
      '</section>',
    ].join('');
  }

  if (!isInlineDtpr(dtpr)) {
    return renderJsonViewerHtml(dtpr);
  }

  const schemaVersion = resolveDtprSchemaVersion(dtpr.schema);
  const parts: string[] = ['<section class="dtpr inline">'];
  if (dtpr.schema) {
    parts.push(`<p><span class="dtpr-k">Schema</span> ${escapeHtml(dtpr.schema)}</p>`);
  }
  if (dtpr.type) {
    parts.push(`<p><span class="dtpr-k">Type</span> ${escapeHtml(dtpr.type)}</p>`);
  }
  if (dtpr.accountable) {
    parts.push(`<p><span class="dtpr-k">Accountable</span> ${escapeHtml(dtpr.accountable)}</p>`);
  }
  if (dtpr.elements && typeof dtpr.elements === 'object') {
    const flat = flattenInlineElementIds(dtpr.elements);
    if (flat.length > 0) {
      parts.push(
        `<p class="dtpr-k">Elements</p>`,
        renderInlineElementBadges(schemaVersion, dtpr.elements, options.elementLabels),
      );
    }
  }
  if (dtpr.sign?.qr) {
    parts.push(`<p><span class="dtpr-k">Sign QR</span> ${escapeHtml(dtpr.sign.qr)}</p>`);
  }
  parts.push('</section>');
  return parts.join('');
}
