import { createHash } from 'node:crypto'
import type { Context } from '.keystone/types'
import { assertCurrentHumanSafetyReview, assertDrugReferenceEligibleForBoundedDispensing, currentFillNumber } from '../workflows/clinical-safety'
import { assertCashTender, calculateTaxAmount } from '../workflows/commerce-policy'
import { assertPrescriptionTransition } from '../workflows/pharmacy-state'
import { isLotEligible } from '../workflows/lot-eligibility'
import { assertPrescriptionItemProductIdentity } from '../workflows/clinical-safety'
import { assertPrescriptionClinicallyEligible } from '../workflows/prescription-eligibility'
import { requirePermission, requireTenantMembership } from './lib/authorization'
import { createHumanApproval, recordAuditAndOutbox } from './lib/evidence'
import { acquireTransactionLocks, withDomainTransaction } from './lib/transaction'
import { assertItemFillLedger, assertFillBinding, consumeFillInTransaction, currentFillPermission, FILL_QUERY, fillStore, loadFillPrescription } from './fillWorkflows'
import { FILL_LINEAGE, dispenseFillPlan, fillHash, fillPricePortion, pickupFillPlan, returnToStockPlan } from '../workflows/fill-entitlement'
import { appendFillEvent, applyFillReleaseInTransaction, casFill } from './fillWorkflows'
import { DomainError } from './lib/errors'
import { productPhotoSnapshot } from '../lib/product-photo'
import { notifyPrescriptionReady } from './pickupNotice'
import { assertCounterCardCovers, openCounterCardIntent, refundRefusedCounterCard, verifyCounterCardIntent, type VerifiedCounterCard } from './counterCard'

const CLINICAL_QUERY = 'sourceVerificationStatus writtenAt expiresAt prescriber { npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } }'
const SAFETY_QUERY = `
  patient { id displayName identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { in: ["active", "none_known"] } }) { id updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id updatedAt } }
  safetyReviews(orderBy: { reviewedAt: desc }, take: 1) {
    id fillNumber outcome allergiesReviewed medicationHistoryReviewed interactionsReviewed duplicateTherapyReviewed contraindicationsReviewed doseReviewed counselingPlanReviewed reviewReference overrideReason reviewedAt evidenceSnapshot
  }
`

async function assertPrescriptionSafetyEvidence(context: Context, prescription: any, fillSpecific = false) {
  if (prescription.patient?.identityVerificationStatus !== 'confirmed' || !prescription.patient?.identityReference?.trim() || !prescription.patient?.identityVerifiedAt || !prescription.patient?.identityVerifiedBy?.id) {
    throw new DomainError('Current operator-recorded patient identity evidence is required')
  }
  if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new DomainError('Explicit allergy and medication history evidence is required for this fill')
  const fillNumbers = prescription.items.map((item: any) => currentFillNumber(item))
  const fillNumber = Math.max(...fillNumbers)
  if (!fillNumbers.length || fillNumbers.some((value: number) => value !== fillNumber)) throw new DomainError('Prescription items are not aligned to one fill review')
  const latestPatientChange = [...(prescription.patient?.allergies || []), ...(prescription.patient?.medications || []), { updatedAt: prescription.patient.identityVerifiedAt }]
    .map((entry: any) => entry.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1)
  const review = prescription.safetyReviews?.[0]
  if (fillSpecific && prescription.items.some((item: any) => item.fillLineage === FILL_LINEAGE)) {
    const fills = await fillStore(context).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY })
    const fill = fills[0], evidence = review?.evidenceSnapshot
    if (fills.length !== 1 || !fill || evidence?.fillId !== fill.id || evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || new Date(review.reviewedAt).getTime() < new Date(fill.createdAt).getTime()) throw new DomainError('A versioned human safety review for this exact fill reservation is required')
  }
  assertCurrentHumanSafetyReview(review, fillNumber, latestPatientChange)
  const drugReferenceIds = [...new Set(prescription.items.map((item: any) => item.drugReference?.id).filter(Boolean))] as string[]
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } },
    take: 100,
    query: 'id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt',
  })
  if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new DomainError('Current drug reference review evidence is required')
  for (const drugReview of drugReviews) {
    assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: drugReview.status === 'active', marketingStatus: drugReview.marketingStatusSnapshot, controlledSchedule: drugReview.controlledScheduleSnapshot, sourceName: drugReview.sourceName, sourceVersion: drugReview.sourceVersion, sourceReference: drugReview.sourceReference, reviewedAt: drugReview.reviewedAt })
    if (new Date(drugReview.reviewedAt).getTime() > new Date(review.reviewedAt).getTime()) throw new DomainError('Drug reference evidence changed after the clinical safety review')
  }
  return review
}

