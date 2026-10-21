import { createHash } from 'node:crypto'

export type ExternalIntegrationRequestSnapshot = {
  providerId: string
  workflowType: string
  resourceType: string
  resourceId: string
  idempotencyKey: string
  organizationId: string
  locationId: string
  payload: unknown
}

type ExistingExternalIntegrationWorkflow = {
  provider?: { id?: string | null } | null
  workflowType?: string | null
  resourceType?: string | null
  resourceId?: string | null
  idempotencyKey?: string | null
  organization?: { id?: string | null } | null
  location?: { id?: string | null } | null
  requestPayload?: unknown
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    )
  }
  return value
}

function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')
}

export function externalIntegrationRequestMatches(
  existing: ExistingExternalIntegrationWorkflow,
  request: ExternalIntegrationRequestSnapshot,
) {
  if (!existing.provider?.id || !existing.organization?.id || !existing.location?.id || existing.requestPayload == null) return false
  return fingerprint({
    providerId: existing.provider.id,
    workflowType: existing.workflowType,
    resourceType: existing.resourceType,
    resourceId: existing.resourceId,
    idempotencyKey: existing.idempotencyKey,
    organizationId: existing.organization.id,
    locationId: existing.location.id,
    payload: existing.requestPayload,
  }) === fingerprint(request)
}
