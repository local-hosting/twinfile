'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

type ThemeToggleVariant = 'floating' | 'inline'

function HalfCircleIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-5-8a5 5 0 0 0 5 5V7a5 5 0 0 0-5 5Z"
      />
    </svg>
  )
}

function SunIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path
        strokeLinecap="round"
        d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
      />
    </svg>
  )
}

function MoonIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
    </svg>
  )
}

function ToggleIcon({ variant }: { variant: ThemeToggleVariant }) {
  switch (variant) {
    case 'floating':
      return (
        <HalfCircleIcon className="h-6 w-6 fill-toggle opacity-[var(--tf-toggle-icon-opacity)] transition-opacity group-hover:opacity-100 dark:group-hover:opacity-100" />
      )
    case 'inline':
      return (
        <>
          <span className="absolute size-12 pointer-fine:hidden" />
          <SunIcon className="h-5 w-5 stroke-prose-heading dark:hidden" />
          <MoonIcon className="hidden h-5 w-5 stroke-white dark:block" />
        </>
      )
    default: {
      const unhandled: never = variant
      throw new Error(`Unhandled theme toggle variant: ${unhandled}`)
    }
  }
}

const variantClassNames: Record<ThemeToggleVariant, string> = {
  floating: 'group absolute top-4 right-4 z-50 -m-2.5 rounded-lg p-2.5',
  inline:
    'flex size-6 items-center justify-center rounded-md transition hover:bg-hover-wash',
}

export function ThemeToggle({
  variant = 'floating',
}: {
  variant?: ThemeToggleVariant
}) {
  let [mounted, setMounted] = useState(false)
  let { resolvedTheme, setTheme } = useTheme()
  let otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted && variant === 'floating') return null

  return (
    <button
      type="button"
      className={variantClassNames[variant]}
      aria-label={mounted ? `Switch to ${otherTheme} theme` : 'Toggle theme'}
      onClick={() => setTheme(otherTheme)}
    >
      <ToggleIcon variant={variant} />
    </button>
  )
}