export async function recordPrescriptionReview(
  _root: unknown,
  args: { prescriptionId: string; decision: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canReviewPrescriptions')
  if (!['approved', 'needs_information', 'rejected'].includes(args.decision)) throw new DomainError('Invalid review decision')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision reason approval { id reason } }`,
    })
    if (!prescription) throw new DomainError('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    const prior = prescription.reviews?.[0]
    if (prescription.status === args.decision && prior?.decision === args.decision && (prior.reason !== args.reason || prior.approval?.reason !== args.reason)) throw new DomainError('Prescription review replay does not match the recorded reason')
    if (prescription.status === args.decision && prior?.decision === args.decision) {
      return { success: true, reused: true, prescriptionId: prescription.id, reviewId: prior.id, approvalId: prior.approval?.id, status: args.decision }
    }
    if (args.decision === 'approved') {
      assertPrescriptionClinicallyEligible(prescription)
      await assertPrescriptionSafetyEvidence(transactionContext, prescription)
    }
    assertPrescriptionTransition(prescription.status, args.decision)

    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'prescription_review',
      reason: args.reason,
      attested: args.attested,
      evidence: { decision: args.decision, priorStatus: prescription.status },
    })
    const review = await sudo.query.PrescriptionReview.createOne({
      data: {
        decision: args.decision,
        reason: args.reason,
        humanAttested: true,
        prescription: { connect: { id: prescription.id } },
        patient: { connect: { id: prescription.patient.id } },
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id decision reviewedAt',
    })
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: {
        status: args.decision,
        approval: { connect: { id: approval.id } },
        ...(args.decision === 'approved' ? { approvedAt: new Date().toISOString() } : {}),
      },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.reviewed:${prescription.id}:${review.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: 'prescription.reviewed',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { decision: args.decision, reviewId: review.id, approvalId: approval.id },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, reviewId: review.id, approvalId: approval.id, status: args.decision }
  })
}

export async function authorizePrescriptionDispensing(
  _root: unknown,
  args: { prescriptionId: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canDispenseMedications')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } approval { id reason actionType } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision }`,
    })
    if (!prescription) throw new DomainError('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    if (prescription.items.some((item: any) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, 'canDispenseMedications')
      const current = await loadFillPrescription(transactionContext, prescription.id)
      const fills = await fillStore(transactionContext).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY })
      if (fills.length !== 1 || current.items.length !== 1) throw new DomainError('Exactly one current item/fill is required')
      const fill = fills[0]
      const item = current.items.find((entry: any) => entry.id === fill?.prescriptionItem?.id)
      if (!fill || !item || !['approved', 'partially_dispensed'].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new DomainError('An approved current fill reservation is required')
      assertFillBinding(fill, current, item)
      await assertItemFillLedger(transactionContext, current, item)
      await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    }
    if (prescription.status === 'ready_to_dispense' && prescription.approval?.id && (prescription.approval.actionType !== 'dispense' || prescription.approval.reason !== args.reason)) throw new DomainError('Dispensing authorization replay does not match the recorded reason')
    if (prescription.status === 'ready_to_dispense' && prescription.approval?.id) {
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: prescription.approval.id }
    }
    assertPrescriptionClinicallyEligible(prescription)
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    if (!prescription.reviews?.some((review: any) => review.decision === 'approved')) throw new DomainError('Approved pharmacist review required')
    assertPrescriptionTransition(prescription.status, 'ready_to_dispense')
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'dispense',
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: 'ready_to_dispense', reviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id },
    })
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: 'ready_to_dispense', approval: { connect: { id: approval.id } } },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.dispensing_authorized:${prescription.id}:${approval.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: 'prescription.dispensing_authorized',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { approvalId: approval.id, reviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, status: 'ready_to_dispense', approvalId: approval.id }
  })
}

/**
 * The sale half of a cash prescription pickup: tender approval, Order, line item,
 * captured cash Payment and handed-off Fulfillment. Shared by direct dispensing
 * and will-call pickup so both produce identical sale evidence.
 */
