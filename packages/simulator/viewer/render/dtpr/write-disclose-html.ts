import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { listDtprDisclosures } from '@local-hosting/twinfile-core';

import { readDtprDocumentCss } from './read-dtpr-document-css.js';
import { renderDisclosureArticles } from './render-disclosures.js';

const PAGE_SHELL = `
  body { font-family: system-ui, sans-serif; margin: 1.5rem; line-height: 1.45; max-width: 52rem; }
  h1 { font-size: 1.35rem; }
`.trim();

/**
 * Write a static disclosure page for merged place rows that carry `dtpr`.
 * Fetches element titles from the DTPR API when reachable.
 */
export async function writeDiscloseHtml(mergedPlace: Record<string, unknown>, outDir: string): Promise<number> {
  mkdirSync(outDir, { recursive: true });
  const rows = listDtprDisclosures(mergedPlace);
  const body =
    rows.length === 0
      ? '<p class="dtpr-missing">No sensors, AI, or assets with DTPR disclosures in this unit.</p>'
      : (await renderDisclosureArticles(rows)).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DTPR disclosures</title>
    <style>${PAGE_SHELL}\n${readDtprDocumentCss()}</style>
  </head>
  <body>
    <h1>DTPR disclosures</h1>
    ${body}
  </body>
</html>`;

  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  return rows.length;
}
