/**
 * Shiki's `css-variables` theme colors markup tag names with the same variable
 * as string values (`--shiki-token-string-expression`). Re-point tag tokens at
 * `--shiki-token-tag` so tags and values can be styled independently.
 */
const TAG_SCOPE = 'entity.name.tag'

function isTagToken(token) {
  return (token.explanation ?? []).some((part) =>
    part.scopes.some((scope) => scope.scopeName.startsWith(TAG_SCOPE)),
  )
}

export function recolorTagTokens(lines) {
  for (const line of lines) {
    for (const token of line) {
      if (isTagToken(token)) {
        token.color = 'var(--shiki-token-tag)'
      }
    }
  }
  return lines
}
