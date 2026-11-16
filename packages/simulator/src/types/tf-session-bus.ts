import type {
  SessionClockBus,
  SessionClockBusEvents,
  SessionClockBusHandler,
  SessionClockBusRecord,
  SessionClockNote,
  SessionClockTransport,
} from './session-clock-bus.js';
import {
  createSessionClockBus,
  type CreateSessionClockBusOptions,
} from '../timeline/session-clock-bus.js';

export type {
  SessionClockBusEvents,
  SessionClockBusRecord,
  SessionClockNote,
  SessionClockTransport,
};

/** World-time bus (`note` / `edge` / `advance`) — not the patch module bus. */
export type TFSessionBus = SessionClockBus;

export type TFSessionBusHandler<K extends keyof SessionClockBusEvents> = SessionClockBusHandler<K>;

export type CreateTFSessionBusOptions = CreateSessionClockBusOptions;

export function createTFSessionBus(options?: CreateTFSessionBusOptions): TFSessionBus {
  return createSessionClockBus(options);
}
