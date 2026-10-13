import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { twinHeadFileName, twinHeadPath } from '../load/twinfile-locator.js';

export function initUnitFromTemplate(targetDir: string, kind: string, templatesRoot: string): void {
  const templateDir = join(templatesRoot, kind);
  if (!statSync(templateDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Unknown kind ${kind}; no template at ${templateDir}`);
  }
  if (existsSync(targetDir)) {
    throw new Error(`Target already exists: ${targetDir}`);
  }
  mkdirSync(targetDir, { recursive: true });
  const templateHead = twinHeadFileName(templateDir);
  for (const name of readdirSync(templateDir)) {
    const dest = name === templateHead ? twinHeadPath(targetDir) : join(targetDir, name);
    cpSync(join(templateDir, name), dest, { recursive: true });
  }
}
