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
import { withDomainTransaction } from './lib/transaction'
import { assertItemFillLedger, assertFillBinding, consumeFillInTransaction, currentFillPermission, FILL_QUERY, fillStore, loadFillPrescription } from './fillWorkflows'
import { FILL_LINEAGE, dispenseFillPlan, fillPricePortion } from '../workflows/fill-entitlement'

const CLINICAL_QUERY = 'sourceVerificationStatus writtenAt expiresAt prescriber { npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } }'
const SAFETY_QUERY = `
  patient { id displayName identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } }
  safetyReviews(orderBy: { reviewedAt: desc }, take: 1) {
    id fillNumber outcome allergiesReviewed medicationHistoryReviewed interactionsReviewed duplicateTherapyReviewed contraindicationsReviewed doseReviewed counselingPlanReviewed reviewReference overrideReason reviewedAt evidenceSnapshot
  }
`

async function assertPrescriptionSafetyEvidence(context: Context, prescription: any, fillSpecific = false) {
  if (prescription.patient?.identityVerificationStatus !== 'confirmed' || !prescription.patient?.identityReference?.trim() || !prescription.patient?.identityVerifiedAt || !prescription.patient?.identityVerifiedBy?.id) {
    throw new Error('Current operator-recorded patient identity evidence is required')
  }
  if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new Error('Explicit allergy and medication history evidence is required for this fill')
  const fillNumbers = prescription.items.map((item: any) => currentFillNumber(item))
  const fillNumber = Math.max(...fillNumbers)
  if (!fillNumbers.length || fillNumbers.some((value: number) => value !== fillNumber)) throw new Error('Prescription items are not aligned to one fill review')
  const latestPatientChange = [...(prescription.patient?.allergies || []), ...(prescription.patient?.medications || []), { updatedAt: prescription.patient.identityVerifiedAt }]
    .map((entry: any) => entry.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1)
  const review = prescription.safetyReviews?.[0]
  if (fillSpecific && prescription.items.some((item: any) => item.fillLineage === FILL_LINEAGE)) {
    const fills = await fillStore(context).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY })
    const fill = fills[0], evidence = review?.evidenceSnapshot
    if (fills.length !== 1 || !fill || evidence?.fillId !== fill.id || evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || new Date(review.reviewedAt).getTime() < new Date(fill.createdAt).getTime()) throw new Error('A versioned human safety review for this exact fill reservation is required')
  }
  assertCurrentHumanSafetyReview(review, fillNumber, latestPatientChange)
  const drugReferenceIds = [...new Set(prescription.items.map((item: any) => item.drugReference?.id).filter(Boolean))] as string[]
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: 'active' } },
    take: 100,
    query: 'id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt',
  })
  if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new Error('Current drug reference review evidence is required')
  for (const drugReview of drugReviews) {
    assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: drugReview.status === 'active', marketingStatus: drugReview.marketingStatusSnapshot, controlledSchedule: drugReview.controlledScheduleSnapshot, sourceName: drugReview.sourceName, sourceVersion: drugReview.sourceVersion, sourceReference: drugReview.sourceReference, reviewedAt: drugReview.reviewedAt })
    if (new Date(drugReview.reviewedAt).getTime() > new Date(review.reviewedAt).getTime()) throw new Error('Drug reference evidence changed after the clinical safety review')
  }
  return review
}