async function createCashPickupSale(tx: Context, s: { prescription: any; item: any; fill: any; userId: string; reason: string; attested: boolean; idempotencyKey: string; operationSuffix: string; at: string;
  dispenseApprovalId: string; clinicalSafetyReviewId: string; pharmacistReviewId?: string; fillNumber: number; readyAt?: string; quantity: number; lot: any;
  subtotalAmount: number; taxableSubtotalAmount: number; taxAmount: number; totalAmount: number; currencyCode: string; tender: { cashReceivedAmount: number; changeDueAmount: number }; card?: VerifiedCounterCard | null }) {
  const sudo = tx.sudo()
  const { subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, currencyCode } = s
  const cashApproval = await createHumanApproval(tx, {
    organizationId: s.prescription.organization.id,
    locationId: s.prescription.location.id,
    actorId: s.userId,
    actionType: s.card ? 'card_tender' : 'cash_tender',
    reason: s.reason,
    attested: s.attested,
    evidence: { subtotalAmount, taxableSubtotalAmount, taxAmount, amountDue: totalAmount, ...(s.card ? { paymentIntentId: s.card.paymentIntentId } : { cashReceivedAmount: s.tender.cashReceivedAmount, changeDueAmount: s.tender.changeDueAmount }), taxRateBps: s.prescription.organization.cashTaxRateBps || 0, taxPolicyReference: s.prescription.organization.cashTaxPolicyReference, providerSettlementClaimed: !!s.card },
  })
  const order = await sudo.query.Order.createOne({
    data: {
      orderNumber: `RX-${s.operationSuffix}`,
      idempotencyKey: `rx-cash:${s.idempotencyKey}`,
      checkoutEvidence: { workflow: s.card ? 'prescription_pickup_card' : 'operator_attested_cash_prescription_pickup', pharmacistReviewId: s.pharmacistReviewId ?? null, clinicalSafetyReviewId: s.clinicalSafetyReviewId, dispenseApprovalId: s.dispenseApprovalId, cashApprovalId: cashApproval.id, taxRateBps: s.prescription.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: !!s.card },
      status: 'completed',
      fulfillmentMethod: 'pickup',
      subtotalAmount,
      taxAmount,
      deliveryAmount: 0,
      totalAmount,
      currencyCode,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      patient: { connect: { id: s.prescription.patient.id } },
      prescription: { connect: { id: s.prescription.id } },
      approval: { connect: { id: cashApproval.id } },
    },
    query: 'id orderNumber',
  })
  await sudo.query.OrderLineItem.createOne({
    data: {
      title: s.fill ? s.fill.priceSnapshot.title : s.item.product.title,
      sku: s.fill ? s.fill.priceSnapshot.sku : s.item.product.sku,
      ndc11Snapshot: s.item.product.drugReference?.ndc11 || undefined,
      quantity: 1,
      unitPriceAmount: subtotalAmount,
      lineTotalAmount: subtotalAmount,
      imageUrl: productPhotoSnapshot(s.item.product),
      prescriptionRequirementSnapshot: s.item.product.prescriptionRequirement,
      metadata: { dispensedUnits: s.quantity, prescriptionItemId: s.item.id, fillId: s.fill?.id || null, fillNumber: s.fillNumber, taxable: s.item.product.taxable !== false, taxableAmount: taxableSubtotalAmount },
      lotAllocationSnapshot: [{ lotId: s.lot.id, lotNumber: s.lot.lotNumber, quantity: s.quantity, expirationDate: s.lot.expirationDate }],
      order: { connect: { id: order.id } },
      product: { connect: { id: s.item.product.id } },
    },
  })
  const payment = await sudo.query.Payment.createOne({
    data: {
      amount: totalAmount,
      currencyCode,
      status: 'captured',
      ...(s.card
        ? { tenderMethod: 'provider', externalPaymentId: s.card.paymentIntentId, provider: { connect: { id: s.card.providerId } }, data: { evidenceType: 'stripe_payment_intent_succeeded', approvalId: cashApproval.id, providerSettlementClaimed: true, brand: s.card.brand, last4: s.card.last4 } }
        : { tenderMethod: 'cash', cashReceivedAmount: s.tender.cashReceivedAmount, changeDueAmount: s.tender.changeDueAmount, data: { evidenceType: 'operator_attested_cash_received', approvalId: cashApproval.id, providerSettlementClaimed: false } }),
      processedAt: s.at,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      order: { connect: { id: order.id } },
      recordedBy: { connect: { id: s.userId } },
      approval: { connect: { id: cashApproval.id } },
    },
    query: 'id status',
  })
  await sudo.query.Fulfillment.createOne({
    data: {
      method: 'pickup',
      status: 'handed_off',
      readyAt: s.readyAt || s.at,
      handedOffAt: s.at,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      order: { connect: { id: order.id } },
      assignedTo: { connect: { id: s.userId } },
    },
  })
  return { order, payment, cashApproval }
}

export async function recordPrescriptionDispensing(
  _root: unknown,
  args: { prescriptionId: string; prescriptionItemId: string; lotId: string; quantity: number; cashReceivedAmount: number; auxiliaryWarnings: string[]; counselingOutcome: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null; hold?: boolean | null },
  context: Context,
) {
  requirePermission(context, 'canDispenseMedications')
  // hold: fill into the will-call bin (label, stock out, refill consumed) without a sale; pickup records the sale later.
  const hold = args.hold === true
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new DomainError('Dispensed quantity must be a positive integer')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  if (!['offered_accepted', 'offered_declined'].includes(args.counselingOutcome)) throw new DomainError('Counseling offer outcome must be recorded')
  const auxiliaryWarnings = [...new Set((args.auxiliaryWarnings || []).map((value) => value.trim()).filter(Boolean))]
  if (!auxiliaryWarnings.length || auxiliaryWarnings.length > 20 || auxiliaryWarnings.some((value) => value.length > 200)) throw new DomainError('Auxiliary warning evidence is invalid')
  const result = await recordDispensingInTransaction(args, auxiliaryWarnings, hold, context)
  // Filled into will-call: tell the patient it is ready (once per fill, after commit).
  if (hold && args.fillId && result?.status === 'ready_for_pickup') await notifyPrescriptionReady(context, { prescriptionId: args.prescriptionId, fillId: args.fillId })
  return result
}

