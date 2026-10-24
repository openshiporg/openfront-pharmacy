import type { Context } from '.keystone/types'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { assertPrescriptionClinicallyEligible } from '../workflows/prescription-eligibility'
import { calculateTaxAmount } from '../workflows/commerce-policy'
import { assertPrescriptionItemProductIdentity } from '../workflows/clinical-safety'
import { FILL_LINEAGE, fillHash, parseFillPolicy, prescriptionItemVersion, prescriptionAuthorityVersion, releaseFillPlan, dispenseFillPlan } from '../workflows/fill-entitlement'
import { DomainError } from './lib/errors'

export const FILL_PRESCRIPTION_QUERY = `id status sourceVerificationStatus writtenAt expiresAt
  organization { id prescriptionFillPolicy cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt } location { id }
  patient { id status organizations { id } user { id } identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } }
  prescriber { id organization { id } npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } }
  items { id prescription { id } fillLineage activeFillNumber medicationNameSnapshot sig quantityPrescribed quantityDispensed daysSupply refillsAuthorized refillsRemaining refillsReserved substitutionAllowed drugReference { id } product { id title sku priceAmount currencyCode taxable drugReference { id } } }`
export const FILL_QUERY = `id reservationKey requestFingerprint openKey status kind version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased itemVersion authorityVersion expiresAt policySnapshot priceSnapshot createdAt prescription { id } prescriptionItem { id } organization { id } location { id } patient { id } refillRequest { id } approval { id }`
const connect = (id: string) => ({ connect: { id } })
export function fillStore(context: Context) {
  const query = context.sudo().query as any
  if (!query.PrescriptionFill || !query.PrescriptionFillEvent) throw new DomainError('Per-fill lineage requires the isolated schema/migration gate; legacy records are not converted automatically')
  return query
}
export async function currentFillPermission(context: Context, permission: 'canReviewPrescriptions' | 'canDispenseMedications' | 'canManageOrganizations' | 'canManagePrescriptions' | 'canApproveConsequentialActions') {
  requirePermission(context, permission)
  const actor = await context.sudo().query.User.findOne({ where: { id: context.session!.itemId }, query: `id role { ${permission} }` })
  if (!(actor as any)?.role?.[permission]) throw new DomainError('Current operator permission was revoked')
}
export async function loadFillPrescription(context: Context, prescriptionId: string) {
  const p: any = await context.sudo().query.Prescription.findOne({ where: { id: prescriptionId }, query: FILL_PRESCRIPTION_QUERY })
  if (!p?.organization?.id || !p.location?.id || !p.patient?.id || p.patient.status !== 'active'
    || !p.patient.organizations?.some((o: any) => o.id === p.organization.id)
    || p.prescriber?.organization?.id !== p.organization.id) throw new DomainError('Current prescription/patient/prescriber scope requires reconciliation')
  return p
}
export async function assertItemFillLedger(context: Context, p: any, item: any) {
  if (item.fillLineage !== FILL_LINEAGE) return
  const store = (context.prisma as any).prescriptionFill
  if (!store) throw new DomainError('Per-fill schema gate is required')
  const where = { prescriptionId: p.id, prescriptionItemId: item.id, organizationId: p.organization.id, locationId: p.location.id, patientId: p.patient.id }
  const [totals, consumed, reserved] = await Promise.all([
    store.aggregate({ where, _sum: { quantityDispensed: true } }),
    store.count({ where: { ...where, kind: 'refill', creditState: 'consumed' } }),
    store.count({ where: { ...where, kind: 'refill', creditState: 'reserved' } }),
  ])
  for (const value of [totals, consumed, reserved]) if (value instanceof Error) throw value
  if ((totals._sum.quantityDispensed ?? 0) !== item.quantityDispensed || consumed !== item.refillsAuthorized - item.refillsRemaining || reserved !== item.refillsReserved) {
    throw new DomainError('Item counters disagree with immutable fill lineage; reconciliation is required')
  }
}
export function assertFillBinding(fill: any, p: any, item: any, clinical = true) {
  if (fill.prescription?.id !== p.id || fill.prescriptionItem?.id !== item?.id || fill.organization?.id !== p.organization.id
    || fill.location?.id !== p.location.id || fill.patient?.id !== p.patient.id || fill.itemVersion !== prescriptionItemVersion(p, item)) {
    throw new DomainError('Prescription item or patient changed; reconcile without rewriting history')
  }
  if (clinical) {
    if (fill.priceSnapshot?.taxRateBps !== p.organization.cashTaxRateBps || fill.priceSnapshot?.taxPolicyReference !== p.organization.cashTaxPolicyReference) throw new DomainError('Cash tax policy changed after reservation; explicit reconciliation is required')
    assertPrescriptionClinicallyEligible(p)
    assertPrescriptionItemProductIdentity(item)
    if (fill.authorityVersion !== prescriptionAuthorityVersion(p)) throw new DomainError('Prescriber/source/patient authority changed after reservation; fresh evidence is required')
  }
}
export async function appendFillEvent(context: Context, fill: any, input: { eventKey: string; fingerprint: string; action: string; actorId: string; approvalId?: string; quantity?: number; result: any; evidence?: any }) {
  const q = fillStore(context)
  await q.PrescriptionFillEvent.createOne({ data: { eventKey: input.eventKey, commandFingerprint: input.fingerprint,
    action: input.action, version: fill.version, quantity: input.quantity || 0, fill: connect(fill.id), prescription: connect(fill.prescription.id),
    actor: connect(input.actorId), approval: input.approvalId ? connect(input.approvalId) : undefined,
    result: input.result, evidence: { ...input.evidence, readBindingVersion: 1, purpose: 'prescription_fill_history',
      fillId: fill.id, prescriptionId: fill.prescription.id, prescriptionItemId: fill.prescriptionItem.id,
      organizationId: fill.organization.id, locationId: fill.location.id, patientId: fill.patient.id,
      actorId: input.actorId, refillRequestId: fill.refillRequest?.id || null, fillVersion: fill.version,
      itemVersion: fill.itemVersion, authorityVersion: fill.authorityVersion, policyVersion: fill.policySnapshot.version } } })
  await recordAuditAndOutbox(context, { eventKey: input.eventKey, organizationId: fill.organization.id, locationId: fill.location.id,
    actorId: input.actorId, patientId: fill.patient.id, eventType: `prescription_fill.${input.action}`, resourceType: 'PrescriptionFill', resourceId: fill.id,
    metadata: { fillId: fill.id, fillNumber: fill.fillNumber, version: fill.version, kind: fill.kind, creditState: fill.creditState,
      authorizedQuantity: fill.authorizedQuantity, quantityDispensed: fill.quantityDispensed, quantityReleased: fill.quantityReleased,
      approvalId: input.approvalId, commandFingerprint: input.fingerprint, ...input.evidence } })
}
export async function casFill(context: Context, fill: any, data: any) {
  // Only lifecycle counters/approval are mutable. Prisma CAS bypass is deliberate;
  // explicit authority, plan invariants and transaction-scoped append-only evidence surround it.
  const result = await (context.prisma as any).prescriptionFill.updateMany({ where: { id: fill.id, version: fill.version, status: fill.status }, data })
  if (result instanceof Error) throw result
  if (result.count !== 1) throw new DomainError('Fill version changed; refresh the workbench')
  return { ...fill, ...data }
}
/** Caller holds prescription+item locks and already proved patient/operator authority. */
export async function reserveFillInTransaction(context: Context, p: any, item: any, input: { kind: 'original' | 'refill'; actorId: string; key: string; fingerprint: string; expectedItemVersion?: string; refillRequestId?: string; approvalId?: string }) {
  const q = fillStore(context)
  if (p.items.length !== 1) throw new DomainError('Per-fill workflow requires one prescription item; multi-item authority is not inferred')
  if (item.fillLineage !== FILL_LINEAGE) throw new DomainError('Legacy item has no per-fill entitlement provenance; explicit reconciliation is required')
  assertPrescriptionClinicallyEligible(p)
  assertPrescriptionItemProductIdentity(item)
  await assertItemFillLedger(context, p, item)
  if (!input.expectedItemVersion || input.expectedItemVersion !== prescriptionItemVersion(p, item)) throw new DomainError('Prescription item version changed; refresh before reserving')
  const existing = await q.PrescriptionFill.findOne({ where: { reservationKey: input.key }, query: FILL_QUERY })
  if (existing) {
    assertFillBinding(existing, p, item)
    if (existing.requestFingerprint !== input.fingerprint) throw new DomainError('Fill reservation key is already bound to another request')
    return { fill: existing, reused: true }
  }
  if (await q.PrescriptionFill.findOne({ where: { openKey: `item:${item.id}` }, query: 'id' })) throw new DomainError('This item already has an open fill; recover or release that fill')
  if (!p.organization.prescriptionFillPolicy?.approvalId) throw new DomainError('Fill policy lacks recorded operator approval')
  if (p.organization.cashSalesEnabled !== true || !p.organization.cashTaxPolicyReference?.trim() || !p.organization.cashPolicyReviewedAt || !Number.isInteger(p.organization.cashTaxRateBps)) throw new DomainError('Reviewed cash/tax policy is required before fill reservation')
  if (item.product.currencyCode !== 'USD' || !Number.isSafeInteger(item.product.priceAmount) || item.product.priceAmount < 0) throw new DomainError('Fill price/currency requires bounded USD cash policy reconciliation')
  const cashPolicy = { taxRateBps: p.organization.cashTaxRateBps, policyReference: p.organization.cashTaxPolicyReference }
  const policySnapshot = { ...parseFillPolicy(p.organization.prescriptionFillPolicy), approvalId: p.organization.prescriptionFillPolicy.approvalId }
  if (!Number.isSafeInteger(item.quantityPrescribed) || item.quantityPrescribed < 1) throw new DomainError('Prescribed quantity requires reconciliation')
  let fillNumber = 1
  if (input.kind === 'original') {
    if (!['approved', 'fill_closed'].includes(p.status) || item.quantityDispensed !== 0 || item.refillsRemaining !== item.refillsAuthorized || item.refillsReserved !== 0) throw new DomainError('Original fill requires approved unused authority')
  } else {
    if (!['dispensed', 'fill_closed'].includes(p.status) || item.quantityDispensed < 1 || item.refillsRemaining - item.refillsReserved < 1) throw new DomainError('No unreserved refill entitlement is available')
    fillNumber = 2 + item.refillsAuthorized - item.refillsRemaining
    await context.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved + 1 } })
  }
  await context.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { activeFillNumber: fillNumber } })
  const fill = await q.PrescriptionFill.createOne({ data: { reservationKey: input.key, requestFingerprint: input.fingerprint,
    openKey: `item:${item.id}`, kind: input.kind, status: input.kind === 'original' ? 'approved' : 'requested', fillNumber,
    creditState: 'reserved', authorizedQuantity: item.quantityPrescribed, itemVersion: prescriptionItemVersion(p, item),
    authorityVersion: prescriptionAuthorityVersion(p), policySnapshot,
    priceSnapshot: { amount: item.product.priceAmount, currencyCode: item.product.currencyCode, taxable: item.product.taxable !== false, taxAmount: calculateTaxAmount(item.product.taxable !== false ? item.product.priceAmount : 0, cashPolicy.taxRateBps), taxRateBps: cashPolicy.taxRateBps, taxPolicyReference: cashPolicy.policyReference, title: item.product.title, sku: item.product.sku },
    expiresAt: new Date(Math.min(new Date(p.expiresAt).getTime(), Date.now() + policySnapshot.reservationMinutes * 60_000)).toISOString(),
    organization: connect(p.organization.id), location: connect(p.location.id), patient: connect(p.patient.id),
    prescription: connect(p.id), prescriptionItem: connect(item.id), reservedBy: connect(input.actorId),
    refillRequest: input.refillRequestId ? connect(input.refillRequestId) : undefined, approval: input.approvalId ? connect(input.approvalId) : undefined }, query: FILL_QUERY })
  await appendFillEvent(context, fill, { eventKey: `fill.reserved:${input.key}`, fingerprint: input.fingerprint, action: 'reserved', actorId: input.actorId, approvalId: input.approvalId, result: { fillId: fill.id, status: fill.status } })
  return { fill, reused: false }
}
export async function reservePharmacyPrescriptionFill(_root: unknown, args: { prescriptionId: string; prescriptionItemId: string; expectedItemVersion: string; idempotencyKey: string; reason: string; attested: boolean }, context: Context) {
  await currentFillPermission(context, 'canReviewPrescriptions')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `prescription-item:${args.prescriptionItemId}`, `fill-command:${args.idempotencyKey}`], async tx => {
    const p = await loadFillPrescription(tx, args.prescriptionId)
    const { userId } = await requireTenantMembership(tx, { organizationId: p.organization.id, locationId: p.location.id, pharmacist: true })
    await currentFillPermission(tx, 'canReviewPrescriptions')
    const item = p.items.find((i: any) => i.id === args.prescriptionItemId)
    if (!item) throw new DomainError('Prescription item not found')
    const fingerprint = fillHash({ ...args, actorId: userId })
    const existing = await fillStore(tx).PrescriptionFill.findOne({ where: { reservationKey: args.idempotencyKey }, query: FILL_QUERY })
    if (existing) {
      assertFillBinding(existing, p, item)
      await assertItemFillLedger(tx, p, item)
      if (existing.requestFingerprint !== fingerprint) throw new DomainError('Fill reservation key is already bound to another request')
      return { success: true, reused: true, fillId: existing.id, status: existing.status, version: existing.version }
    }
    const approval = await createHumanApproval(tx, { organizationId: p.organization.id, locationId: p.location.id, actorId: userId,
      actionType: 'prescription_review', reason: args.reason, attested: args.attested, evidence: { stage: 'fill_reservation', itemVersion: args.expectedItemVersion } })
    const { fill } = await reserveFillInTransaction(tx, p, item, { kind: 'original', actorId: userId, key: args.idempotencyKey, fingerprint, expectedItemVersion: args.expectedItemVersion, approvalId: approval.id })
    if (p.status === 'fill_closed') await tx.sudo().query.Prescription.updateOne({ where: { id: p.id }, data: { status: 'approved' } })
    return { success: true, reused: false, fillId: fill.id, status: fill.status, version: fill.version }
  })
}
export async function releasePharmacyPrescriptionFill(_root: unknown, args: { prescriptionId: string; fillId: string; expectedVersion: number; cause: string; idempotencyKey: string; reason: string; attested: boolean }, context: Context) {
  await currentFillPermission(context, 'canReviewPrescriptions')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill-command:${args.idempotencyKey}`], async tx => {
    const p = await loadFillPrescription(tx, args.prescriptionId)
    const { userId } = await requireTenantMembership(tx, { organizationId: p.organization.id, locationId: p.location.id, pharmacist: true })
    await currentFillPermission(tx, 'canReviewPrescriptions')
    const q = fillStore(tx), fill = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY })
    const item = p.items.find((i: any) => i.id === fill?.prescriptionItem?.id)
    if (!fill || !item) throw new DomainError('Fill not found')
    // Releasing unused authority is not clinical reauthorization. Expired or
    // revoked prescriber evidence may be recorded here; never used to dispense.
    assertFillBinding(fill, p, item, false)
    await assertItemFillLedger(tx, p, item)
    const fingerprint = fillHash({ ...args, actorId: userId })
    const eventKey = `fill.release:${args.idempotencyKey}`
    const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: 'id commandFingerprint result' })
    if (prior) {
      if (prior.commandFingerprint !== fingerprint) throw new DomainError('Fill release key is already bound to another request')
      return { ...prior.result, reused: true }
    }
    const plan = releaseFillPlan(fill, args.expectedVersion, args.cause)
    const approval = await createHumanApproval(tx, { organizationId: p.organization.id, locationId: p.location.id, actorId: userId,
      actionType: 'prescription_review', reason: args.reason, attested: args.attested, evidence: { stage: 'fill_release', fillId: fill.id, cause: args.cause, entitlementRestored: false, inventoryRestocked: false } })
    if (plan.releaseRefill) {
      if (item.refillsReserved < 1) throw new DomainError('Refill reservation counter requires reconciliation')
      await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1 } })
    }
    const { releaseRefill, ...data } = plan
    const updated = await casFill(tx, fill, { ...data, openKey: null })
    if (fill.refillRequest?.id) await tx.sudo().query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: 'cancelled', openRequestKey: null, resolutionNote: args.reason, resolvedAt: new Date().toISOString() } })
    // Requested refills never advanced prescription state. Do not mark a partial
    // fill dispensed, or auto-reopen/restore a consumed refill.
    if (fill.status !== 'requested') await tx.sudo().query.Prescription.updateOne({ where: { id: p.id }, data: { status: 'fill_closed' } })
    const result = { success: true, reused: false, fillId: fill.id, status: 'released', version: updated.version }
    await appendFillEvent(tx, updated, { eventKey, fingerprint, action: 'released', actorId: userId, approvalId: approval.id, quantity: plan.quantityReleased, result,
      evidence: { cause: args.cause, inventoryRestocked: false, entitlementConsumed: plan.creditState === 'consumed' } })
    return result
  })
}
/** Runs inside the existing stock/cash/label transaction, never as a second transaction. */
export async function consumeFillInTransaction(tx: Context, fill: any, item: any, expectedVersion: number, quantity: number, input: { key: string; fingerprint: string; actorId: string; approvalId: string; result: any; movementId: string; safetyReviewId: string }) {
  const plan = dispenseFillPlan(fill, expectedVersion, quantity)
  if (plan.debitRefill) {
    if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new DomainError('Refill reservation evidence requires reconciliation')
    await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1, refillsRemaining: item.refillsRemaining - 1 } })
  }
  const { debitRefill, ...data } = plan
  const updated = await casFill(tx, fill, { ...data, ...(plan.status === 'dispensed' ? { openKey: null } : {}) })
  await appendFillEvent(tx, updated, { eventKey: `fill.dispense:${input.key}`, fingerprint: input.fingerprint, action: 'dispensed', actorId: input.actorId,
    approvalId: input.approvalId, quantity, result: input.result, evidence: { movementId: input.movementId, clinicalSafetyReviewId: input.safetyReviewId } })
  return updated
}
export async function pharmacyFillPolicy(_root: unknown, args: { organizationId: string }, context: Context) {
  await currentFillPermission(context, 'canManageOrganizations')
  await currentFillPermission(context, 'canApproveConsequentialActions')
  await requireTenantMembership(context, { organizationId: args.organizationId, organizationWide: true, pharmacist: true })
  const organization: any = await context.sudo().query.Organization.findOne({ where: { id: args.organizationId }, query: 'id prescriptionFillPolicy' })
  if (!organization) throw new DomainError('Organization not found')
  return { organizationId: organization.id, configured: Boolean(organization.prescriptionFillPolicy?.approvalId), version: organization.prescriptionFillPolicy?.version || null }
}
export async function recordPharmacyFillPolicy(_root: unknown, args: { organizationId: string; policy: any; idempotencyKey: string; reason: string; attested: boolean }, context: Context) {
  await currentFillPermission(context, 'canManageOrganizations')
  await currentFillPermission(context, 'canApproveConsequentialActions')
  const policy = parseFillPolicy(args.policy)
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  return withDomainTransaction(context, [`fill-policy:${args.organizationId}`, `fill-policy-command:${args.idempotencyKey}`], async tx => {
    const { userId } = await requireTenantMembership(tx, { organizationId: args.organizationId, organizationWide: true, pharmacist: true })
    await currentFillPermission(tx, 'canManageOrganizations')
    await currentFillPermission(tx, 'canApproveConsequentialActions')
    const fingerprint = fillHash({ ...args, policy, actorId: userId }), eventKey = `fill.policy:${args.idempotencyKey}`
    const prior = await tx.sudo().query.AuditEvent.findOne({ where: { eventKey }, query: 'id metadata' })
    if (prior) {
      if ((prior as any).metadata?.commandFingerprint !== fingerprint) throw new DomainError('Policy key is already bound to another request')
      return { success: true, reused: true, status: 'configured' }
    }
    const organization: any = await tx.sudo().query.Organization.findOne({ where: { id: args.organizationId }, query: 'id prescriptionFillPolicy' })
    if (organization.prescriptionFillPolicy?.version === policy.version && fillHash(parseFillPolicy(organization.prescriptionFillPolicy)) !== fillHash(policy)) throw new DomainError('Changed policy requires a new version')
    const approval = await createHumanApproval(tx, { organizationId: args.organizationId, actorId: userId, actionType: 'prescription_review', reason: args.reason,
      attested: args.attested, evidence: { stage: 'fill_policy', policy, clinicalValidityClaimed: false, nonRetroactive: true } })
    await tx.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { prescriptionFillPolicy: { ...policy, approvalId: approval.id } } as any })
    await recordAuditAndOutbox(tx, { eventKey, organizationId: args.organizationId, actorId: userId, eventType: 'prescription_fill.policy_recorded', resourceType: 'Organization', resourceId: args.organizationId,
      metadata: { policy, approvalId: approval.id, commandFingerprint: fingerprint, nonRetroactive: true } })
    return { success: true, reused: false, status: 'configured' }
  })
}
