import type { StoryJourney } from '../../types/story-narrative-journey.js';

export function formatJourneyMarkdown(journey: StoryJourney): string {
  const lines = [
    `# ${journey.storyTitle}`,
    '',
    `**Story:** \`${journey.storyId}\`  `,
    `**Journey:** \`${journey.journeyId}\`  `,
    `**Persona:** \`${journey.personaId}\``,
    '',
    '## Phases',
    '',
  ];

  for (const phase of journey.phases.sort((a, b) => a.order - b.order)) {
    lines.push(`### ${phase.order + 1}. ${phase.label}`, '');
    if (phase.touchpointLabels.length > 0) {
      lines.push('**Touchpoints**', ...phase.touchpointLabels.map((t) => `- ${t}`), '');
    }
    if (phase.needLabels.length > 0) {
      lines.push('**Needs**', ...phase.needLabels.map((n) => `- ${n}`), '');
    }
    if (phase.obstacles.length > 0) {
      lines.push('**Obstacles**', ...phase.obstacles.map((o) => `- ${o.text} — _${o.outcome}_`), '');
    }
  }

  lines.push(...formatJourneyHeartTable(journey));
  return lines.join('\n').trimEnd() + '\n';
}

function formatJourneyHeartTable(journey: StoryJourney): string[] {
  if (journey.heartTrends.length === 0) {
    return [];
  }
  const phases = [...journey.phases].sort((a, b) => a.order - b.order);
  const header = ['HEART', 'Start', ...phases.map((p) => p.label), 'Trend'];
  const rows = journey.heartTrends.map((trend) => [
    trend.dimension,
    trend.start.toFixed(2),
    ...phases.map((p) => p.heart[trend.dimension].toFixed(2)),
    trend.healthy ? 'rising / held high' : '**falling**',
  ]);
  return [
    '## HEART over time',
    '',
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
    '',
  ];
}
