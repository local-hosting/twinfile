import { templateReplyFromPcmAtBeat } from '@doppler-group/twinfile-character/pcm';
import type { PcmSamStoryRun } from './pcm-sam-story-run.js';

export type StoryCharacterLlmInterpretInput = {
  message: string;
  run: PcmSamStoryRun;
};

export type StoryCharacterLlmInterpretResult = {
  reply: string;
  provider?: 'anthropic' | 'llama';
};

export type StoryCharacterLlmInterpreter = (
  input: StoryCharacterLlmInterpretInput,
) => Promise<string | StoryCharacterLlmInterpretResult | undefined>;

export type StoryCharacterChatResult = {
  reply: string;
  mode: 'template' | 'llm';
  note?: string;
  provider?: 'anthropic' | 'llama';
};

export async function runStoryCharacterChat(
  run: PcmSamStoryRun,
  message: string,
  deps: { interpret?: StoryCharacterLlmInterpreter } = {},
): Promise<StoryCharacterChatResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { reply: 'Please send a message.', mode: 'template', note: 'Message is required' };
  }

  const { psychology, beat } = run;

  if (deps.interpret) {
    const llm = await deps.interpret({ message: trimmed, run });
    if (llm) {
      const reply = typeof llm === 'string' ? llm : llm.reply;
      const provider = typeof llm === 'string' ? undefined : llm.provider;
      return {
        reply: reply.trim(),
        mode: 'llm',
        ...(provider ? { provider } : {}),
      };
    }
  }

  return {
    reply: templateReplyFromPcmAtBeat(psychology, beat, trimmed),
    mode: 'template',
    note: 'PCM at SAM story beat',
  };
}
