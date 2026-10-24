'use server'

import { runMutation } from '../../lib/mutate'

const PATHS = ['/dashboard/platform/payments']

export async function setProviderInstalled(id: string, isInstalled: boolean) {
  return runMutation('mutation ProviderInstalled($id: ID!, $isInstalled: Boolean!) { updatePaymentProvider(where: { id: $id }, data: { isInstalled: $isInstalled }) { id } }', { id, isInstalled }, PATHS)
}

export async function reconcileSession(paymentSessionId: string) {
  return runMutation('mutation Reconcile($paymentSessionId: ID!) { reconcilePharmacyPaymentSession(paymentSessionId: $paymentSessionId) { success status } }', { paymentSessionId }, PATHS)
}

export async function recordCashPolicy(input: { organizationId: string; taxRateBps: number; policyReference: string; reason: string; attested: boolean }) {
  if (!Number.isInteger(input.taxRateBps) || input.taxRateBps < 0 || input.taxRateBps > 10000) return { success: false as const, error: 'Tax rate must be between 0% and 100%.' }
  return runMutation('mutation CashPolicy($organizationId: ID!, $taxRateBps: Int!, $policyReference: String!, $reason: String!, $attested: Boolean!) { recordPharmacyCashPolicy(organizationId: $organizationId, taxRateBps: $taxRateBps, policyReference: $policyReference, reason: $reason, attested: $attested) { success } }', input, [...PATHS, '/dashboard/platform/pos'])
}