export async function recordPrescriptionReview(
  _root: unknown,
  args: { prescriptionId: string; decision: string; reason: string; attested: boolean },
  context: Context,
) {
  requirePermission(context, 'canReviewPrescriptions')
  if (!['approved', 'needs_information', 'rejected'].includes(args.decision)) throw new Error('Invalid review decision')
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision reason approval { id reason } }`,
    })
    if (!prescription) throw new Error('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    const prior = prescription.reviews?.[0]
    if (prescription.status === args.decision && prior?.decision === args.decision && (prior.reason !== args.reason || prior.approval?.reason !== args.reason)) throw new Error('Prescription review replay does not match the recorded reason')
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
    if (!prescription) throw new Error('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    if (prescription.items.some((item: any) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, 'canDispenseMedications')
      const current = await loadFillPrescription(transactionContext, prescription.id)
      const fills = await fillStore(transactionContext).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY })
      if (fills.length !== 1 || current.items.length !== 1) throw new Error('Exactly one current item/fill is required')
      const fill = fills[0]
      const item = current.items.find((entry: any) => entry.id === fill?.prescriptionItem?.id)
      if (!fill || !item || !['approved', 'partially_dispensed'].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error('An approved current fill reservation is required')
      assertFillBinding(fill, current, item)
      await assertItemFillLedger(transactionContext, current, item)
      await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    }
    if (prescription.status === 'ready_to_dispense' && prescription.approval?.id && (prescription.approval.actionType !== 'dispense' || prescription.approval.reason !== args.reason)) throw new Error('Dispensing authorization replay does not match the recorded reason')
    if (prescription.status === 'ready_to_dispense' && prescription.approval?.id) {
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: prescription.approval.id }
    }
    assertPrescriptionClinicallyEligible(prescription)
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    if (!prescription.reviews?.some((review: any) => review.decision === 'approved')) throw new Error('Approved pharmacist review required')
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

export async function recordPrescriptionDispensing(
  _root: unknown,
  args: { prescriptionId: string; prescriptionItemId: string; lotId: string; quantity: number; cashReceivedAmount: number; auxiliaryWarnings: string[]; counselingOutcome: string; idempotencyKey: string; reason: string; attested: boolean; fillId?: string | null; expectedFillVersion?: number | null },
  context: Context,
) {
  requirePermission(context, 'canDispenseMedications')
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new Error('Dispensed quantity must be a positive integer')
  if (!args.idempotencyKey?.trim()) throw new Error('Idempotency key is required')
  if (!['offered_accepted', 'offered_declined'].includes(args.counselingOutcome)) throw new Error('Counseling offer outcome must be recorded')
  const auxiliaryWarnings = [...new Set((args.auxiliaryWarnings || []).map((value) => value.trim()).filter(Boolean))]
  if (!auxiliaryWarnings.length || auxiliaryWarnings.length > 20 || auxiliaryWarnings.some((value) => value.length > 200)) throw new Error('Auxiliary warning evidence is invalid')
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
        items { id fillLineage activeFillNumber refillsReserved medicationNameSnapshot sig quantityPrescribed quantityDispensed refillsAuthorized refillsRemaining product { id title sku priceAmount currencyCode taxable imageUrl prescriptionRequirement drugReference { id ndc11 } } drugReference { id ndc11 } }
        reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }
      `,
    })
    if (!prescription) throw new Error('Prescription not found')
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true,
    })
    const item = prescription.items.find((entry: any) => entry.id === args.prescriptionItemId)
    if (!item) throw new Error('Prescription item does not belong to this prescription')
    let fill: any = null
    if (item.fillLineage === FILL_LINEAGE) {
      await currentFillPermission(transactionContext, 'canDispenseMedications')
      const current = await loadFillPrescription(transactionContext, prescription.id)
      fill = args.fillId ? await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY }) : null
      if (!fill || !Number.isSafeInteger(args.expectedFillVersion)) throw new Error('Fill identity and expected version are required')
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
    })).digest('hex')
    if (existingMovement) {
      if (!existingMovement.requestFingerprint || existingMovement.requestFingerprint !== requestFingerprint) {
        throw new Error('Dispensing idempotency key is already bound to another operation')
      }
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: existingMovement.approval?.id, orderId: existingMovement.order?.id, orderNumber: existingMovement.order?.orderNumber, receiptItemTitle: existingMovement.order?.lineItems?.[0]?.title, paymentId: existingMovement.order?.payments?.[0]?.id, labelId: existingMovement.order?.dispensingLabels?.[0]?.id, totalAmount: existingMovement.order?.totalAmount, cashReceivedAmount: existingMovement.order?.payments?.[0]?.cashReceivedAmount, changeDueAmount: existingMovement.order?.payments?.[0]?.changeDueAmount, currencyCode: existingMovement.order?.currencyCode }
    }
    assertPrescriptionItemProductIdentity(item)
    assertPrescriptionClinicallyEligible(prescription)
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true)
    if (!['ready_to_dispense', 'partially_dispensed'].includes(prescription.status) || !prescription.approval || !prescription.reviews?.length) {
      throw new Error('Prescription is not authorized for dispensing')
    }
    const fillPlan = fill ? dispenseFillPlan(fill, args.expectedFillVersion!, args.quantity) : null
    const authorizedFills = 1 + item.refillsAuthorized - item.refillsRemaining
    const authorizedQuantity = item.quantityPrescribed * authorizedFills
    const remainingAuthorizedQuantity = fill ? fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased : authorizedQuantity - item.quantityDispensed
    if (args.quantity > remainingAuthorizedQuantity) throw new Error('Dispensed quantity exceeds the remaining authorized quantity')
    if (prescription.items.length !== 1 || (!fill && (remainingAuthorizedQuantity !== item.quantityPrescribed || args.quantity !== item.quantityPrescribed))) {
      throw new Error('Dispense one complete prescription item per cash pickup; partial and multi-item dispensing are not supported')
    }
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) {
      throw new Error('Operator-attested cash and tax policy must be configured before dispensing')
    }
    const currencyCode = fill ? fill.priceSnapshot.currencyCode : item.product.currencyCode
    const subtotalAmount = fill ? fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : item.product.priceAmount
    const taxable = fill ? fill.priceSnapshot.taxable : item.product.taxable !== false
    const taxableSubtotalAmount = taxable ? subtotalAmount : 0
    const taxAmount = fill ? fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : calculateTaxAmount(taxableSubtotalAmount, prescription.organization.cashTaxRateBps || 0)
    const totalAmount = subtotalAmount + taxAmount
    const tender = assertCashTender(totalAmount, args.cashReceivedAmount)

    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: 'id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } product { id } location { id }',
    })
    if (!lot || lot.location.id !== prescription.location.id || lot.product.id !== item.product?.id) throw new Error('Inventory lot does not match this prescription item and location')
    if (!isLotEligible(lot) || lot.quantityAvailable - lot.quantityQuarantined < args.quantity) throw new Error('Inventory lot is not eligible for dispensing')

    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'dispense',
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill?.version || null, itemVersion: fill?.itemVersion || null, lotId: lot.id, quantity: args.quantity, pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, idempotencyKey: args.idempotencyKey },
    })
    const cashApproval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: 'cash_tender',
      reason: args.reason,
      attested: args.attested,
      evidence: { subtotalAmount, taxableSubtotalAmount, taxAmount, amountDue: totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, taxRateBps: prescription.organization.cashTaxRateBps || 0, taxPolicyReference: prescription.organization.cashTaxPolicyReference, providerSettlementClaimed: false },
    })
    const operationSuffix = createHash('sha256').update(args.idempotencyKey).digest('hex').slice(0, 12).toUpperCase()
    const dispensedAt = new Date().toISOString()
    const order = await sudo.query.Order.createOne({
      data: {
        orderNumber: `RX-${operationSuffix}`,
        idempotencyKey: `rx-cash:${args.idempotencyKey}`,
        checkoutEvidence: { workflow: 'operator_attested_cash_prescription_pickup', pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, dispenseApprovalId: approval.id, cashApprovalId: cashApproval.id, taxRateBps: prescription.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false },
        status: 'completed',
        fulfillmentMethod: 'pickup',
        subtotalAmount,
        taxAmount,
        deliveryAmount: 0,
        totalAmount,
        currencyCode,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        approval: { connect: { id: cashApproval.id } },
      },
      query: 'id orderNumber',
    })
    await sudo.query.OrderLineItem.createOne({
      data: {
        title: fill ? fill.priceSnapshot.title : item.product.title,
        sku: fill ? fill.priceSnapshot.sku : item.product.sku,
        ndc11Snapshot: item.product.drugReference?.ndc11 || undefined,
        quantity: 1,
        unitPriceAmount: subtotalAmount,
        lineTotalAmount: subtotalAmount,
        imageUrl: item.product.imageUrl || undefined,
        prescriptionRequirementSnapshot: item.product.prescriptionRequirement,
        metadata: { dispensedUnits: args.quantity, prescriptionItemId: item.id, fillId: fill?.id || null, fillNumber: safetyReview.fillNumber, taxable: item.product.taxable !== false, taxableAmount: taxableSubtotalAmount },
        lotAllocationSnapshot: [{ lotId: lot.id, lotNumber: lot.lotNumber, quantity: args.quantity, expirationDate: lot.expirationDate }],
        order: { connect: { id: order.id } },
        product: { connect: { id: item.product.id } },
      },
    })
    const payment = await sudo.query.Payment.createOne({
      data: {
        amount: totalAmount,
        currencyCode,
        status: 'captured',
        tenderMethod: 'cash',
        cashReceivedAmount: tender.cashReceivedAmount,
        changeDueAmount: tender.changeDueAmount,
        processedAt: dispensedAt,
        data: { evidenceType: 'operator_attested_cash_received', approvalId: cashApproval.id, providerSettlementClaimed: false },
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        order: { connect: { id: order.id } },
        recordedBy: { connect: { id: userId } },
        approval: { connect: { id: cashApproval.id } },
      },
      query: 'id status',
    })
    await sudo.query.Fulfillment.createOne({
      data: {
        method: 'pickup',
        status: 'handed_off',
        readyAt: dispensedAt,
        handedOffAt: dispensedAt,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        order: { connect: { id: order.id } },
        assignedTo: { connect: { id: userId } },
      },
    })
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
        order: { connect: { id: order.id } },
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
        order: { connect: { id: order.id } },
        approval: { connect: { id: approval.id } },
      },
      query: 'id',
    })
    if (fill) {
      const result = { success: true, reused: false, prescriptionId: prescription.id, status: fillPlan!.status, approvalId: approval.id, orderId: order.id, orderNumber: order.orderNumber, receiptItemTitle: item.product.title, paymentId: payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode }
      await consumeFillInTransaction(transactionContext, fill, item, args.expectedFillVersion!, args.quantity, { key: args.idempotencyKey, fingerprint: requestFingerprint, actorId: userId, approvalId: approval.id, result, movementId: movement.id, safetyReviewId: safetyReview.id })
      if (fillPlan!.status === 'dispensed' && fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: 'fulfilled', openRequestKey: null } })
    }
    const allCurrentFillsComplete = fill ? fillPlan!.status === 'dispensed' : prescription.items.every((entry: any) => {
      const nextDispensed = entry.id === item.id ? entry.quantityDispensed + args.quantity : entry.quantityDispensed
      const entryAuthorizedQuantity = entry.quantityPrescribed * (1 + entry.refillsAuthorized - entry.refillsRemaining)
      return nextDispensed >= entryAuthorizedQuantity
    })
    const nextStatus = allCurrentFillsComplete ? 'dispensed' : 'partially_dispensed'
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: nextStatus, ...(allCurrentFillsComplete ? { dispensedAt: new Date().toISOString() } : {}), approval: { connect: { id: approval.id } } },
    })
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.dispensed:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: allCurrentFillsComplete ? 'prescription.dispensed' : 'prescription.partially_dispensed',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      metadata: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill ? fill.version + 1 : null, lotId: lot.id, quantity: args.quantity, quantityDispensed: item.quantityDispensed + args.quantity, movementId: movement.id, orderId: order.id, paymentId: payment.id, labelId: label.id, approvalId: approval.id, cashApprovalId: cashApproval.id, clinicalSafetyReviewId: safetyReview.id, subtotalAmount, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false },
    })
    return { success: true, reused: false, prescriptionId: prescription.id, status: nextStatus, approvalId: approval.id, orderId: order.id, orderNumber: order.orderNumber, receiptItemTitle: item.product.title, paymentId: payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode }
  })
}
