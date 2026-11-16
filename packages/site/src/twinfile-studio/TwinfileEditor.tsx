'use client';

import { createElement, useEffect, useState } from 'react';

import './editor.css';
import { loadTwinfileText, type LoadTwinfileOptions } from './load-twinfile.js';
import { TwinfileSourcePane } from './TwinfileSourcePane.js';

export type TwinfileEditorProps = {
  /** `twinfile/shop:0.2.0`, a unit directory, a source file, or an `http(s)` URL. */
  uri: string;
  /** Browser hosts pass this for `twinfile/` and `file://` URIs. */
  load?: LoadTwinfileOptions['load'];
  /** Catalog root used by the Node loader. Defaults to `TF_TWINFILE_ROOT`. */
  examplesRoot?: string;
  value?: string;
  onChange?: (text: string) => void;
  mapProvider?: string;
  /** MapTiler key. Geokit reads this from the `api-key` attribute. */
  apiKey?: string;
  /** Mapbox token for the live isochrone. */
  mapboxToken?: string;
  className?: string;
  readOnly?: boolean;
};

type LoadResult = { uri: string; text?: string; error?: string };

export function TwinfileEditor({
  uri,
  load,
  examplesRoot,
  value,
  onChange,
  mapProvider,
  apiKey,
  mapboxToken,
  className,
  readOnly,
}: TwinfileEditorProps) {
  const [loaded, setLoaded] = useState<LoadResult>();

  useEffect(() => {
    if (value !== undefined) return;

    let cancelled = false;
    loadTwinfileText(uri, { load, examplesRoot })
      .then((text) => {
        if (!cancelled) setLoaded({ uri, text });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoaded({ uri, error: error instanceof Error ? error.message : 'Could not load twinfile' });
      });
    return () => {
      cancelled = true;
    };
  }, [uri, load, examplesRoot, value]);

  const current = loaded?.uri === uri ? loaded : undefined;
  if (value === undefined && !current) {
    return createElement('p', { className: 'twinfile-editor__status' }, `Loading ${uri}`);
  }
  if (value === undefined && current?.error) {
    return createElement('p', { className: 'twinfile-editor__status', 'data-tone': 'error' }, current.error);
  }

  return createElement(TwinfileSourcePane, {
    unitKey: uri,
    text: value ?? current?.text ?? '',
    onChange: (next) => {
      if (value === undefined) setLoaded({ uri, text: next });
      onChange?.(next);
    },
    readOnly,
    mapProvider,
    apiKey,
    mapboxToken,
    className,
  });
}
