'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'
import { normalizeWeeklyHours, weeklyHoursError, type WeeklyHours } from '@/features/pharmacy/hours'

export type StoreSettings = {
  id: string
  operatorDisplayName: string
  operatorTagline: string
  logoIcon: string
  logoColor: string
  supportEmail: string
  supportPhone: string
  privacyNotice: string
}

export type StoreLocationHours = { id: string; name: string; timezone: string; hours: WeeklyHours | null }

const storeFields = 'id operatorDisplayName operatorTagline logoIcon logoColor supportEmail supportPhone privacyNotice'

export async function getStoreSettings() {
  const response = await keystoneClient<{ organizations: StoreSettings[] }>(
    `query GetStores { organizations(take: 20, orderBy: { name: asc }) { ${storeFields} } }`,
  )

  if (!response.success) {
    return { success: false as const, error: response.error }
  }

  return { success: true as const, data: response.data.organizations }
}

export async function updateStoreSettings(storeId: string, data: Omit<StoreSettings, 'id'>) {
  // Sanitize SVG before saving to prevent XSS attacks
  const logoIcon = data.logoIcon ? sanitizeStoreLogoSvg(data.logoIcon) : undefined
  if (data.logoIcon && !logoIcon) {
    return { success: false as const, error: 'Invalid SVG format' }
  }

  const response = await keystoneClient<{ updateOrganization: StoreSettings }>(
    `mutation UpdateStore($id: ID!, $data: OrganizationUpdateInput!) { updateOrganization(where: { id: $id }, data: $data) { ${storeFields} } }`,
    {
      id: storeId,
      data: {
        operatorDisplayName: data.operatorDisplayName.trim(),
        operatorTagline: data.operatorTagline.trim(),
        logoIcon,
        logoColor: normalizeStoreLogoColor(data.logoColor),
        supportEmail: data.supportEmail.trim(),
        supportPhone: data.supportPhone.trim(),
        privacyNotice: data.privacyNotice.trim(),
      },
    },
  )

  if (!response.success) {
    return { success: false as const, error: response.error }
  }

  revalidatePath('/', 'layout')

  return { success: true as const, data: response.data.updateOrganization }
}

export async function getStoreLocationHours(storeId: string) {
  const response = await keystoneClient<{ pharmacyLocations: Array<{ id: string; name: string; timezone: string; hours: unknown }> }>(
    'query StoreLocations($storeId: ID!) { pharmacyLocations(where: { organization: { id: { equals: $storeId } } }, orderBy: { name: asc }, take: 50) { id name timezone hours } }',
    { storeId },
  )
  if (!response.success) return { success: false as const, error: response.error }
  return { success: true as const, data: response.data.pharmacyLocations.map((location): StoreLocationHours => ({ ...location, timezone: location.timezone || 'America/New_York', hours: normalizeWeeklyHours(location.hours) })) }
}

export async function updateLocationHours(locationId: string, data: { timezone: string; hours: WeeklyHours | null }) {
  const error = weeklyHoursError(data.hours)
  if (error) return { success: false as const, error }
  const response = await keystoneClient<{ updatePharmacyLocation: { id: string } }>(
    'mutation UpdateLocationHours($id: ID!, $data: PharmacyLocationUpdateInput!) { updatePharmacyLocation(where: { id: $id }, data: $data) { id } }',
    { id: locationId, data: { timezone: data.timezone.trim(), hours: data.hours } },
  )
  if (!response.success) return { success: false as const, error: response.error }
  revalidatePath('/', 'layout')
  return { success: true as const }
}
