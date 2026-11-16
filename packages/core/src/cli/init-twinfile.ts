import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function initUnitFromTemplate(targetDir: string, kind: string, templatesRoot: string): void {
  const templateDir = join(templatesRoot, kind);
  if (!statSync(templateDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Unknown kind ${kind}; no template at ${templateDir}`);
  }
  if (existsSync(targetDir)) {
    throw new Error(`Target already exists: ${targetDir}`);
  }
  mkdirSync(targetDir, { recursive: true });
  for (const name of readdirSync(templateDir)) {
    cpSync(join(templateDir, name), join(targetDir, name), { recursive: true });
  }
}
