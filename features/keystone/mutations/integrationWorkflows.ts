import type { Context } from '.keystone/types'
import { permissions } from '../access'
import { isValidNpi } from '../workflows/prescription-eligibility'
import { requireTenantMembership } from './lib/authorization'
import { recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { externalIntegrationRequestMatches } from '../workflows/external-integration-idempotency'
import { normalizeConfiguration } from '../../integrations/erx/manual'
import { getWorkflowStatus, handleWebhook, submitWorkflow, validatePrescriber, validateProviderConfiguration } from '../utils/integrationProviderAdapter'

export async function configurePharmacyIntegrationProvider(
  _root: unknown,
  args: { providerId: string; baseUrl: string; validationPath: string; submitPath: string; statusPath: string; prescriberValidationPath?: string | null; bearerToken: string; webhookSecret: string },
  context: Context,
) {
  if (!permissions.canManageIntegrations({ session: context.session as any })) throw new Error('Permission required: canManageIntegrations')
  if (args.bearerToken.length < 16 || args.webhookSecret.length < 32) throw new Error('Provider credentials do not meet minimum length requirements')
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: 'id providerType organization { id }' })
  if (!provider || !['erx', 'insurance'].includes(provider.providerType)) throw new Error('Configurable integration provider not found')
  const { userId } = await requireTenantMembership(context, { organizationId: provider.organization.id })
  if (provider.providerType === 'erx' && (!args.prescriberValidationPath || !args.prescriberValidationPath.includes('{npi}'))) throw new Error('eRx configuration requires a prescriber validation path containing {npi}')
  const configuration = normalizeConfiguration(args)
  const credentials = { bearerToken: args.bearerToken, webhookSecret: args.webhookSecret }
  const adapterFunctions = { submitFunction: 'manual', statusFunction: 'manual', webhookFunction: 'manual' }
  await validateProviderConfiguration({ provider: { providerType: provider.providerType, ...adapterFunctions, configuration, credentials } })
  return withDomainTransaction(context, [`integration-provider:${provider.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.IntegrationProvider.updateOne({
      where: { id: provider.id },
      data: { configuration, credentials, ...adapterFunctions, status: 'active', externalValidationComplete: true, validatedAt: new Date().toISOString(), validationReference: `health:${new URL(configuration.baseUrl).host}` },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `integration.configured:${provider.id}:${Date.now()}`,
      organizationId: provider.organization.id,
      actorId: userId,
      eventType: 'integration.configured',
      resourceType: 'IntegrationProvider',
      resourceId: provider.id,
      metadata: { providerType: provider.providerType, baseHost: new URL(configuration.baseUrl).host },
    })
    return { success: true, providerId: provider.id, status: 'active' }
  })
}

export async function validatePharmacyPrescriber(_root: unknown, args: { providerId: string; prescriberId: string }, context: Context) {
  if (!permissions.canManagePrescriptions({ session: context.session as any })) throw new Error('Permission required: canManagePrescriptions')
  const [provider, prescriber] = await Promise.all([
    context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: 'id providerType status externalValidationComplete configuration credentials submitFunction organization { id }' }),
    context.sudo().query.Prescriber.findOne({ where: { id: args.prescriberId }, query: 'id npi organization { id }' }),
  ])
  if (!provider || provider.providerType !== 'erx' || provider.status !== 'active' || !provider.externalValidationComplete || !provider.configuration?.prescriberValidationPath) throw new Error('Active eRx prescriber validation provider not found')
  if (!prescriber || prescriber.organization.id !== provider.organization.id || !isValidNpi(prescriber.npi)) throw new Error('Prescriber has no valid NPI in this provider tenant')
  const { userId } = await requireTenantMembership(context, { organizationId: prescriber.organization.id })
  const result = await validatePrescriber({ provider, npi: prescriber.npi })
  const credentialExpiresAt = result.credentialExpiresAt ? new Date(result.credentialExpiresAt) : null
  if (result.valid !== true || !result.validationReference || !result.credentialType || !result.credentialJurisdiction || !result.credentialIdentifier || !credentialExpiresAt || Number.isNaN(credentialExpiresAt.getTime()) || credentialExpiresAt.getTime() <= Date.now()) {
    throw new Error('External provider response lacks current prescriber identity and credential evidence')
  }
  return withDomainTransaction(context, [`prescriber:${prescriber.id}`], async (transactionContext) => {
    await (transactionContext.prisma as any).prescriber.update({ where: { id: prescriber.id }, data: { verificationStatus: 'validated', externalValidationComplete: true, verificationMethod: 'external_provider', credentialType: String(result.credentialType).slice(0, 200), credentialJurisdiction: String(result.credentialJurisdiction).slice(0, 200), credentialIdentifier: String(result.credentialIdentifier).slice(0, 200), credentialExpiresAt, validationReference: String(result.validationReference).slice(0, 500), validatedAt: new Date(), verifiedById: userId } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescriber.validated:${prescriber.id}:${result.validationReference}`,
      organizationId: prescriber.organization.id,
      actorId: userId,
      eventType: 'prescriber.externally_validated',
      resourceType: 'Prescriber',
      resourceId: prescriber.id,
      metadata: { providerId: provider.id, validationReference: result.validationReference, credentialExpiresAt: credentialExpiresAt.toISOString(), verificationMethod: 'external_provider' },
    })
    return { success: true, prescriberId: prescriber.id, status: 'validated', validationReference: String(result.validationReference) }
  })
}

