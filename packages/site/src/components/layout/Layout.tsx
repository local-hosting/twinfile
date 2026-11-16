'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import { HeroPattern } from '@/components/home/HeroPattern'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'

export function Layout({ children }: { children: React.ReactNode }) {
  let pathname = usePathname()

  return (
    <div className="h-full lg:ml-72 xl:ml-80">
      <motion.header className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex">
        <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-prose-hr lg:bg-surface-elevated lg:px-6 lg:pt-4 lg:pb-8 xl:w-80">
          <Header />
          <Navigation className="hidden lg:mt-10 lg:block" />
        </div>
      </motion.header>
      <div className="relative flex h-full min-h-full flex-col overflow-x-clip px-4 pt-14 sm:px-6 lg:px-8">
        {pathname === '/' && <HeroPattern />}
        <main className="relative z-10 flex-auto">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
