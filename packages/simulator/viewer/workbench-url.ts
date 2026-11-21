import {
  WORKBENCH_DEFAULT_VARIATION,
  WORKBENCH_TWINFILE_VARIATION,
  normalizeWorkbenchVariation,
} from './workbench-variation.js';

export type WorkbenchUrlState = {
  entry: string | undefined;
  /** Programme lens catalog id (`scenarios/...`) when browsing a host site. */
  lens: string | undefined;
  variation: string;
  studio: boolean;
};

export function readWorkbenchUrl(locationLike: Pick<Location, 'href' | 'search' | 'hash' | 'pathname'>): WorkbenchUrlState {
  const params = new URLSearchParams(locationLike.search);
  const entry = params.get('entry')?.trim() || undefined;
  const lens = params.get('lens')?.trim() || undefined;
  const rawHash = locationLike.hash.replace(/^#/, '');
  const studio =
    params.get('studio') === '1' || params.get('studio') === 'true' || params.get('studio') === '';
  let variation = rawHash
    ? normalizeWorkbenchVariation(decodeURIComponent(rawHash))
    : WORKBENCH_DEFAULT_VARIATION;
  if (!studio && variation === WORKBENCH_TWINFILE_VARIATION) {
    variation = WORKBENCH_DEFAULT_VARIATION;
  }
  return { entry, lens, variation, studio };
}

export function writeWorkbenchSelection(entryId: string, lensId?: string | null): void {
  const url = new URL(location.href);
  url.searchParams.set('entry', entryId);
  if (lensId) url.searchParams.set('lens', lensId);
  else url.searchParams.delete('lens');
  url.hash = WORKBENCH_DEFAULT_VARIATION;
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}

export function writeWorkbenchLens(lensId: string | null): void {
  const url = new URL(location.href);
  if (lensId) url.searchParams.set('lens', lensId);
  else url.searchParams.delete('lens');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}

export function writeWorkbenchVariation(variationId: string): void {
  const url = new URL(location.href);
  const id =
    variationId === WORKBENCH_TWINFILE_VARIATION ||
      variationId === 'source' ||
      variationId === 'recipe'
      ? WORKBENCH_TWINFILE_VARIATION
      : variationId;
  if (id) {
    url.hash = encodeURIComponent(id);
  } else {
    url.hash = '';
  }
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}
