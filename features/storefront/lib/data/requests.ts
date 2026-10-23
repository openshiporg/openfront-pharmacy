'use server'

import { revalidatePath } from 'next/cache'

import { storefrontRequest, type StorefrontResult } from '../storefront-client'

export type RequestKind = 'registration' | 'transfer' | 'new_prescription'

export type CustomerRequest = { id: string; kind: RequestKind; status: string; createdAt: string; resolvedAt?: string | null; resolutionNote?: string | null; locationName: string; counterpartyName?: string | null; medications?: string | null }

export type RequestInput = {
  locationId: string
  kind: RequestKind
  idempotencyKey: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  phone?: string
  allergies?: string
  insurance?: string
  counterpartyName?: string
  counterpartyPhone?: string
  prescriberName?: string
  prescriberPhone?: string
  medications?: string
  note?: string
}

const REQUEST_FIELDS = 'id kind status createdAt resolvedAt resolutionNote locationName counterpartyName medications'

export async function submitPrescriptionRequest(input: RequestInput): Promise<StorefrontResult<CustomerRequest>> {
  const response = await storefrontRequest<{ submitPharmacyPrescriptionRequest: CustomerRequest }>(
    `mutation StorefrontPrescriptionRequest($input: PharmacyPrescriptionRequestInput!) { submitPharmacyPrescriptionRequest(input: $input) { ${REQUEST_FIELDS} } }`,
    { input },
    'Your request could not be sent. Try again.',
  )
  if (!response.success) return response
  revalidatePath('/account')
  return { success: true, data: response.data.submitPharmacyPrescriptionRequest }
}

export async function getMyPrescriptionRequests(): Promise<CustomerRequest[]> {
  const response = await storefrontRequest<{ pharmacyCustomerPrescriptionRequests: CustomerRequest[] }>(`query StorefrontMyRequests { pharmacyCustomerPrescriptionRequests { ${REQUEST_FIELDS} } }`)
  return response.success ? response.data.pharmacyCustomerPrescriptionRequests : []
}
