import type { BriefSectionV1, BriefV1 } from './types.js';

function briefBulletLine(text: string): string {
  const trimmed = text.trim();
  return trimmed ? `- ${trimmed}` : '';
}

/** Render {@link BriefV1} as markdown for MCP tool text responses. */
export function formatBriefMarkdown(brief: BriefV1): string {
  const lines: string[] = [brief.headline.trim(), ''];
  for (const section of brief.sections) {
    const title = section.title.trim();
    if (!title) continue;
    lines.push(`**${title}**`);
    for (const bullet of section.bullets) {
      const line = briefBulletLine(bullet);
      if (line) lines.push(line);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

export function briefSection(
  title: string,
  bullets: readonly string[],
): BriefSectionV1 {
  const filtered = bullets.map((b) => b.trim()).filter(Boolean);
  return { title, bullets: filtered };
}

export function joinBriefSections(
  headline: string,
  sections: readonly BriefSectionV1[],
): BriefV1 {
  return {
    headline,
    sections: sections.filter((section) => section.bullets.length > 0),
  };
}
