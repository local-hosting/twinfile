import { briefSection, joinBriefSections } from './format-brief.js';
import type { BriefV1 } from './types.js';

export type FeedBriefRow = {
  feedId: string;
  label?: string;
  entitled?: boolean;
};

export function buildFeedBrief(input: {
  feeds: readonly FeedBriefRow[];
}): BriefV1 {
  const entitled = input.feeds.filter((row) => row.entitled !== false);
  const summaryBullets = [
    `${input.feeds.length} feed(s) visible to this org`,
    `${entitled.length} entitled`,
  ];
  const feedBullets =
    input.feeds.length > 0
      ? input.feeds.slice(0, 12).map((row) => {
          const name = row.label?.trim() || row.feedId;
          const flag = row.entitled === false ? ' (not entitled)' : '';
          return `\`${row.feedId}\` — ${name}${flag}`;
        })
      : ['No org feeds in scope'];

  if (input.feeds.length > 12) {
    feedBullets.push(`… and ${input.feeds.length - 12} more`);
  }

  return joinBriefSections('Feed brief', [
    briefSection('Summary', summaryBullets),
    briefSection('Feeds', feedBullets),
  ]);
}
