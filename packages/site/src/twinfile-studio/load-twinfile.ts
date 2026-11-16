export type LoadTwinfileOptions = {
  examplesRoot?: string;
  /** Host override. Use this in the browser for `twinfile/…` and `file://` URIs. */
  load?: (uri: string) => Promise<string>;
};

/**
 * Resolve a Twinfile URI to editable text.
 * `http(s)` is fetched. Other URIs use the Node loader, which is imported
 * only off the browser so client bundles do not pull in `node:fs`.
 */
export async function loadTwinfileText(uri: string, options: LoadTwinfileOptions = {}): Promise<string> {
  if (options.load) return options.load(uri);

  const trimmed = uri.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`loadTwinfileText: ${response.status} for ${trimmed}`);
    }
    return response.text();
  }

  if (typeof window !== 'undefined') {
    throw new Error(`loadTwinfileText: pass load() to read ${trimmed} in the browser`);
  }

  // webpackIgnore: the Node loader uses node:fs. Browser hosts pass `load` instead.
  const { loadTwinfileDocument } = await import(/* webpackIgnore: true */ './load-twinfile-node.js');
  return loadTwinfileDocument(trimmed, { examplesRoot: options.examplesRoot });
}
