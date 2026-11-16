import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { siteUrl } from '@/brand/site'
import { Layout } from '@/components/layout/Layout'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s - Twinfile',
    default: 'Twinfile documentation',
  },
  description:
    'Twinfile is an open standard for describing places as digital twins. Build on it freely.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full bg-surface-page text-prose-body antialiased">
        <Providers>
          <div className="w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
