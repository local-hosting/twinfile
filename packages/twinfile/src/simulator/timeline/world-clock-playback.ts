import type { SessionClockBus } from '../types/session-clock-bus.js';
import type { WorldSessionAdvance } from '../types/world-session.js';
import { formatLocalDateTime } from './scrub.js';
import { createWorldSession, type WorldSession, type WorldSessionOptions } from './world-session.js';

export type WorldClockPlaybackState = 'paused' | 'playing';

export type WorldClockPlaybackOptions = WorldSessionOptions & {
  /** Wall seconds per simulation second while playing (default `1`). */
  speed?: number;
  /** IANA timezone for `localAt()` display. */
  timezone: string;
  /** Same bus as {@link WorldSessionOptions.bus} — also receives **transport** play/pause. */
  bus?: SessionClockBus;
};

export type WorldClockPlayback = {
  readonly session: WorldSession;
  state: WorldClockPlaybackState;
  speed: number;
  timezone: string;
  /** Place-local wall clock at playhead (`YYYY-MM-DDTHH:mm`). */
  localAt(): string;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(t: number): ReturnType<WorldSession['seek']>;
  stepForward(): WorldSessionAdvance;
  stepBack(): WorldSessionAdvance;
  /** Milliseconds of wall time per one clock `step` at current speed. */
  wallMsPerStep(): number;
  /** Call from animation frame or timer; advances playhead when playing. */
  tickWallMs(deltaMs: number): WorldSessionAdvance | undefined;
  atEnd(): boolean;
};

export function createWorldClockPlayback(options: WorldClockPlaybackOptions): WorldClockPlayback {
  const bus = options.bus;
  const session = createWorldSession(options);
  const clock = session.timeline.clock;
  let state: WorldClockPlaybackState = 'paused';
  let speed = options.speed ?? 1;
  let accumMs = 0;

  const emitTransport = (next: WorldClockPlaybackState): void => {
    bus?.emit('transport', { state: next });
  };

  const localAt = (): string => {
    const ms = clock.startMs + session.playheadT * 1000;
    return formatLocalDateTime(ms, options.timezone);
  };

  const atEnd = (): boolean => session.playheadT >= clock.durationS;

  const wallMsPerStep = (): number => (clock.stepS * 1000) / speed;

  const pausePlayback = (): void => {
    if (state === 'paused') return;
    state = 'paused';
    accumMs = 0;
    emitTransport('paused');
  };

  const playPlayback = (): void => {
    if (atEnd()) return;
    if (state === 'playing') return;
    state = 'playing';
    emitTransport('playing');
  };

  const tickWallMs = (deltaMs: number): WorldSessionAdvance | undefined => {
    if (state !== 'playing' || atEnd()) {
      if (atEnd()) pausePlayback();
      return undefined;
    }
    accumMs += deltaMs;
    const threshold = wallMsPerStep();
    let last: WorldSessionAdvance | undefined;
    while (accumMs >= threshold && !atEnd()) {
      accumMs -= threshold;
      last = session.stepForward();
      if (session.playheadT >= clock.durationS) {
        pausePlayback();
        break;
      }
    }
    return last;
  };

  return {
    session,
    get state() {
      return state;
    },
    get speed() {
      return speed;
    },
    set speed(next: number) {
      speed = Math.max(0.05, next);
    },
    timezone: options.timezone,
    localAt,
    play: playPlayback,
    pause: pausePlayback,
    toggle: () => (state === 'playing' ? pausePlayback() : playPlayback()),
    seek: (t: number) => session.seek(t),
    stepForward: () => {
      if (atEnd()) return { playheadT: session.playheadT, sample: session.sample(), edges: [] };
      return session.stepForward();
    },
    stepBack: () => session.stepBack(),
    wallMsPerStep,
    tickWallMs,
    atEnd,
  };
};
