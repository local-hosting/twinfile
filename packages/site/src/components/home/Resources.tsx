'use client'

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from 'framer-motion'
import Link from 'next/link'

import { Heading } from '@/components/content/Heading'
import { GridPattern } from '@/components/home/GridPattern'
import { DocumentIcon } from '@/components/home/icons/DocumentIcon'
import { FolderIcon } from '@/components/home/icons/FolderIcon'
import { PackageIcon } from '@/components/home/icons/PackageIcon'

interface Resource {
  href: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  pattern: Omit<
    React.ComponentPropsWithoutRef<typeof GridPattern>,
    'width' | 'height' | 'x'
  >
}

const resources: Array<Resource> = [
  {
    href: '/spec',
    name: '@local-hosting/twinfile',
    description: 'The written standard, JSON Schema, and conformance tests.',
    icon: DocumentIcon,
    pattern: {
      y: 16,
      squares: [
        [0, 1],
        [1, 3],
      ],
    },
  },
  {
    href: '/core',
    name: '@local-hosting/twinfile-core',
    description: 'The reference implementation and the twin CLI.',
    icon: PackageIcon,
    pattern: {
      y: -6,
      squares: [
        [-1, 2],
        [1, 3],
      ],
    },
  },
  {
    href: '/examples',
    name: 'examples',
    description: 'Golden place twins you can check and build locally.',
    icon: FolderIcon,
    pattern: {
      y: 22,
      squares: [[0, 1]],
    },
  },
]

function ResourceIcon({ icon: Icon }: { icon: Resource['icon'] }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-square bg-surface-inset ring-1 ring-prose-hr backdrop-blur-[2px] transition duration-300 group-hover:ring-accent/30">
      <Icon className="h-5 w-5 fill-prose-muted/20 stroke-prose-muted transition-colors duration-300 group-hover:stroke-accent" />
    </div>
  )
}

function ResourcePattern({
  mouseX,
  mouseY,
  ...gridProps
}: Resource['pattern'] & {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  let maskImage = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, white, transparent)`
  let style = { maskImage, WebkitMaskImage: maskImage }

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-square mask-[linear-gradient(white,transparent)] transition duration-300 group-hover:opacity-50">
        <GridPattern
          width={72}
          height={56}
          x="50%"
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/2 stroke-black/5 dark:fill-white/1 dark:stroke-white/2.5"
          {...gridProps}
        />
      </div>
      <motion.div
        className="absolute inset-0 rounded-square bg-linear-to-r from-info-wash to-brand-violet/5 opacity-0 transition duration-300 group-hover:opacity-100 dark:to-brand-violet/10"
        style={style}
      />
    </div>
  )
}

function Resource({ resource }: { resource: Resource }) {
  let mouseX = useMotionValue(0)
  let mouseY = useMotionValue(0)

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className="group relative flex rounded-square bg-surface-elevated transition-shadow hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20"
    >
      <ResourcePattern {...resource.pattern} mouseX={mouseX} mouseY={mouseY} />
      <div className="absolute inset-0 rounded-square ring-1 ring-prose-hr ring-inset group-hover:ring-accent/20" />
      <div className="relative rounded-square px-4 pt-16 pb-4">
        <ResourceIcon icon={resource.icon} />
        <h3 className="mt-4 text-sm/7 font-bold text-prose-heading">
          <Link href={resource.href}>
            <span className="absolute inset-0 rounded-square" />
            {resource.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-prose-muted">{resource.description}</p>
      </div>
    </div>
  )
}

export function Resources() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="resources">
        Packages
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-prose-hr pt-10 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <Resource key={resource.href} resource={resource} />
        ))}
      </div>
    </div>
  )
}
