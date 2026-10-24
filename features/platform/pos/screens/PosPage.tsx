import { getPharmacyPosStorefront } from '../actions'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'
import { PosPageClient } from './PosPageClient'

export async function PosPage() {
  const storefront = await getPharmacyPosStorefront()
  return <PosPageClient {...storefront} timeZone={await getStoreTimeZone()} />
}
