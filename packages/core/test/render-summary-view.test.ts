import { describe, expect, it } from 'vitest';

import { buildTwinfileSummary } from '@doppler-group/twinfile-place';
import {
  formatTwinfileSummaryMarkdown,
  renderTwinfileSummaryAscii,
  renderTwinfileSummaryView,
} from '../src/index.js';

describe('renderTwinfileSummaryView', () => {
  const summary = buildTwinfileSummary({
    twinfile: {
      twinfile: 2,
      kind: 'event',
      id: 'view-smoke',
      name: 'View Smoke',
      version: '0.0.1',
    },
  });

  it('markdown matches formatTwinfileSummaryMarkdown', () => {
    expect(renderTwinfileSummaryView(summary, 'markdown')).toBe(
      formatTwinfileSummaryMarkdown(summary),
    );
  });

  it('ascii includes layout box and optional footer', () => {
    const withFooter = renderTwinfileSummaryView(summary, 'ascii');
    expect(withFooter).toContain(renderTwinfileSummaryAscii(summary));
    expect(withFooter).toContain('twin summary --json');
    expect(renderTwinfileSummaryView(summary, 'ascii', { asciiFooter: false })).toBe(
      renderTwinfileSummaryAscii(summary),
    );
  });

  it('json and yaml carry digest + summary', () => {
    const json = JSON.parse(renderTwinfileSummaryView(summary, 'json')) as {
      digest: string;
      summary: { header: { name: string } };
      ascii: string;
    };
    expect(json.summary.header.name).toBe('View Smoke');
    expect(json.ascii).toBe(renderTwinfileSummaryAscii(summary));
    expect(renderTwinfileSummaryView(summary, 'yaml')).toContain('View Smoke');
  });
});
