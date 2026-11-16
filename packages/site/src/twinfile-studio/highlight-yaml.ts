export type YamlTokenKind = 'comment' | 'key' | 'string' | 'number' | 'constant' | 'punctuation' | 'text';

export type YamlToken = {
  kind: YamlTokenKind;
  text: string;
};

/** Color Twinfile YAML with the same roles as the docs code blocks. */
export function highlightYaml(source: string): YamlToken[] {
  const lines = source.split('\n');
  const tokens: YamlToken[] = [];
  for (const [index, line] of lines.entries()) {
    tokens.push(...highlightLine(line));
    if (index < lines.length - 1) tokens.push({ kind: 'text', text: '\n' });
  }
  return tokens;
}

function highlightLine(line: string): YamlToken[] {
  if (/^\s*#/.test(line)) return [{ kind: 'comment', text: line }];
  if (/^\s*---\s*$/.test(line)) return [{ kind: 'punctuation', text: line }];

  const tokens: YamlToken[] = [];
  let index = 0;
  while (line[index] === ' ') index += 1;
  if (index > 0) tokens.push({ kind: 'text', text: line.slice(0, index) });

  if (line[index] === '-' && line[index + 1] === ' ') {
    tokens.push({ kind: 'punctuation', text: '-' }, { kind: 'text', text: ' ' });
    index += 2;
  }

  const rest = line.slice(index);
  const key = rest.match(/^([^:#\n]+?)(\s*):(\s*)([\s\S]*)$/);
  if (!key) {
    tokens.push(...highlightValue(rest));
    return tokens;
  }

  const [, name, before, colonSpace, value] = key;
  tokens.push({ kind: 'key', text: name ?? '' });
  if (before) tokens.push({ kind: 'text', text: before });
  tokens.push({ kind: 'punctuation', text: ':' });
  if (colonSpace) tokens.push({ kind: 'text', text: colonSpace });
  tokens.push(...highlightValue(value ?? ''));
  return tokens;
}

function highlightValue(value: string): YamlToken[] {
  if (value === '') return [];
  const commentAt = value.search(/\s#/);
  if (commentAt >= 0) {
    return [...highlightValue(value.slice(0, commentAt)), { kind: 'comment', text: value.slice(commentAt) }];
  }
  if (/^(true|false|null|~)$/.test(value)) return [{ kind: 'constant', text: value }];
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return [{ kind: 'number', text: value }];
  if (value === '|' || value === '>') return [{ kind: 'punctuation', text: value }];
  return [{ kind: 'string', text: value }];
}
