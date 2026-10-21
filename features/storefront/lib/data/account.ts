'use server'

import type { PharmacyPatientPortalProjection } from '@/features/pharmacy/contracts'
import { storefrontRequest } from '../storefront-client'
import type { CustomerOrder } from './orders'

export type CustomerAccount = { id: string; name: string; hasPatientProfile: boolean; orders: CustomerOrder[] }

export async function getCustomerAccount(): Promise<CustomerAccount | null> {
  const response = await storefrontRequest<{ pharmacyCustomerAccount: CustomerAccount }>(
    'query StorefrontCustomerAccount { pharmacyCustomerAccount { id name hasPatientProfile orders { id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount } } } }',
  )
  return response.success ? response.data.pharmacyCustomerAccount : null
}

export async function getPatientPortal(): Promise<PharmacyPatientPortalProjection | null> {
  const response = await storefrontRequest<{ pharmacyPatientPortal: PharmacyPatientPortalProjection }>(
    'query StorefrontPatientPortal { pharmacyPatientPortal { id patientNumber displayName preferredContactMethod prescriptions { id prescriptionItemId prescriptionNumber status locationId locationName prescriberName medicationName refillsRemaining itemVersion fillLineage refillEligible lastRefillStatus } orders { id orderNumber status fulfillmentStatus totalAmount currencyCode createdAt } } }',
  )
  return response.success ? response.data.pharmacyPatientPortal : null
}
