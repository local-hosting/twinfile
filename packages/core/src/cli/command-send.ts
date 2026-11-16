import { resolve } from 'node:path';

import { sendRunCommands } from '../runners/run-commands.js';

export function runCommandSend(args: string[]): number {
  const file = args.find((arg) => !arg.startsWith('--'));
  const consent = args.includes('--allow-send');
  if (!file) {
    console.error('twin command send <run.jsonl> --allow-send');
    return 2;
  }
  try {
    const sent = sendRunCommands(resolve(file), consent);
    console.log(`ok command send ${sent.count} ${sent.outPath}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return consent ? 1 : 2;
  }
}
