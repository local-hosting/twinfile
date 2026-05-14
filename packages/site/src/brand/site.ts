const isDev = process.env.NODE_ENV === 'development'

/** This site (twinfile.org): guides and canonical JSON Schema URLs. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (isDev ? 'http://localhost:3000' : 'https://twinfile.org')

/** Marketing site (accord.fm). */
export const marketingSiteUrl =
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL ??
  (isDev ? 'http://localhost:3001' : 'https://accord.fm')

/** Public JSON Schema tree (`$id` prefix on twinfile.org). */
export const schemasBaseUrl = `${siteUrl}/schemas/1`
