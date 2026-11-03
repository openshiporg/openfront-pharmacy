import { ClientError, GraphQLClient } from 'graphql-request'
import { getServerGraphQLTarget } from '@/features/dashboard/lib/getBaseUrl'
import { getAuthHeaders } from './data/cookies'

const USER_INPUT_CODES = new Set(['BAD_USER_INPUT', 'KS_USER_INPUT_ERROR', 'KS_VALIDATION_FAILURE'])

export const STOREFRONT_REQUEST_ERROR = 'Something went wrong. Please try again.'

export type StorefrontResult<T> = { success: true; data: T } | { success: false; error: string; code?: string }

/**
 * Storefront GraphQL request. Never logs the request or the raw error (a ClientError message embeds the
 * request variables, including passwords); only customer-input errors are returned verbatim.
 */
export async function storefrontRequest<T>(query: string, variables: Record<string, unknown> = {}, fallback = STOREFRONT_REQUEST_ERROR): Promise<StorefrontResult<T>> {
  try {
    // Per request: loopback with THIS request's signed end-user identity; public endpoint if PORT is unknown.
    const { endpoint, fetch: internalFetch } = await getServerGraphQLTarget()
    const client = new GraphQLClient(endpoint, { headers: await getAuthHeaders(), redirect: 'error', ...(internalFetch ? { fetch: internalFetch } : {}) })
    return { success: true, data: await client.request<T>(query, variables) }
  } catch (error) {
    const first = error instanceof ClientError ? error.response.errors?.[0] : undefined
    const code = typeof first?.extensions?.code === 'string' ? first.extensions.code : undefined
    console.error('Storefront request failed:', code ?? 'UNKNOWN')
    return { success: false, error: code && USER_INPUT_CODES.has(code) && first?.message ? first.message : fallback, code }
  }
}