async function recordDispensingInTransaction(
  args: { prescriptionId: string; prescriptionItemId: string; lotId: string; quantity: number; cashReceivedAmount: number; auxiliaryWarnings: string[]; counselingOutcome: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null; hold?: boolean | null },
  auxiliaryWarnings: string[],
  hold: boolean,
  context: Context,
): Promise<any> {
  return withDomainTransaction(context, [
    `dispense:${args.idempotencyKey}`,
    `lot:${args.lotId}`,
    `prescription:${args.prescriptionId}`,
    `prescription-item:${args.prescriptionItemId}`,
  ], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const existingMovement = await sudo.query.InventoryMovement.findOne({
      where: { idempotencyKey: `dispense:${args.idempotencyKey}` },
      query: 'id requestFingerprint approval { id } order { id orderNumber totalAmount currencyCode payments { id status amount cashReceivedAmount changeDueAmount } lineItems { title } dispensingLabels { id } }',
    })

    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `
        id status ${CLINICAL_QUERY} ${SAFETY_QUERY}
        organization { id operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }
        location { id name address phone }
        prescriber { name npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference }
        approval { id }
        items { id fillLineage activeFillNumber refillsReserved medicationNameSnapshot sig quantityPrescribed quantityDispensed refillsAuthorized refillsRemaining product { id title sku priceAmount currencyCode taxable imageUrl image { id extension } prescriptionRequirement drugReference { id ndc11 } } drugReference { id ndc11 } }
        reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }
      `,
    })
    if (!prescription) throw new DomainError('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    const item = prescription.items.find((entry: any) => entry.id === args.prescriptionItemId)
    if (!item) throw new DomainError('Prescription item does not belong to this prescription')
    let fill: any = null
    if (item.fillLineage === FILL_LINEAGE) {
      await currentFillPermission(transactionContext, 'canDispenseMedications')
      const current = await loadFillPrescription(transactionContext, prescription.id)
      fill = args.fillId ? await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY }) : null
      if (!fill || !Number.isSafeInteger(args.expectedFillVersion)) throw new DomainError('Fill identity and expected version are required')
      const currentItem = current.items.find((entry: any) => entry.id === item.id)
      assertFillBinding(fill, current, currentItem)
      await assertItemFillLedger(transactionContext, current, currentItem)
    }
    const requestFingerprint = createHash('sha256').update(JSON.stringify({
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      prescriptionId: prescription.id,
      prescriptionItemId: item.id,
      lotId: args.lotId,
      quantity: args.quantity,
      cashReceivedAmount: args.cashReceivedAmount,
      auxiliaryWarnings,
      counselingOutcome: args.counselingOutcome,
      reason: args.reason.trim(),
      attested: args.attested,
      ...(fill ? { fillId: fill.id, expectedFillVersion: args.expectedFillVersion, itemVersion: fill.itemVersion } : {}),
      ...(hold ? { hold } : {}),
    })).digest('hex')
    if (existingMovement) {
      if (!existingMovement.requestFingerprint || existingMovement.requestFingerprint !== requestFingerprint) {
        throw new DomainError('Dispensing idempotency key is already bound to another operation')
      }
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: existingMovement.approval?.id, orderId: existingMovement.order?.id, orderNumber: existingMovement.order?.orderNumber, receiptItemTitle: existingMovement.order?.lineItems?.[0]?.title, paymentId: existingMovement.order?.payments?.[0]?.id, labelId: existingMovement.order?.dispensingLabels?.[0]?.id, totalAmount: existingMovement.order?.totalAmount, cashReceivedAmount: existingMovement.order?.payments?.[0]?.cashReceivedAmount, changeDueAmount: existingMovement.order?.payments?.[0]?.changeDueAmount, currencyCode: existingMovement.order?.currencyCode }
    }
    assertPrescriptionItemProductIdentity(item)
    assertPrescriptionClinicallyEligible(prescription)
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    if (!['ready_to_dispense', 'partially_dispensed'].includes(prescription.status) || !prescription.approval || !prescription.reviews?.length) {
      throw new DomainError('Prescription is not authorized for dispensing')
    }
    if (hold && !fill) throw new DomainError('Will-call holds require a per-fill reservation')
    const fillPlan = fill ? dispenseFillPlan(fill, args.expectedFillVersion!, args.quantity, Date.now(), hold) : null
    const authorizedFills = 1 + item.refillsAuthorized - item.refillsRemaining
    const authorizedQuantity = item.quantityPrescribed * authorizedFills
    const remainingAuthorizedQuantity = fill ? fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased : authorizedQuantity - item.quantityDispensed
    if (args.quantity > remainingAuthorizedQuantity) throw new DomainError('Dispensed quantity exceeds the remaining authorized quantity')
    if (prescription.items.length !== 1 || (!fill && (remainingAuthorizedQuantity !== item.quantityPrescribed || args.quantity !== item.quantityPrescribed))) {
      throw new DomainError('Dispense one complete prescription item per cash pickup; partial and multi-item dispensing are not supported')
    }
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) {
      throw new DomainError('Operator-attested cash and tax policy must be configured before dispensing')
    }
    const currencyCode = fill ? fill.priceSnapshot.currencyCode : item.product.currencyCode
    const subtotalAmount = fill ? fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : item.product.priceAmount
    const taxable = fill ? fill.priceSnapshot.taxable : item.product.taxable !== false
    const taxableSubtotalAmount = taxable ? subtotalAmount : 0
    const taxAmount = fill ? fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : calculateTaxAmount(taxableSubtotalAmount, prescription.organization.cashTaxRateBps || 0)
    const totalAmount = subtotalAmount + taxAmount
    const tender = hold ? null : assertCashTender(totalAmount, args.cashReceivedAmount)

    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: 'id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } product { id } location { id }',
    })
    if (!lot || lot.location.id !== prescription.location.id || lot.product.id !== item.product?.id) throw new DomainError('Inventory lot does not match this prescription item and location')
    if (!isLotEligible(lot) || lot.quantityAvailable - lot.quantityQuarantined < args.quantity) throw new DomainError('Inventory lot is not eligible for dispensing')

    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'dispense',
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill?.version || null, itemVersion: fill?.itemVersion || null, lotId: lot.id, quantity: args.quantity, pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, idempotencyKey: args.idempotencyKey },
    })
    const operationSuffix = createHash('sha256').update(args.idempotencyKey).digest('hex').slice(0, 12).toUpperCase()
    const dispensedAt = new Date().toISOString()
    const sale = tender ? await createCashPickupSale(transactionContext, {
      prescription, item, fill, userId, reason: args.reason, attested: args.attested, idempotencyKey: args.idempotencyKey, operationSuffix, at: dispensedAt,
      dispenseApprovalId: approval.id, clinicalSafetyReviewId: safetyReview.id, pharmacistReviewId: prescription.reviews[0].id, fillNumber: safetyReview.fillNumber, quantity: args.quantity, lot,
      subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, currencyCode, tender,
    }) : null
    const label = await sudo.query.DispensingLabel.createOne({
      data: {
        labelNumber: `LBL-${operationSuffix}`,
        fillNumber: safetyReview.fillNumber,
        operatorNameSnapshot: prescription.organization.operatorDisplayName,
        operatorPhoneSnapshot: prescription.organization.supportPhone || prescription.location.phone || undefined,
        locationNameSnapshot: prescription.location.name,
        locationAddressSnapshot: prescription.location.address || undefined,
        patientNameSnapshot: prescription.patient.displayName,
        prescriberNameSnapshot: prescription.prescriber.name,
        medicationNameSnapshot: item.medicationNameSnapshot,
        sigSnapshot: item.sig,
        quantityDispensed: args.quantity,
        lotNumberSnapshot: lot.lotNumber,
        ndc11Snapshot: item.product.drugReference?.ndc11 || undefined,
        expirationDateSnapshot: lot.expirationDate,
        auxiliaryWarnings,
        counselingOutcome: args.counselingOutcome,
        dispensedAt,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        ...(sale ? { order: { connect: { id: sale.order.id } } } : {}),
        ...(fill ? { fill: { connect: { id: fill.id } } } : {}),
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id labelNumber',
    })
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      data: { quantityAvailable: lot.quantityAvailable - args.quantity, ...(lot.quantityAvailable - args.quantity === 0 ? { status: 'depleted' } : {}) },
    })
    await sudo.query.PrescriptionItem.updateOne({
      where: { id: item.id },
      data: { quantityDispensed: item.quantityDispensed + args.quantity },
    })
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: 'dispense',
        quantityDelta: -args.quantity,
        reason: args.reason,
        idempotencyKey: `dispense:${args.idempotencyKey}`,
        requestFingerprint,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        ...(sale ? { order: { connect: { id: sale.order.id } } } : {}),
        approval: { connect: { id: approval.id } },
      },
      query: 'id',
    })
    const order = sale?.order, payment = sale?.payment, cashApproval = sale?.cashApproval
    if (fill) {
      const result = { success: true, reused: false, prescriptionId: prescription.id, status: fillPlan!.status, approvalId: approval.id, orderId: order?.id ?? null, orderNumber: order?.orderNumber ?? null, receiptItemTitle: item.product.title, paymentId: payment?.id ?? null, labelId: label.id, totalAmount, cashReceivedAmount: tender?.cashReceivedAmount ?? null, changeDueAmount: tender?.changeDueAmount ?? null, currencyCode }
      await consumeFillInTransaction(transactionContext, fill, item, args.expectedFillVersion!, args.quantity, { key: args.idempotencyKey, fingerprint: requestFingerprint, actorId: userId, approvalId: approval.id, result, movementId: movement.id, safetyReviewId: safetyReview.id, hold })
      if (fillPlan!.status === 'dispensed' && fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: 'fulfilled', openRequestKey: null } })
    }
    const allCurrentFillsComplete = fill ? fillPlan!.status === 'dispensed' : prescription.items.every((entry: any) => {
      const nextDispensed = entry.id === item.id ? entry.quantityDispensed + args.quantity : entry.quantityDispensed
      const entryAuthorizedQuantity = entry.quantityPrescribed * (1 + entry.refillsAuthorized - entry.refillsRemaining)
      return nextDispensed >= entryAuthorizedQuantity
    })
    const nextStatus = hold ? 'ready_for_pickup' : allCurrentFillsComplete ? 'dispensed' : 'partially_dispensed'
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: nextStatus, ...(allCurrentFillsComplete && !hold ? { dispensedAt: new Date().toISOString() } : {}), approval: { connect: { id: approval.id } } },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.dispensed:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: hold ? 'prescription.filled_for_pickup' : allCurrentFillsComplete ? 'prescription.dispensed' : 'prescription.partially_dispensed',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill ? fill.version + 1 : null, lotId: lot.id, quantity: args.quantity, quantityDispensed: item.quantityDispensed + args.quantity, movementId: movement.id, orderId: order?.id ?? null, paymentId: payment?.id ?? null, labelId: label.id, approvalId: approval.id, cashApprovalId: cashApproval?.id ?? null, willCall: hold, clinicalSafetyReviewId: safetyReview.id, subtotalAmount, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, status: nextStatus, approvalId: approval.id, orderId: order?.id ?? null, orderNumber: order?.orderNumber ?? null, receiptItemTitle: item.product.title, paymentId: payment?.id ?? null, labelId: label.id, totalAmount, cashReceivedAmount: tender?.cashReceivedAmount ?? null, changeDueAmount: tender?.changeDueAmount ?? null, currencyCode }
  })
}


