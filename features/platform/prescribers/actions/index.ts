'use server'

import { runMutation } from '../../lib/mutate'

export async function validatePrescriberThroughProvider(prescriberId: string, providerId: string) {
  return runMutation('mutation ValidatePrescriber($providerId: ID!, $prescriberId: ID!) { validatePharmacyPrescriber(providerId: $providerId, prescriberId: $prescriberId) { success status } }', { providerId, prescriberId }, ['/dashboard/platform/prescribers', `/dashboard/platform/prescribers/${prescriberId}`])
}
