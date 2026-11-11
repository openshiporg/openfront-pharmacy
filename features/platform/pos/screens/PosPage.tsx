import { notFound } from 'next/navigation'

import { getAuthenticatedUser } from '@/features/dashboard/actions/auth'
import { canUsePlatformPage } from '@/features/dashboard/lib/sidebarAccess'
import { getPharmacyPosStorefront } from '../actions'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'
import { PosPageClient } from './PosPageClient'

export async function PosPage() {
  const me = await getAuthenticatedUser()
  if (!canUsePlatformPage('pos', me.success ? me.data?.authenticatedItem : null)) notFound()
  const storefront = await getPharmacyPosStorefront()
  return <PosPageClient {...storefront} timeZone={await getStoreTimeZone()} stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY || null} />
}
