import { readFileSync } from 'node:fs';
import { load as parseYaml } from 'js-yaml';
import type { z } from 'zod';

/** Read and validate a YAML catalog file against a Zod schema. */
export function loadYamlCatalog<T extends z.ZodTypeAny>(
  absolutePath: string,
  schema: T,
): z.output<T> {
  const raw = readFileSync(absolutePath, 'utf8');
  const data = parseYaml(raw);
  return schema.parse(data);
}