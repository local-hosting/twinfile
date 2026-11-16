import Link from 'next/link'

import { exampleBuildingItems, exampleSiteItems } from '@/data/examples-catalog'
import { type ExampleCatalogItem } from '@/types/examples'

export const metadata = {
  title: 'Examples',
  description:
    'Runnable place twins from examples in the Twinfile editor.',
}

function CatalogGroup({
  title,
  hint,
  items,
  linkSuffix,
}: {
  title: string
  hint: string
  items: ExampleCatalogItem[]
  linkSuffix?: string
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold text-prose-heading">
        {title}
      </h2>
      <p className="mt-2 text-sm text-prose-muted">{hint}</p>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={`/examples/${item.label}`}
              className="flex flex-col gap-0.5 px-4 py-3 text-sm transition hover:bg-hover-wash sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-prose-heading">
                {item.label}
                {linkSuffix ? (
                  <span className="font-normal text-prose-subtle">
                    {' '}
                    {linkSuffix}
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-xs text-prose-subtle">
                {item.uri}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ExamplesIndexPage() {
  return (
    <div className="prose-zinc prose max-w-none dark:prose-invert">
      <h1>Examples</h1>
      <p className="lead">
        Runnable place twins from{' '}
        <code className="text-sm">examples</code> in the Twinfile
        editor. A campus is a stack of building cards: each building is its own
        Twinfile under <code className="text-sm">parts/</code>, copied in with{' '}
        <code className="text-sm">copy: ./parts/…</code> (RFC 0009).
      </p>
      <CatalogGroup
        title="Sites"
        hint="Campus, open-area, linear, and indoor-stack place units."
        items={exampleSiteItems}
      />
      <CatalogGroup
        title="Building interiors"
        hint="Nested Twinfiles a site copies in; floors nest under their building."
        items={exampleBuildingItems}
      />
    </div>
  )
}