/** The will-call fill's own labelling evidence: its active label and the stock movement that filled it. */
async function loadWillCallEvidence(tx: Context, fill: any) {
  const sudo = tx.sudo()
  const [label] = await sudo.query.DispensingLabel.findMany({ where: { fill: { id: { equals: fill.id } }, voidedAt: { equals: null } }, take: 1, query: 'id labelNumber dispensedAt' })
  const [filled] = await fillStore(tx).PrescriptionFillEvent.findMany({ where: { fill: { id: { equals: fill.id } }, action: { equals: 'filled' } }, orderBy: [{ createdAt: 'desc' }], take: 1, query: 'id evidence' })
  const movementId = filled?.evidence?.movementId
  const movement = movementId ? await sudo.query.InventoryMovement.findOne({ where: { id: movementId }, query: 'id movementType quantityDelta lot { id lotNumber expirationDate status quantityAvailable } product { id }' }) : null
  if (!label || !movement || movement.movementType !== 'dispense' || -movement.quantityDelta !== fill.quantityDispensed) throw new DomainError('Will-call label and stock evidence require reconciliation')
  return { label, movement, lot: movement.lot }
}

/**
 * Pickup at the counter: the sale/handoff for a fill already in the will-call bin.
 * Records the same Order, Payment and handed-off Fulfillment as direct dispensing.
 */
