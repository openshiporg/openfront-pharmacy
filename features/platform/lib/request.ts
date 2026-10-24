import { ClientError, GraphQLClient } from 'graphql-request'

import { getAuthHeaders } from '@/features/dashboard/lib/cookies'
import { getGraphQLEndpoint } from '@/features/dashboard/lib/getBaseUrl'
import type { KeystoneResponse } from '@/features/dashboard/lib/keystoneClient'
import { PUBLIC_REQUEST_ERROR } from '@/features/dashboard/lib/security'

// Refusals the operator can act on: domain rules, list validation and access control.
const OPERATOR_CODES = new Set(['BAD_USER_INPUT', 'PHARMACY_CONFLICT', 'KS_USER_INPUT_ERROR', 'KS_VALIDATION_FAILURE', 'KS_ACCESS_DENIED'])

/**
 * Platform GraphQL request as the signed-in user. Like keystoneClient, but a refusal comes back with the
 * server's own message instead of the generic one. Never logs the request or the raw error (a ClientError
 * message embeds the request variables).
 */
export async function platformRequest<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<KeystoneResponse<T>> {
  try {
    const client = new GraphQLClient(await getGraphQLEndpoint(), { credentials: 'include', redirect: 'error', headers: (await getAuthHeaders()) || {} })
    return { success: true, data: await client.request<T>(query, variables) }
  } catch (error) {
    const first = error instanceof ClientError ? error.response.errors?.[0] : undefined
    const code = typeof first?.extensions?.code === 'string' ? first.extensions.code : undefined
    console.error('Platform request failed:', code ?? 'UNKNOWN')
    return { success: false, error: code && OPERATOR_CODES.has(code) && first?.message ? first.message : PUBLIC_REQUEST_ERROR }
  }
}
