'use client'

import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'

import { Tag } from '@/components/content/Tag'
import { useIsInsideMobileNavigation } from '@/components/layout/MobileNavigation'
import { remToPx } from '@/lib/remToPx'
import { CloseButton } from '@headlessui/react'

interface NavGroup {
  title: string
  links: Array<{
    title: string
    href: string
    tag?: string
  }>
}

function useInitialValue<T>(value: T, condition = true) {
  // eslint-disable-next-line react-hooks/refs
  let initialValue = useRef(value).current
  return condition ? initialValue : value
}

function TopLevelNavItem({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li className="md:hidden">
      <CloseButton
        as={Link}
        href={href}
        className="block py-1 text-sm text-prose-muted transition hover:text-prose-heading"
      >
        {children}
      </CloseButton>
    </li>
  )
}

function NavLink({
  href,
  children,
  tag,
  active = false,
}: {
  href: string
  children: React.ReactNode
  tag?: string
  active?: boolean
}) {
  return (
    <CloseButton
      as={Link}
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex justify-between gap-2 rounded-lg py-1 pr-3 pl-4 text-sm transition',
        active
          ? 'bg-hover-wash text-prose-heading'
          : 'text-prose-muted hover:text-prose-heading',
      )}
    >
      <span className="truncate">{children}</span>
      {tag && (
        <Tag variant="small" color="muted">
          {tag}
        </Tag>
      )}
    </CloseButton>
  )
}

function ActivePageMarker({
  group,
  pathname,
}: {
  group: NavGroup
  pathname: string
}) {
  let itemHeight = remToPx(2)
  let offset = remToPx(0.25)
  let activePageIndex = group.links.findIndex((link) => link.href === pathname)
  let top = offset + activePageIndex * itemHeight

  return (
    <motion.div
      layout
      className="absolute left-2 h-6 w-px bg-accent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0 }}
      style={{ top }}
    />
  )
}

function NavigationGroup({
  group,
  className,
}: {
  group: NavGroup
  className?: string
}) {
  // If this is the mobile navigation then we always render the initial
  // state, so that the state does not change during the close animation.
  // The state will still update when we re-open (re-render) the navigation.
  let pathname = useInitialValue(usePathname(), useIsInsideMobileNavigation())

  let isActiveGroup =
    group.links.findIndex((link) => link.href === pathname) !== -1

  return (
    <li className={clsx('relative mt-6', className)}>
      <h2 className="tf-eyebrow">{group.title}</h2>
      <div className="relative mt-3 pl-2">
        <div className="absolute inset-y-0 left-2 w-px bg-line" />
        <AnimatePresence initial={false}>
          {isActiveGroup && (
            <ActivePageMarker group={group} pathname={pathname} />
          )}
        </AnimatePresence>
        <ul role="list" className="border-l border-transparent">
          {group.links.map((link) => (
            <li key={link.href} className="relative">
              <NavLink
                href={link.href}
                tag={link.tag}
                active={link.href === pathname}
              >
                {link.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export const navigation: Array<NavGroup> = [
  {
    title: 'Guides',
    links: [
      { title: 'Introduction', href: '/' },
      { title: 'Quickstart', href: '/quickstart' },
      { title: 'Author a place', href: '/author' },
      { title: 'Situations', href: '/situations' },
      { title: 'twin CLI', href: '/cli' },
      { title: 'Examples', href: '/examples' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { title: '@local-hosting/twinfile', href: '/spec' },
      { title: '@local-hosting/twinfile-core', href: '/core' },
    ],
  },
]

export function Navigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <ul role="list">
        <TopLevelNavItem href="/">Docs</TopLevelNavItem>
        <TopLevelNavItem href="/schemas">Schemas</TopLevelNavItem>
        {navigation.map((group, groupIndex) => (
          <NavigationGroup
            key={group.title}
            group={group}
            className={groupIndex === 0 ? 'md:mt-0' : ''}
          />
        ))}
      </ul>
    </nav>
  )
}