async function resourcePayload(context: Context, providerType: string, resourceId: string) {
  if (providerType === 'erx') {
    const prescription = await context.sudo().query.Prescription.findOne({
      where: { id: resourceId },
      query: 'id prescriptionNumber source sourceVerificationStatus writtenAt expiresAt organization { id } location { id } patient { patientNumber displayName dateOfBirth } prescriber { name npi verificationStatus externalValidationComplete } items { medicationNameSnapshot sig quantityPrescribed refillsAuthorized product { sku drugReference { ndc11 } } }',
    })
    if (!prescription) throw new Error('Prescription not found')
    return { resourceType: 'Prescription', organizationId: prescription.organization.id, locationId: prescription.location.id, payload: prescription }
  }
  const order = await context.sudo().query.Order.findOne({
    where: { id: resourceId },
    query: 'id orderNumber totalAmount currencyCode organization { id } location { id } patient { patientNumber } lineItems { title ndc11Snapshot quantity unitPriceAmount }',
  })
  if (!order) throw new Error('Order not found')
  return { resourceType: 'Order', organizationId: order.organization.id, locationId: order.location.id, payload: order }
}

export async function submitPharmacyExternalWorkflow(
  _root: unknown,
  args: { providerId: string; resourceId: string; idempotencyKey: string },
  context: Context,
) {
  if (!args.idempotencyKey.trim() || args.idempotencyKey.length > 200) throw new Error('A bounded idempotency key is required')
  const provider = await context.sudo().query.IntegrationProvider.findOne({
    where: { id: args.providerId },
    query: 'id providerType status externalValidationComplete configuration credentials submitFunction organization { id }',
  })
  if (!provider || !['erx', 'insurance'].includes(provider.providerType) || provider.status !== 'active' || !provider.externalValidationComplete) throw new Error('Active validated integration provider not found')
  const required = provider.providerType === 'erx' ? 'canManagePrescriptions' : 'canManagePayments'
  if (!permissions[required]({ session: context.session as any })) throw new Error(`Permission required: ${required}`)
  const resource = await resourcePayload(context, provider.providerType, args.resourceId)
  if (resource.organizationId !== provider.organization.id) throw new Error('Integration provider and resource tenant do not match')
  const { userId } = await requireTenantMembership(context, { organizationId: resource.organizationId, locationId: resource.locationId })
  const requestSnapshot = {
    providerId: provider.id,
    workflowType: provider.providerType,
    resourceType: resource.resourceType,
    resourceId: args.resourceId,
    idempotencyKey: args.idempotencyKey,
    organizationId: resource.organizationId,
    locationId: resource.locationId,
    payload: resource.payload,
  }
  const workflowKey = `${provider.id}:${args.idempotencyKey}`
  const workflow = await withDomainTransaction(context, [`integration-workflow:${workflowKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.ExternalIntegrationWorkflow.findOne({
      where: { workflowKey },
      query: 'id status externalReference workflowType resourceType resourceId idempotencyKey requestPayload organization { id } location { id } provider { id }',
    })
    if (existing) {
      if (!externalIntegrationRequestMatches(existing, requestSnapshot)) {
        throw new Error('Integration idempotency key was reused with a different provider, scope, resource, or payload')
      }
      return existing
    }
    return sudo.query.ExternalIntegrationWorkflow.createOne({
      data: {
        workflowKey,
        workflowType: provider.providerType,
        resourceType: resource.resourceType,
        resourceId: args.resourceId,
        idempotencyKey: args.idempotencyKey,
        requestPayload: resource.payload,
        organization: { connect: { id: resource.organizationId } },
        location: { connect: { id: resource.locationId } },
        provider: { connect: { id: provider.id } },
      },
      query: 'id status externalReference',
    })
  })
  if (workflow.externalReference) return { success: true, reused: true, workflowId: workflow.id, status: workflow.status, externalReference: workflow.externalReference }
  let result: any
  try {
    result = await submitWorkflow({ provider, payload: resource.payload, idempotencyKey: args.idempotencyKey })
  } catch (error) {
    await context.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status: 'failed', attempts: 1, lastError: error instanceof Error ? error.message : 'Submission failed' } })
    throw error
  }
  const status = ['accepted', 'rejected', 'pending'].includes(result.status) ? result.status : 'submitted'
  await withDomainTransaction(context, [`integration-workflow:${workflow.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status, externalReference: result.externalReference, responsePayload: result, attempts: 1, submittedAt: new Date().toISOString(), ...(status === 'accepted' || status === 'rejected' ? { resolvedAt: new Date().toISOString() } : {}) } })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `integration.submitted:${workflow.id}`,
      organizationId: resource.organizationId,
      locationId: resource.locationId,
      actorId: userId,
      eventType: `integration.${provider.providerType}.submitted`,
      resourceType: 'ExternalIntegrationWorkflow',
      resourceId: workflow.id,
      metadata: { sourceResourceType: resource.resourceType, sourceResourceId: args.resourceId, status },
    })
  })
  return { success: true, reused: false, workflowId: workflow.id, status, externalReference: result.externalReference || null }
}

