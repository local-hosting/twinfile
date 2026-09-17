import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { resolveCharacterCatalogsRoot } from '../catalog/resolve-package-root.js';
import { MyersBriggsCatalogSchema, type MyersBriggsCatalog } from './myers-briggs.schema.js';

const CATALOG_PATH = 'psychology/myers-briggs.yaml';

let catalogCache: MyersBriggsCatalog | undefined;

export function loadMyersBriggsCatalog(): MyersBriggsCatalog {
  if (catalogCache) return catalogCache;

  const source = yaml.load(
    readFileSync(join(resolveCharacterCatalogsRoot(import.meta.url), CATALOG_PATH), 'utf8'),
  );
  catalogCache = MyersBriggsCatalogSchema.parse(source);
  return catalogCache;
}

export function clearMyersBriggsCatalogCache(): void {
  catalogCache = undefined;
}
