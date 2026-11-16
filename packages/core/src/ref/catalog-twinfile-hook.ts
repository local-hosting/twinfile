import type { LoadedTwinfile } from '../load/load-twinfile.js';
import type { Result } from '../types/twin-error.js';

export type CatalogTwinfileResolveInput = {
  ref: string;
  name: string;
  tag?: string;
  options: {
    examplesRoot: string;
    simulatorRoot?: string;
    placeRoot?: string;
  };
};

export type CatalogTwinfileResolveResult = Result<{
  ref: string;
  loaded: LoadedTwinfile;
}>;

export type CatalogTwinfileResolver = (
  input: CatalogTwinfileResolveInput,
) => CatalogTwinfileResolveResult | undefined;

let defaultCatalogResolver: CatalogTwinfileResolver | undefined;

/** Register place-event catalog resolution (`@doppler-group/twinfile-simulator` calls this on import). */
export function registerCatalogTwinfileResolver(resolver: CatalogTwinfileResolver | undefined): void {
  defaultCatalogResolver = resolver;
}

export function resolveViaCatalogHook(
  input: CatalogTwinfileResolveInput & { resolveCatalogTwinfile?: CatalogTwinfileResolver },
): CatalogTwinfileResolveResult | undefined {
  const fn = input.resolveCatalogTwinfile ?? defaultCatalogResolver;
  if (!fn) return undefined;
  return fn(input);
}
