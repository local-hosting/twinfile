/** Wire shape for PCM `SampledPersonaDailyRhythm` (avoid tight coupling on npm pin). */
export type StoryBriefDailyRhythmBlockV1 = {
  id: string;
  label: string;
  startHour: number;
  startMinute?: number;
  setting: string;
};

export type StoryBriefDailyRhythmV1 = {
  label?: string;
  weekday: StoryBriefDailyRhythmBlockV1[];
};

export function findDailyRhythmBlock(
  rhythm: StoryBriefDailyRhythmV1 | undefined,
  blockId: string,
): StoryBriefDailyRhythmBlockV1 | undefined {
  return rhythm?.weekday.find((row) => row.id === blockId);
}

export function formatDailyRhythmClock(block: StoryBriefDailyRhythmBlockV1): string {
  const hour = block.startHour;
  const minute = block.startMinute ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minutePart = minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`;
  return `${hour12}${minutePart} ${period}`;
}
