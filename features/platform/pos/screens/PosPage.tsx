import { getPharmacyPosStorefront } from '../actions'
import { PosPageClient } from './PosPageClient'

export async function PosPage() {
  const storefront = await getPharmacyPosStorefront()
  return <PosPageClient {...storefront} />
}
