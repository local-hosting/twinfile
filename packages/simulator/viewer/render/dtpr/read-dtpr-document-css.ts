import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Portable DTPR disclosure CSS (`dist/style/dtpr-disclosure.css` after publish copy). */
export function readDtprDocumentCss(): string {
  const stylesPath = join(dirname(fileURLToPath(import.meta.url)), '../style/dtpr-disclosure.css');
  return readFileSync(stylesPath, 'utf8');
}
