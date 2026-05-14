/**
 * Blocks raw Tailwind palette steps (`text-zinc-500`, `bg-sky-400/10`, …) in class strings.
 * Use semantic token utilities from `src/styles/theme.css` instead.
 */
const palette =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const pattern = `\\b[a-z-]+-(${palette})-\\d{2,3}\\b`
const message =
  'Use semantic token utilities (e.g. text-prose-muted, bg-surface-page, border-line) instead of raw Tailwind palette colors.'

export const tokenColorRules = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: `Literal[value=/${pattern}/]`, message },
      { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
    ],
  },
}
