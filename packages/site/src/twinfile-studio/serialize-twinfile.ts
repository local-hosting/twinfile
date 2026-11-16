import type { EditorSection } from './types/map-draft.js';

/** Comment that starts each file inside one editor buffer. */
export const TWINFILE_FILE_MARK = '# --- ';

export function serializeTwinfileFiles(files: { path: string; text: string }[]): string {
  return files
    .map((file) => `${TWINFILE_FILE_MARK}${file.path}\n${file.text.replace(/\s+$/, '')}\n`)
    .join('\n');
}

/** Split an editor buffer on file marks. A buffer with no marks is one document. */
export function splitEditorBuffer(text: string): EditorSection[] {
  const marks = [...text.matchAll(/^# ---[ \t]+(\S[^\n]*)$/gm)];
  if (marks.length === 0) return [{ path: 'document', body: text }];

  const sections: EditorSection[] = [];
  const first = marks[0]?.index ?? 0;
  if (first > 0 && text.slice(0, first).trim()) {
    sections.push({ path: 'document', body: text.slice(0, first) });
  }
  marks.forEach((mark, index) => {
    const start = (mark.index ?? 0) + mark[0].length;
    const end = marks[index + 1]?.index ?? text.length;
    const path = mark[1]?.trim() ?? 'document';
    sections.push({ path, body: text.slice(start, end) });
  });
  return sections;
}

export function editorSectionBody(text: string, path: string): string | undefined {
  const section = splitEditorBuffer(text).find((row) => row.path === path);
  return section?.body;
}

/** Replace one marked section; returns `text` unchanged when `path` is missing. */
export function replaceEditorSection(text: string, path: string, body: string): string {
  const marks = [...text.matchAll(/^# ---[ \t]+(\S[^\n]*)$/gm)];
  if (marks.length === 0) return text;

  const normalized = body.replace(/\s+$/, '');
  const chunks: string[] = [];
  let cursor = 0;

  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index]!;
    const markIndex = mark.index ?? 0;
    const markPath = (mark[1] ?? '').trim();
    const contentStart = markIndex + mark[0].length;
    const contentEnd = marks[index + 1]?.index ?? text.length;
    if (markIndex > cursor) chunks.push(text.slice(cursor, markIndex));
    chunks.push(`${TWINFILE_FILE_MARK}${markPath}\n`);
    chunks.push(markPath === path ? `${normalized}\n` : text.slice(contentStart, contentEnd));
    cursor = contentEnd;
  }
  if (cursor < text.length) chunks.push(text.slice(cursor));
  return chunks.join('');
}
