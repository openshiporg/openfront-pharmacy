'use server'

import { revalidatePath } from 'next/cache'

import { setStoredLocationId } from './cookies'
import { fetchCatalogPage, fetchTenantPage } from './store'

export async function getCatalogPage(input: { locationId: string; search?: string | null; category?: string | null; after?: string | null }) {
  return fetchCatalogPage({ ...input, first: 50 })
}

export async function getLocationsPage(input: { search?: string | null; after?: string | null }) {
  return fetchTenantPage({ ...input, first: 50 })
}

export async function selectLocation(locationId: string) {
  await setStoredLocationId(locationId)
  revalidatePath('/', 'layout')
}