/** Amount due at the will-call counter for a ready fill: the fill's own price snapshot, as pickup records it. */
function willCallAmountDue(fill: any) {
  const subtotalAmount = fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, 0, fill.authorizedQuantity)
  const taxAmount = fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, 0, fill.authorizedQuantity)
  return { subtotalAmount, taxAmount, totalAmount: subtotalAmount + taxAmount, currencyCode: fill.priceSnapshot.currencyCode as string }
}

/** Opens the Stripe card payment for a will-call pickup, for exactly the amount pickup will record. */
export async function openPrescriptionPickupCardPayment(
  _root: unknown,
  args: { prescriptionId: string; fillId: string; idempotencyKey: string },
  context: Context,
) {
  requirePermission(context, 'canDispenseMedications')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  const sudo = context.sudo()
  const prescription = await sudo.query.Prescription.findOne({ where: { id: args.prescriptionId }, query: 'id status organization { id } location { id }' })
  if (!prescription) throw new DomainError('Prescription not found')
  await requireTenantMembership(context, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true })
  if (prescription.status !== 'ready_for_pickup') throw new DomainError('Prescription is not waiting for pickup')
  const fill = await fillStore(context).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY })
  if (!fill || fill.prescription?.id !== prescription.id || fill.status !== 'ready') throw new DomainError('Fill is not in will-call')
  const due = willCallAmountDue(fill)
  return openCounterCardIntent(context, { organizationId: prescription.organization.id, scope: 'rx', idempotencyKey: args.idempotencyKey, amount: due.totalAmount, currencyCode: due.currencyCode })
}

export async function pickupPrescriptionFill(
  _root: unknown,
  args: { prescriptionId: string; fillId: string; expectedFillVersion: number; cashReceivedAmount: number; idempotencyKey: string; reason: string; attested: boolean; tenderMethod?: string | null; paymentIntentId?: string | null },
  context: Context,
) {
  requirePermission(context, 'canDispenseMedications')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  if (args.tenderMethod && !['cash', 'card'].includes(args.tenderMethod)) throw new DomainError('Tender must be cash or card')
  let card: VerifiedCounterCard | null = null
  if (args.tenderMethod === 'card') {
    const scope = await context.sudo().query.Prescription.findOne({ where: { id: args.prescriptionId }, query: 'id organization { id } location { id }' })
    if (!scope) throw new DomainError('Prescription not found')
    await requireTenantMembership(context, { organizationId: scope.organization.id, locationId: scope.location.id, pharmacist: true })
    card = await verifyCounterCardIntent(context, { organizationId: scope.organization.id, scope: 'rx', idempotencyKey: args.idempotencyKey, paymentIntentId: args.paymentIntentId || '' })
  }
  try {
    return await recordWillCallPickup(args, context, card)
  } catch (error) {
    throw await refundRefusedCounterCard(context, card, error, async () => !!(await fillStore(context).PrescriptionFillEvent.findOne({ where: { eventKey: `fill.pickup:${args.idempotencyKey}` }, query: 'id' })))
  }
}

