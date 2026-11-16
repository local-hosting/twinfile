import type { Job } from '../../situations/index.js';

import type { PCM } from '../types/pcm.js';
import type { MentalModel } from '../types/strategy/mental-model.js';
import type { Persona } from '../types/strategy/persona.js';
import type { ThinkingStyle } from '../types/strategy/thinking-style.js';
import type { Journey } from '../types/story/journey.js';
import type { ResearchQuote } from '../types/story/quote.js';
import type { ResearchSignal } from '../types/story/research-signal.js';

/** Slice of AXM strategy/story planes contributed by one {@link PCM}. */
export type PcmAxmContribution = {
  pcmId: string;
  persona: Persona;
  jobs: Job[];
  journeys?: Journey[];
  quotes?: ResearchQuote[];
  mentalModels?: MentalModel[];
  thinkingStyles?: ThinkingStyle[];
  signals?: ResearchSignal[];
};

export function pcmToContribution(
  pcm: PCM,
  options?: { persona?: Persona },
): PcmAxmContribution {
  const ownerId = pcm.persona.id;
  const mentalModels = (pcm.mentalModels ?? []).map((model) =>
    model.personaIds?.length
      ? model
      : { ...model, personaIds: [ownerId] },
  );
  return {
    pcmId: pcm.id,
    persona: options?.persona ?? (pcm.persona as Persona),
    jobs: pcm.jobs ?? [],
    ...(pcm.journeys?.length ? { journeys: pcm.journeys } : {}),
    ...(pcm.quotes?.length ? { quotes: pcm.quotes } : {}),
    ...(mentalModels.length ? { mentalModels } : {}),
    ...(pcm.thinkingStyles?.length ? { thinkingStyles: pcm.thinkingStyles } : {}),
    ...(pcm.signals?.length ? { signals: pcm.signals } : {}),
  };
}
