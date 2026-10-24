import { cache } from 'react'

import { platformRequest } from './request'

/** The pharmacy's time zone (its first location's), read once per request. */
export const getStoreTimeZone = cache(async (): Promise<string | null> => {
  const response = await platformRequest<{ pharmacyLocations: Array<{ timezone?: string | null }> }>('query StoreTimeZone { pharmacyLocations(take: 1, orderBy: { createdAt: asc }) { timezone } }')
  return response.success ? response.data.pharmacyLocations[0]?.timezone || null : null
})
