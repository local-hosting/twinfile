import {
  elementLabelsForInlineDtpr,
  fetchDtprLabelsForDisclosures,
  type DtprDisclosureRow,
} from '@local-hosting/twinfile';

import { escapeHtml, renderDtprHtmlFragment, type RenderDtprHtmlOptions } from './render-dtpr-html.js';

function rowTitle(row: DtprDisclosureRow): string {
  const suffix = row.name ? ` — ${row.name}` : '';
  return `${row.collection}/${row.id}${suffix}`;
}

/** Optional host HTML from structured {@link DtprDisclosureRow} — not part of API payloads. */
export function renderDisclosureArticle(row: DtprDisclosureRow, options: RenderDtprHtmlOptions = {}): string {
  return [
    '<article class="disclosure">',
    `<h2>${escapeHtml(rowTitle(row))}</h2>`,
    renderDtprHtmlFragment(row.dtpr, options),
    '</article>',
  ].join('');
}

/** Disclosure articles with DTPR element titles fetched once for all rows. */
export async function renderDisclosureArticles(rows: readonly DtprDisclosureRow[]): Promise<string[]> {
  const labelCache = await fetchDtprLabelsForDisclosures(rows);
  return rows.map((row) =>
    renderDisclosureArticle(row, { elementLabels: elementLabelsForInlineDtpr(row.dtpr, labelCache) }),
  );
}
