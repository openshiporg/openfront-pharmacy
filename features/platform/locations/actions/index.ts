'use server'

import { runMutation } from '../../lib/mutate'

const UPDATE = 'mutation UpdateLocation($id: ID!, $data: PharmacyLocationUpdateInput!) { updatePharmacyLocation(where: { id: $id }, data: $data) { id } }'
const paths = (id: string) => ['/dashboard/platform/locations', `/dashboard/platform/locations/${id}`, '/']

export async function setLocationStatus(id: string, status: 'active' | 'temporarily_closed') {
  return runMutation(UPDATE, { id, data: { status } }, paths(id))
}

export async function setLocationSwitch(id: string, field: 'onlineOrderingEnabled' | 'pickupEnabled' | 'deliveryEnabled', enabled: boolean) {
  return runMutation(UPDATE, { id, data: { [field]: enabled } }, paths(id))
}

export async function updateLocationContact(id: string, input: { name: string; phone: string; line1: string; line2: string; city: string; region: string; postalCode: string }) {
  const name = input.name.trim()
  if (!name) return { success: false as const, error: 'Enter the location name.' }
  const address = { line1: input.line1.trim(), line2: input.line2.trim(), city: input.city.trim(), region: input.region.trim(), postalCode: input.postalCode.trim() }
  if (!address.line1 || !address.city || !address.postalCode) return { success: false as const, error: 'Enter the street, city and ZIP code.' }
  return runMutation(UPDATE, { id, data: { name, phone: input.phone.trim(), address } }, paths(id))
}
