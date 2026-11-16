/** Story-clock position on the episode horizon (day index + hour within day). */
export type StoryClockCursor = {
  dayIndex: number;
  hourOfDay: number;
  hoursPerDay: number;
  speedMultiplier: number;
};

export type StoryClockCursorWire = {
  dayIndex: number;
  /** Hosts may store absolute `simHour` in this field — normalize with {@link hourOfDayFromWireCursor}. */
  hourOfDay: number;
  hoursPerDay?: number;
  speedMultiplier?: number;
};

export function hourOfDayFromWireCursor(wire: StoryClockCursorWire): number {
  const hoursPerDay = wire.hoursPerDay ?? 24;
  return wire.hourOfDay % hoursPerDay;
}

export function storyClockCursorFromWire(wire: StoryClockCursorWire): StoryClockCursor {
  const hoursPerDay = wire.hoursPerDay ?? 24;
  return {
    dayIndex: wire.dayIndex,
    hourOfDay: hourOfDayFromWireCursor(wire),
    hoursPerDay,
    speedMultiplier: wire.speedMultiplier ?? 1,
  };
}

export function storyClockCursorToWire(cursor: StoryClockCursor): StoryClockCursorWire {
  return {
    dayIndex: cursor.dayIndex,
    hourOfDay: cursor.dayIndex * cursor.hoursPerDay + cursor.hourOfDay,
    hoursPerDay: cursor.hoursPerDay,
    speedMultiplier: cursor.speedMultiplier,
  };
}

export function defaultStoryClockCursor(startHour = 9): StoryClockCursor {
  return {
    dayIndex: 0,
    hourOfDay: startHour,
    hoursPerDay: 24,
    speedMultiplier: 1,
  };
}