export async function refreshPharmacyExternalWorkflow(_root: unknown, args: { workflowId: string }, context: Context) {
  const workflow = await context.sudo().query.ExternalIntegrationWorkflow.findOne({
    where: { id: args.workflowId },
    query: 'id status externalReference attempts resourceType organization { id } location { id } provider { id providerType status externalValidationComplete configuration credentials statusFunction }',
  })
  if (!workflow?.provider || !workflow.externalReference) throw new Error('Submitted integration workflow not found')
  const required = workflow.provider.providerType === 'erx' ? 'canManagePrescriptions' : 'canManagePayments'
  if (!permissions[required]({ session: context.session as any })) throw new Error(`Permission required: ${required}`)
  await requireTenantMembership(context, { organizationId: workflow.organization.id, locationId: workflow.location.id })
  const result = await getWorkflowStatus({ provider: workflow.provider, externalReference: workflow.externalReference })
  const status = ['accepted', 'rejected', 'pending'].includes(result.status) ? result.status : 'pending'
  await context.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status, responsePayload: result, attempts: workflow.attempts + 1, lastError: null, ...(status === 'accepted' || status === 'rejected' ? { resolvedAt: new Date().toISOString() } : {}) } })
  return { success: true, reused: false, workflowId: workflow.id, status, externalReference: workflow.externalReference }
}

export async function ingestPharmacyIntegrationWebhook(_root: unknown, args: { providerKey: string; event: any; headers: Record<string, unknown> }, context: Context) {
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { providerKey: args.providerKey }, query: 'id providerType status credentials webhookFunction organization { id }' })
  if (!provider || provider.status !== 'active') throw new Error('Webhook provider not found')
  const headers = Object.fromEntries(Object.entries(args.headers || {}).map(([key, value]) => [key === '__rawBody' ? key : key.toLowerCase(), String(value ?? '')]))
  await handleWebhook({ provider, event: args.event, headers })
  const payload = args.event || {}
  if (!payload.eventId || !payload.externalReference || !['accepted', 'rejected', 'pending'].includes(payload.status)) throw new Error('Webhook envelope is invalid')
  const eventKey = `${provider.id}:${payload.eventId}`
  return withDomainTransaction(context, [`integration-webhook:${eventKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existing = await sudo.query.IntegrationWebhookEvent.findOne({ where: { eventKey }, query: 'id status' })
    if (existing) return { accepted: true, reused: true, eventId: payload.eventId, status: existing.status }
    const workflow = (await sudo.query.ExternalIntegrationWorkflow.findMany({ where: { provider: { id: { equals: provider.id } }, externalReference: { equals: payload.externalReference } }, take: 1, query: 'id' }))[0]
    if (workflow) await sudo.query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status: payload.status, responsePayload: payload, ...(payload.status !== 'pending' ? { resolvedAt: new Date().toISOString() } : {}) } })
    await sudo.query.IntegrationWebhookEvent.createOne({ data: { eventKey, externalEventId: payload.eventId, eventType: payload.type || 'status', status: workflow ? 'processed' : 'ignored', payload, organization: { connect: { id: provider.organization.id } }, provider: { connect: { id: provider.id } }, workflow: workflow ? { connect: { id: workflow.id } } : undefined } })
    return { accepted: true, reused: false, eventId: payload.eventId, status: workflow ? 'processed' : 'ignored' }
  })
}
