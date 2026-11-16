'use client';

import { createElement, useMemo, useRef, type ChangeEvent, type UIEvent } from 'react';

import { draftMapFromText } from './draft-map.js';
import { highlightYaml } from './highlight-yaml.js';
import { TwinfileMap } from './TwinfileMap.js';
import type { MapDraft } from './types/map-draft.js';

export type TwinfileSourcePaneProps = {
  unitKey: string;
  text: string;
  onChange?: (text: string) => void;
  readOnly?: boolean;
  statusPrefix?: string;
  mapProvider?: string;
  apiKey?: string;
  mapboxToken?: string;
  className?: string;
};

/** Declarative `Twinfile.yaml` + map (no stitched patch files). */
export function TwinfileSourcePane({
  unitKey,
  text,
  onChange,
  readOnly,
  statusPrefix,
  mapProvider,
  apiKey,
  mapboxToken,
  className,
}: TwinfileSourcePaneProps) {
  const parsed = useMemo(() => draftMapFromText(text), [text]);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lastGood = useRef<MapDraft>(parsed);
  if (!parsed.parseError) lastGood.current = parsed;
  const draft = parsed.parseError && parsed.features.length === 0 ? lastGood.current : parsed;

  const status = parsed.parseError ?? statusLine(statusPrefix ?? unitKey, draft);

  return createElement(
    'section',
    {
      className: className ? `twinfile-editor twinfile-editor--simple ${className}` : 'twinfile-editor twinfile-editor--simple',
      'aria-label': `Twinfile ${unitKey}`,
    },
    createElement(
      'div',
      { className: 'twinfile-editor__source' },
      createElement(
        'pre',
        { ref: highlightRef, className: 'twinfile-editor__highlight', 'aria-hidden': true },
        highlightYaml(text).map((token, index) =>
          createElement('span', { key: index, className: 'twinfile-editor__token', 'data-kind': token.kind }, token.text),
        ),
      ),
      createElement('textarea', {
        className: 'twinfile-editor__text',
        'aria-label': 'Twinfile.yaml',
        spellCheck: false,
        wrap: 'off',
        readOnly: readOnly ? true : undefined,
        value: text,
        onScroll: (event: UIEvent<HTMLTextAreaElement>) => {
          const area = event.currentTarget;
          const highlight = highlightRef.current;
          if (!highlight) return;
          highlight.style.transform = `translate(${-area.scrollLeft}px, ${-area.scrollTop}px)`;
        },
        onChange: readOnly
          ? undefined
          : (event: ChangeEvent<HTMLTextAreaElement>) => {
              onChange?.(event.target.value);
            },
      }),
    ),
    createElement(TwinfileMap, {
      draft,
      unitKey,
      mapProvider,
      apiKey,
      mapboxToken,
    }),
    createElement(
      'p',
      {
        className: 'twinfile-editor__status',
        'data-tone': parsed.parseError ? 'error' : 'ok',
      },
      status,
    ),
  );
}

function statusLine(uri: string, draft: MapDraft): string {
  const count = draft.features.length;
  const noun = count === 1 ? 'feature' : 'features';
  return `${uri} · Twinfile.yaml · ${count} map ${noun}`;
}
