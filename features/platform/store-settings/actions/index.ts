'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'

export type StoreSettings = {
  id: string
  operatorDisplayName: string
  operatorTagline: string
  logoIcon: string
  logoColor: string
  supportEmail: string
  supportPhone: string
}

const storeFields = 'id operatorDisplayName operatorTagline logoIcon logoColor supportEmail supportPhone'

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
      },
    },
  )

  if (!response.success) {
    return { success: false as const, error: response.error }
  }

  revalidatePath('/', 'layout')

  return { success: true as const, data: response.data.updateOrganization }
}
