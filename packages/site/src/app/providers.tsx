'use client'

import { ThemeProvider } from '@/brand/components/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
