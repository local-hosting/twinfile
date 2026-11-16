import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExampleEditor } from '@/components/ExampleEditor'
import { exampleCatalogItems, findExampleBySlug } from '@/data/examples-catalog'
import { loadExampleDocument } from '@/lib/example-document'

export function generateStaticParams() {
  return exampleCatalogItems.map((item) => ({ slug: item.label }))
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const item = findExampleBySlug(slug)
  if (!item) return { title: 'Examples' }
  const role = item.role === 'building' ? `building in ${item.parent}` : 'place unit'
  return {
    title: item.label,
    description: `Twinfile ${role} ${item.uri} from examples.`,
  }
}

export default async function ExampleUnitPage({ params }: PageProps) {
  const { slug } = await params
  const item = findExampleBySlug(slug)
  if (!item) notFound()

  let text: string
  try {
    text = loadExampleDocument(item.uri)
  } catch {
    notFound()
  }

  const badge =
    item.role === 'building'
      ? `Building copied by ${item.parent} (copy: ./parts/…)`
      : 'Site place'

  return (
    <>
      <header className="mb-6 space-y-1">
        <p className="text-sm font-medium text-prose-subtle">{badge}</p>
        <p className="font-mono text-sm text-prose-body">{item.uri}</p>
      </header>
      <ExampleEditor key={item.uri} uri={item.uri} text={text} />
    </>
  )
}
