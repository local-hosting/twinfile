import clsx from 'clsx'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { forwardRef } from 'react'

import { ThemeToggle } from '@/brand/components/ThemeToggle'
import {
  MobileNavigation,
  useIsInsideMobileNavigation,
  useMobileNavigationStore,
} from '@/components/layout/MobileNavigation'
import { MobileSearch, Search } from '@/components/search/Search'

function TopLevelNavItem({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm/5 text-prose-muted transition hover:text-prose-heading"
      >
        {children}
      </Link>
    </li>
  )
}

export const Header = forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<typeof motion.div>
>(function Header({ className, ...props }, ref) {
  let { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  let isInsideMobileNavigation = useIsInsideMobileNavigation()

  let { scrollY } = useScroll()
  let bgOpacityLight = useTransform(scrollY, [0, 72], ['50%', '90%'])
  let bgOpacityDark = useTransform(scrollY, [0, 72], ['20%', '80%'])

  return (
    <motion.div
      {...props}
      ref={ref}
      className={clsx(
        className,
        'fixed inset-x-0 top-0 z-50 lg:left-72 xl:left-80',
      )}
    >
      <motion.div
        aria-hidden
        className={clsx(
          'pointer-events-none absolute inset-0 transition',
          !isInsideMobileNavigation && 'backdrop-blur-xs dark:backdrop-blur-sm',
          isInsideMobileNavigation
            ? 'bg-surface-page'
            : 'bg-surface-page/(--bg-opacity-light) dark:bg-surface-page/(--bg-opacity-dark)',
        )}
        style={
          {
            '--bg-opacity-light': bgOpacityLight,
            '--bg-opacity-dark': bgOpacityDark,
          } as React.CSSProperties
        }
      />
      <div className="relative z-10 flex h-14 w-full items-center justify-between gap-12 px-4 sm:px-6 lg:px-8">
        <div
          className={clsx(
            'absolute inset-x-0 top-full h-px transition',
            (isInsideMobileNavigation || !mobileNavIsOpen) && 'bg-prose-hr',
          )}
        />
        <Search />
        <div className="flex items-center gap-5 lg:hidden">
          <MobileNavigation />
        </div>
        <div className="flex items-center gap-5">
          <nav className="hidden md:block">
            <ul role="list" className="flex items-center gap-8">
              <TopLevelNavItem href="/">Docs</TopLevelNavItem>
              <TopLevelNavItem href="/schemas">Schemas</TopLevelNavItem>
            </ul>
          </nav>
          <div className="hidden md:block md:h-5 md:w-px md:bg-prose-hr" />
          <div className="flex gap-4">
            <MobileSearch />
            <ThemeToggle variant="inline" />
          </div>
        </div>
      </div>
    </motion.div>
  )
})