async function recordWillCallPickup(
  args: { prescriptionId: string; fillId: string; expectedFillVersion: number; cashReceivedAmount: number; idempotencyKey: string; reason: string; attested: boolean; tenderMethod?: string | null; paymentIntentId?: string | null },
  context: Context,
  card: VerifiedCounterCard | null,
) {
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill:${args.fillId}`, `fill-command:${args.idempotencyKey}`], async tx => {
    const sudo = tx.sudo()
    const prescription = await sudo.query.Prescription.findOne({ where: { id: args.prescriptionId }, query: `id status ${SAFETY_QUERY}
      organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt } location { id }
      items { id product { id title sku taxable imageUrl image { id extension } prescriptionRequirement drugReference { ndc11 } } }
      reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }` })
    if (!prescription) throw new DomainError('Prescription not found')
    const { userId } = await requireTenantMembership(tx, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true })
    await currentFillPermission(tx, 'canDispenseMedications')
    const current = await loadFillPrescription(tx, prescription.id)
    const fill = await fillStore(tx).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY })
    const currentItem = current.items.find((entry: any) => entry.id === fill?.prescriptionItem?.id)
    const item = prescription.items.find((entry: any) => entry.id === currentItem?.id)
    if (!fill || !currentItem || !item) throw new DomainError('Fill not found')
    // The pharmacist's clinical decision was recorded when the fill was labelled; pickup re-checks scope, not clinical admission.
    assertFillBinding(fill, current, currentItem, false)
    const fingerprint = fillHash({ ...args, actorId: userId }), eventKey = `fill.pickup:${args.idempotencyKey}`
    const prior = await fillStore(tx).PrescriptionFillEvent.findOne({ where: { eventKey }, query: 'id commandFingerprint result' })
    if (prior) {
      if (prior.commandFingerprint !== fingerprint) throw new DomainError('Pickup key is already bound to another request')
      return { ...prior.result, reused: true }
    }
    await assertItemFillLedger(tx, current, currentItem)
    const plan = pickupFillPlan(fill, args.expectedFillVersion)
    if (prescription.status !== 'ready_for_pickup') throw new DomainError('Prescription is not waiting for pickup')
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) throw new DomainError('Operator-attested cash and tax policy must be configured before pickup')
    const { label, lot } = await loadWillCallEvidence(tx, fill)
    const { subtotalAmount, taxAmount, totalAmount, currencyCode } = willCallAmountDue(fill)
    if (card) assertCounterCardCovers(card, totalAmount, currencyCode)
    const tender = card ? { cashReceivedAmount: totalAmount, changeDueAmount: 0 } : assertCashTender(totalAmount, args.cashReceivedAmount)
    const approval = await createHumanApproval(tx, { organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, actionType: 'dispense', reason: args.reason, attested: args.attested,
      evidence: { stage: 'will_call_pickup', fillId: fill.id, fillVersion: fill.version, itemVersion: fill.itemVersion, labelId: label.id, idempotencyKey: args.idempotencyKey } })
    const at = new Date().toISOString()
    const sale = await createCashPickupSale(tx, { prescription, item, fill, userId, reason: args.reason, attested: args.attested, idempotencyKey: args.idempotencyKey,
      operationSuffix: createHash('sha256').update(args.idempotencyKey).digest('hex').slice(0, 12).toUpperCase(), at, readyAt: label.dispensedAt,
      dispenseApprovalId: approval.id, clinicalSafetyReviewId: prescription.safetyReviews?.[0]?.id, pharmacistReviewId: prescription.reviews?.[0]?.id, fillNumber: fill.fillNumber,
      quantity: fill.quantityDispensed, lot, subtotalAmount, taxableSubtotalAmount: fill.priceSnapshot.taxable ? subtotalAmount : 0, taxAmount, totalAmount, currencyCode, tender, card })
    await sudo.query.DispensingLabel.updateOne({ where: { id: label.id }, data: { order: { connect: { id: sale.order.id } } } })
    const updated = await casFill(tx, fill, { ...plan, openKey: null })
    if (fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: 'fulfilled', openRequestKey: null } })
    await sudo.query.Prescription.updateOne({ where: { id: prescription.id }, data: { status: 'dispensed', dispensedAt: at, approval: { connect: { id: approval.id } } } })
    const result = { success: true, reused: false, prescriptionId: prescription.id, status: 'dispensed', approvalId: approval.id, orderId: sale.order.id, orderNumber: sale.order.orderNumber, receiptItemTitle: item.product.title, paymentId: sale.payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode, tenderMethod: card ? 'card' : 'cash' }
    await appendFillEvent(tx, updated, { eventKey, fingerprint, action: 'picked_up', actorId: userId, approvalId: approval.id, result, evidence: { labelId: label.id, orderId: sale.order.id, paymentId: sale.payment.id, cashApprovalId: sale.cashApproval.id } })
    return result
  })
}

/**
 * Return to stock: a will-call fill that was never picked up goes back on the shelf.
 * Units return to their lot, the consumed refill is restored through the release path,
 * the label is voided, and the fill closes. Repeating it is a no-op; a picked-up fill is refused.
 */
export async function returnPrescriptionFillToStock(
  _root: unknown,
  args: { prescriptionId: string; fillId: string; expectedFillVersion: number; cause: string; idempotencyKey: string; reason: string; attested: boolean },
  context: Context,
) {
  await currentFillPermission(context, 'canReviewPrescriptions')
  if (!args.idempotencyKey?.trim()) throw new DomainError('Idempotency key is required')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill:${args.fillId}`, `fill-command:${args.idempotencyKey}`], async tx => {
    const sudo = tx.sudo(), q = fillStore(tx)
    const p = await loadFillPrescription(tx, args.prescriptionId)
    const { userId } = await requireTenantMembership(tx, { organizationId: p.organization.id, locationId: p.location.id, pharmacist: true })
    await currentFillPermission(tx, 'canReviewPrescriptions')
    const fill = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY })
    const item = p.items.find((entry: any) => entry.id === fill?.prescriptionItem?.id)
    if (!fill || !item) throw new DomainError('Fill not found')
    assertFillBinding(fill, p, item, false)
    const fingerprint = fillHash({ ...args, actorId: userId }), eventKey = `fill.return:${args.idempotencyKey}`
    const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: 'id commandFingerprint result' })
    if (prior) {
      if (prior.commandFingerprint !== fingerprint) throw new DomainError('Return key is already bound to another request')
      return { ...prior.result, reused: true }
    }
    const returned = await q.PrescriptionFillEvent.count({ where: { fill: { id: { equals: fill.id } }, action: { equals: 'returned_to_stock' } } })
    const plan = returnToStockPlan(fill, args.expectedFillVersion, args.cause, returned > 0)
    if (plan.noop) return { success: true, reused: true, fillId: fill.id, status: fill.status, version: fill.version }
    await assertItemFillLedger(tx, p, item)
    const { label, movement, lot } = await loadWillCallEvidence(tx, fill)
    await acquireTransactionLocks(tx, [`lot:${lot.id}`, `prescription-item:${item.id}`])
    const approval = await createHumanApproval(tx, { organizationId: p.organization.id, locationId: p.location.id, actorId: userId, actionType: 'prescription_review', reason: args.reason, attested: args.attested,
      evidence: { stage: 'return_to_stock', fillId: fill.id, cause: args.cause, entitlementRestored: plan.restoreRefill, inventoryRestocked: plan.unitsRestocked, labelId: label.id, reversedMovementId: movement.id } })
    // Reverse the stock movement made when the fill was labelled.
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable + plan.unitsRestocked, ...(lot.status === 'depleted' ? { status: 'available' } : {}) } })
    const returnMovement = await sudo.query.InventoryMovement.createOne({ data: { movementType: 'return', quantityDelta: plan.unitsRestocked, reason: args.reason,
      idempotencyKey: `return-to-stock:${args.idempotencyKey}`, requestFingerprint: fingerprint,
      organization: { connect: { id: p.organization.id } }, location: { connect: { id: p.location.id } }, product: { connect: { id: movement.product.id } }, lot: { connect: { id: lot.id } },
      actor: { connect: { id: userId } }, patient: { connect: { id: p.patient.id } }, prescription: { connect: { id: p.id } }, prescriptionItem: { connect: { id: item.id } }, approval: { connect: { id: approval.id } } }, query: 'id' })
    // Undo the consumption (refill back to reserved, units off the item), then release through the shared release path.
    const unconsumed = { ...item, quantityDispensed: item.quantityDispensed - plan.unitsRestocked,
      refillsRemaining: item.refillsRemaining + (plan.restoreRefill ? 1 : 0), refillsReserved: item.refillsReserved + (plan.restoreRefill ? 1 : 0) }
    await sudo.query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { quantityDispensed: unconsumed.quantityDispensed, refillsRemaining: unconsumed.refillsRemaining, refillsReserved: unconsumed.refillsReserved } })
    const updated = await applyFillReleaseInTransaction(tx, p, unconsumed, fill, plan.release, args.reason, plan.data)
    await sudo.query.DispensingLabel.updateOne({ where: { id: label.id }, data: { voidedAt: new Date().toISOString(), voidReason: args.reason } })
    const result = { success: true, reused: false, fillId: fill.id, status: 'released', version: updated.version }
    await appendFillEvent(tx, updated, { eventKey, fingerprint, action: 'returned_to_stock', actorId: userId, approvalId: approval.id, quantity: plan.unitsRestocked, result,
      evidence: { cause: args.cause, inventoryRestocked: true, entitlementRestored: plan.restoreRefill, labelId: label.id, reversedMovementId: movement.id, movementId: returnMovement.id } })
    return result
  })
}
