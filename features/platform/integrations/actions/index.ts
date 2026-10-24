'use server'

import { runMutation } from '../../lib/mutate'

export type IntegrationConfiguration = { baseUrl: string; validationPath: string; submitPath: string; statusPath: string; prescriberValidationPath?: string; bearerToken: string; webhookSecret: string }

export async function configureIntegrationProvider(providerId: string, input: IntegrationConfiguration) {
  return runMutation(
    'mutation Configure($providerId: ID!, $baseUrl: String!, $validationPath: String!, $submitPath: String!, $statusPath: String!, $prescriberValidationPath: String, $bearerToken: String!, $webhookSecret: String!) { configurePharmacyIntegrationProvider(providerId: $providerId, baseUrl: $baseUrl, validationPath: $validationPath, submitPath: $submitPath, statusPath: $statusPath, prescriberValidationPath: $prescriberValidationPath, bearerToken: $bearerToken, webhookSecret: $webhookSecret) { success status } }',
    { providerId, ...input, prescriberValidationPath: input.prescriberValidationPath || null },
    ['/dashboard/platform/integrations'],
  )
}
