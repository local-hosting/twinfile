import { stringify as stringifyYaml } from 'yaml';

import type { TwinfileSummaryV1 } from '../types/twinfile-summary.js';
import { formatTwinfileSummaryMarkdown } from './format-summary-markdown.js';
import { renderTwinfileSummaryAscii } from './render-summary-ascii.js';

/** Presentation formats for {@link TwinfileSummaryV1} (not bridges). */
export type TwinfileSummaryViewFormat = 'ascii' | 'json' | 'yaml' | 'markdown';

export type RenderTwinfileSummaryViewOptions = {
  /**
   * When `format` is `ascii`, append the CLI format-hint footer.
   * Defaults to `true`.
   */
  asciiFooter?: boolean;
};

function summaryJsonPayload(summary: TwinfileSummaryV1): Record<string, unknown> {
  return {
    digest: summary.digest,
    summary,
    card: summary,
    ascii: renderTwinfileSummaryAscii(summary),
  };
}

/** Render a twinfile summary view (`ascii` | `json` | `yaml` | `markdown`). */
export function renderTwinfileSummaryView(
  summary: TwinfileSummaryV1,
  format: TwinfileSummaryViewFormat,
  options: RenderTwinfileSummaryViewOptions = {},
): string {
  switch (format) {
    case 'markdown':
      return formatTwinfileSummaryMarkdown(summary);
    case 'json':
      return JSON.stringify(summaryJsonPayload(summary), null, 2);
    case 'yaml':
      return stringifyYaml({ digest: summary.digest, summary });
    case 'ascii': {
      const body = renderTwinfileSummaryAscii(summary);
      if (options.asciiFooter === false) return body;
      return `${body}\n\n---\n\`twin summary --json\` · \`--yaml\` · \`--markdown\``;
    }
    default: {
      const unhandled: never = format;
      throw new Error(`unknown summary view format: ${String(unhandled)}`);
    }
  }
}
