import clsx from 'clsx'

import { schemasBaseUrl } from '@/brand/site'

type Row = { label: string; description: string; path: string }

const headCellClassName =
  'pb-2 pr-12 font-bold text-prose-heading first:pl-0 last:pr-0'

function SchemaUrlLink({
  href,
  children,
  className,
}: {
  href: string
  children: string
  className?: string
}) {
  return (
    <a
      href={href}
      className={clsx(
        'font-mono text-xs/5 break-all text-prose-link underline decoration-prose-link-underline underline-offset-[3px] transition hover:text-prose-link-hover hover:decoration-prose-link',
        className,
      )}
    >
      {children}
    </a>
  )
}

function SchemaTable({ rows }: { rows: Row[] }) {
  return (
    <table className="mt-4 w-full border-collapse text-left text-sm/6 text-prose-body">
      <thead>
        <tr className="border-b border-line">
          <th className={headCellClassName}>Schema</th>
          <th className={headCellClassName}>Description</th>
          <th className={headCellClassName}>URL</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.path}
            className="border-b border-line-subtle last:border-0"
          >
            <td className="py-2.5 pr-12 align-baseline whitespace-nowrap text-prose-heading">
              {row.label}
            </td>
            <td className="max-w-[14rem] py-2.5 pr-12 align-baseline text-prose-muted">
              {row.description}
            </td>
            <td className="py-2.5 align-baseline">
              <SchemaUrlLink href={`${schemasBaseUrl}/${row.path}`}>
                {row.path}
              </SchemaUrlLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const unit: Row[] = [
  {
    label: 'unit Twinfile (Twinfile.yaml)',
    description: 'Root unit Twinfile',
    path: 'manifest/twinfile.schema.json',
  },
  {
    label: 'Lock file',
    description: 'Pinned dependency lockfile',
    path: 'unit/lock.schema.json',
  },
]

const placeCore: Row[] = [
  {
    label: 'Place',
    description: 'Site identity and archetype',
    path: 'place/place.schema.json',
  },
  {
    label: 'Levels',
    description: 'Vertical floor definitions',
    path: 'place/levels.schema.json',
  },
  {
    label: 'Regions',
    description: 'Named zones (`spaces` collection)',
    path: 'place/spaces.schema.json',
  },
  {
    label: 'Passages',
    description: 'Doors and gates between two spaces (`openings` collection)',
    path: 'place/openings.schema.json',
  },
  {
    label: 'Paths',
    description: 'Travel between regions (`routes` collection)',
    path: 'place/routes.schema.json',
  },
  {
    label: 'Visits',
    description: 'Default visit beats',
    path: 'place/visits.schema.json',
  },
  {
    label: 'Tracks',
    description: 'Timed state tracks',
    path: 'place/time/tracks.schema.json',
  },
  {
    label: 'Schedules',
    description: 'Clock-driven schedules',
    path: 'place/time/schedules.schema.json',
  },
]

const placeMeta: Row[] = [
  {
    label: 'Hours',
    description: 'Opening hours rules',
    path: 'place/meta/hours.schema.json',
  },
  {
    label: 'Roles',
    description: 'People and responsibilities',
    path: 'place/meta/roles.schema.json',
  },
  {
    label: 'Policies',
    description: 'Rules and constraints',
    path: 'place/meta/policies.schema.json',
  },
  {
    label: 'Accessibility',
    description: 'A11y accommodations metadata',
    path: 'place/meta/accessibility.schema.json',
  },
]

const placeOps: Row[] = [
  {
    label: 'Assets',
    description: 'Equipment and fixtures',
    path: 'place/ops/assets.schema.json',
  },
  {
    label: 'Sensors',
    description: 'Sensor definitions',
    path: 'place/ops/sensors.schema.json',
  },
  {
    label: 'AI',
    description: 'AI system disclosures',
    path: 'place/ops/ai.schema.json',
  },
]

const placeNat: Row[] = [
  {
    label: 'Markers',
    description: 'Operational map anchors (crossing, launch, debris drop)',
    path: 'place/nat/markers.schema.json',
  },
  {
    label: 'Gauges',
    description: 'Measurement gauge sites',
    path: 'place/nat/gauges.schema.json',
  },
  {
    label: 'Reaches',
    description: 'Linear water reaches',
    path: 'place/nat/reaches.schema.json',
  },
  {
    label: 'Stations',
    description: 'Monitoring station sites',
    path: 'place/nat/stations.schema.json',
  },
]

const runOci: Row[] = [
  {
    label: 'Built Place (wire)',
    description: 'Wire JSON (`Place.toWire()`: `meta`, merged `place`, `digest`)',
    path: 'run/place-wire.schema.json',
  },
  {
    label: 'Plan',
    description: 'Scenario action plan',
    path: 'run/plan.schema.json',
  },
  {
    label: 'Run',
    description: 'Execution run record',
    path: 'run/run.schema.json',
  },
  {
    label: 'Metrics',
    description: 'Aggregated metric definitions',
    path: 'run/metrics.schema.json',
  },
  {
    label: 'OCI config',
    description: 'OCI image config',
    path: 'oci/oci-cfg.schema.json',
  },
  {
    label: 'DTPR',
    description: 'Transparency disclosure record',
    path: 'oci/dtpr.schema.json',
  },
  {
    label: 'JSON-LD context',
    description: 'Linked data context',
    path: 'oci/context.jsonld',
  },
]

const headingClass = 'mt-10 uppercase'

export function SchemasCatalog() {
  return (
    <div className="not-prose space-y-10">
      <p>
        Shared definitions:{' '}
        <SchemaUrlLink href={`${schemasBaseUrl}/defs.json`}>
          defs.json
        </SchemaUrlLink>
      </p>

      <section>
        <h2 id="unit" className={headingClass}>
          Unit
        </h2>
        <SchemaTable rows={unit} />
      </section>

      <section>
        <h2 id="place" className={headingClass}>
          Place layers
        </h2>
        <SchemaTable rows={placeCore} />
        <h3 id="place-meta" className={headingClass}>
          Meta
        </h3>
        <SchemaTable rows={placeMeta} />
        <h3 id="place-ops" className={headingClass}>
          Operations
        </h3>
        <SchemaTable rows={placeOps} />
        <h3 id="place-nat" className={headingClass}>
          Natural / access
        </h3>
        <SchemaTable rows={placeNat} />
      </section>

      <section>
        <h2 id="run" className={headingClass}>
          Run &amp; OCI
        </h2>
        <SchemaTable rows={runOci} />
      </section>
    </div>
  )
}
