import type { ReactNode } from 'react'

import { Pre as HighlightedPre } from '@/components/content/Code'
import { ExampleEditor } from '@/components/ExampleEditor'
import { exampleText } from '@/lib/example-document'

type FenceProps = {
  children?: ReactNode
  code?: string
  language?: string
  title?: string
}

/** Twinfile YAML fences open in the editor. Other fences stay highlighted code. */
export function Fence({ code, language, children, title }: FenceProps) {
  const source = typeof code === 'string' ? code : ''
  const uri = twinfileUri(language, source)
  if (!uri) {
    return (
      <HighlightedPre code={code} language={language} label={title}>
        {children ?? null}
      </HighlightedPre>
    )
  }

  return <ExampleEditor uri={uri} text={exampleText(uri, source)} />
}

function twinfileUri(
  language: string | undefined,
  source: string,
): string | undefined {
  if (language !== 'yaml' && language !== 'yml') return undefined
  if (!/^twinfile:\s*\d+\s*$/m.test(source)) return undefined
  const name = /^name:\s*(\S+)\s*$/m.exec(source)?.[1]
  const version = /^version:\s*(\S+)\s*$/m.exec(source)?.[1]
  if (!name || !version) return 'document'
  return `twinfile/${name}:${version}`
}
