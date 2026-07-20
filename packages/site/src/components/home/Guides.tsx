import { Button } from '@/components/Button'
import { Heading } from '@/components/content/Heading'

const guides = [
  {
    href: '/author',
    name: 'Author a place',
    description: 'Inherit a base, patch layers, and wire plans.',
    cta: 'Follow the recipe',
  },
  {
    href: '/events',
    name: 'Events',
    description: 'Bind a shared story to one place and run it.',
    cta: 'See a scenario',
  },
  {
    href: '/cli',
    name: 'twin CLI',
    description: 'Check, build, run, and publish a unit.',
    cta: 'See the commands',
  },
  {
    href: '/examples',
    name: 'Examples',
    description: 'Golden place twins from examples.',
    cta: 'Open examples',
  },
]

export function Guides() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="guides">
        Guides
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-prose-hr pt-10 sm:grid-cols-2 xl:grid-cols-4">
        {guides.map((guide) => (
          <div key={guide.href}>
            <h3 className="text-sm font-bold text-prose-heading">
              {guide.name}
            </h3>
            <p className="mt-1 text-sm text-prose-muted">{guide.description}</p>
            <p className="mt-4">
              <Button href={guide.href} variant="text" arrow="right">
                {guide.cta}
              </Button>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
