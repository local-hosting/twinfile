import { SchemasCatalog } from '@/app/schemas/SchemasCatalog'
import { schemasBaseUrl } from '@/brand/site'
import { Feedback } from '@/components/content/Feedback'
import { Prose } from '@/components/content/Prose'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JSON Schema',
  description:
    'Canonical Twinfile 1.0 JSON Schema URLs served from twinfile.org (from @local-hosting/twinfile).',
}

export default function SchemasPage() {
  return (
    <article className="flex h-full flex-col pt-16 pb-10">
      <Prose className="flex-auto">
        <h1>JSON Schema</h1>
        <p className="lead">
          Normative <strong>JSON Schema (2020-12)</strong> for Twinfile{' '}
          <strong>1.0</strong> is published at <code>/schemas/1/…</code> on this
          site. Each document’s <code>$id</code> is that public URL. Source:{' '}
          <strong>@local-hosting/twinfile</strong> (
          <a href="https://github.com/twinfile/spec">
            github.com/twinfile/spec
          </a>
          ). The site copies the files in at build time.
        </p>

        <p className="rounded-square border border-accent/20 bg-surface-elevated p-4 text-sm text-prose-body">
          In local development the same paths are served from this app. Run{' '}
          <code>yarn sync:schemas</code> in the twinfile.org repo so{' '}
          <code>public/schemas/</code> matches your spec checkout.
        </p>

        <SchemasCatalog />

        <h2 id="fetch">Fetch locally</h2>
        <pre>
          <code>{`curl -s "${schemasBaseUrl}/manifest/twinfile.schema.json" | jq '$id'`}</code>
        </pre>
        <p>
          Prose and migration guides: <a href="/spec">@local-hosting/twinfile</a>.
          Validate units with the <a href="/cli">twin CLI</a>.
        </p>
      </Prose>
      <footer className="mx-auto mt-16 w-full max-w-2xl lg:max-w-5xl">
        <Feedback />
      </footer>
    </article>
  )
}
