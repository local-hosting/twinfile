import type { TwinError } from '../types/twin-error.js';

export function formatTwinErrors(root: string, errors: TwinError[]): string[] {
  const lines: string[] = [];
  for (const [index, error] of errors.entries()) {
    const where =
      error.file !== undefined
        ? error.line !== undefined
          ? `${error.file}:${error.line}: `
          : `${error.file}: `
        : `${root}: `;
    lines.push(`${index + 1}. [${error.code}] ${where}${error.message}`);
    if (error.hint) {
      lines.push(`   → ${error.hint}`);
    }
  }
  return lines;
}
