import type {
  SessionClockBus,
  SessionClockNote,
  SessionClockTransport,
} from '../types/session-clock-bus.js';
import type { WorldSessionAdvance, WorldSessionEdge } from '../types/world-session.js';

export type SessionClockEventHandlers = {
  onNote?: (note: SessionClockNote) => void;
  onEdge?: (edge: WorldSessionEdge) => void;
  onAdvance?: (advance: WorldSessionAdvance) => void;
  onTransport?: (transport: SessionClockTransport) => void;
};

/** Subscribe to session clock bus events (scrub / play / step all emit through here). */
export function attachSessionClockEventManager(
  bus: SessionClockBus,
  handlers: SessionClockEventHandlers,
): () => void {
  const unsubs: Array<() => void> = [];
  if (handlers.onNote) unsubs.push(bus.on('note', handlers.onNote));
  if (handlers.onEdge) unsubs.push(bus.on('edge', handlers.onEdge));
  if (handlers.onAdvance) unsubs.push(bus.on('advance', handlers.onAdvance));
  if (handlers.onTransport) unsubs.push(bus.on('transport', handlers.onTransport));
  return () => {
    for (const off of unsubs) off();
  };
}
