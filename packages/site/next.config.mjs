import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

import nextMDX from '@next/mdx'

import { recmaPlugins } from './src/mdx/recma.mjs'
import { rehypePlugins } from './src/mdx/rehype.mjs'
import { remarkPlugins } from './src/mdx/remark.mjs'
import withSearch from './src/mdx/search.mjs'

const withMDX = nextMDX({
  options: {
    remarkPlugins,
    rehypePlugins,
    recmaPlugins,
  },
})

const appRoot = path.dirname(fileURLToPath(import.meta.url))

const geokitEnvFile = path.join(appRoot, '../geokit/.env')
const geokitEnv = existsSync(geokitEnvFile)
  ? parseEnv(readFileSync(geokitEnvFile, 'utf8'))
  : {}

const mapEnv = {
  NEXT_PUBLIC_MAPTILER_KEY:
    process.env.NEXT_PUBLIC_MAPTILER_KEY ??
    process.env.MAPTILER_KEY ??
    geokitEnv.MAPTILER_KEY,
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ?? geokitEnv.MAPBOX_TOKEN,
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: Object.fromEntries(Object.entries(mapEnv).filter(([, value]) => value)),
  outputFileTracingRoot: appRoot,
  transpilePackages: ['@local-hosting/geokit'],
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  outputFileTracingIncludes: {
    '/**/*': ['./src/app/**/*.mdx'],
  },
  async redirects() {
    return [
      { source: '/place-units', destination: '/author', permanent: true },
      { source: '/stack', destination: '/', permanent: false },
      { source: '/roadmap', destination: '/', permanent: false },
      { source: '/geotypes', destination: '/author#geotype', permanent: false },
      { source: '/geokit', destination: '/', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/schemas/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default withSearch(withMDX(nextConfig))
