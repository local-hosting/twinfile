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
  /** Catalog root used by the Node loader. Defaults to `TF_EXAMPLES_ROOT`. */
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
  const [loaded, setLoaded] = useState(value ?? '');
  const [loadError, setLoadError] = useState<string>();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>(value === undefined ? 'loading' : 'ready');
  const text = value ?? loaded;

  useEffect(() => {
    if (value !== undefined) {
      setPhase('ready');
      setLoadError(undefined);
      return;
    }

    let cancelled = false;
    setPhase('loading');
    setLoadError(undefined);
    loadTwinfileText(uri, { load, examplesRoot })
      .then((next) => {
        if (cancelled) return;
        setLoaded(next);
        setPhase('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Could not load twinfile');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [uri, load, examplesRoot, value]);

  if (phase === 'loading') {
    return createElement('p', { className: 'twinfile-editor__status' }, `Loading ${uri}`);
  }
  if (loadError) {
    return createElement('p', { className: 'twinfile-editor__status', 'data-tone': 'error' }, loadError);
  }

  return createElement(TwinfileSourcePane, {
    unitKey: uri,
    text,
    onChange: (next) => {
      if (value === undefined) setLoaded(next);
      onChange?.(next);
    },
    readOnly,
    mapProvider,
    apiKey,
    mapboxToken,
    className,
  });
}
