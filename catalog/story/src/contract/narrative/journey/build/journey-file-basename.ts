/** `story:episode:rider-commute` → `rider-commute` for build output paths. */
export function journeyFileBasename(samId: string): string {
  return samId.replace(/^story:episode:/, '').trim();
}
