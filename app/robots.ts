import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

/** Search engines may read the shop; the staff dashboard, accounts and checkout stay out. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/account', '/cart', '/checkout', '/order-status'] }],
    ...(host ? { sitemap: `https://${host}/sitemap.xml` } : {}),
  }
}
