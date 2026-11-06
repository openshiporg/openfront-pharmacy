import type { Context } from '.keystone/types'

/*
 * "Ready for pickup" notice (Digital Pharmacist, Shopify local pickup), sent after the state change commits.
 * Evidence is append-only: a unique claim AuditEvent (`notice.pickup_ready:<key>`) makes the send happen once
 * across retries and replays, and a second event records the result. Prescription notices name the
 * pharmacy and a reference only (minimum necessary). A patient who opted out of email gets none.
 * Never throws: a failed email never undoes the pickup state.
 */

type Notice = { kind: 'prescription' | 'order'; noticeKey: string; organizationId: string; locationId: string; patientId?: string | null; resourceType: string; resourceId: string; reference: string; to: string | null | undefined; consented: boolean; path: string }

async function deliver(context: Context, notice: Notice) {
  const sudo = context.sudo()
  const record = (suffix: string, eventType: string, metadata: Record<string, unknown>) =>
    (sudo.prisma as any).auditEvent.create({ data: {
      eventKey: `notice.pickup_ready:${notice.noticeKey}${suffix}`, eventType, actorType: 'system',
      organizationId: notice.organizationId, locationId: notice.locationId, patientId: notice.patientId || null,
      resourceType: notice.resourceType, resourceId: notice.resourceId,
      metadata: { channel: 'email', kind: notice.kind, ...metadata },
    } })
  const to = notice.to?.trim()
  if (!to || !notice.consented) {
    await record('', 'notice.pickup_ready.skipped', { reason: !to ? 'no_email' : 'patient_preference' }).catch(() => {})
    return
  }
  try {
    await record('', 'notice.pickup_ready.claimed', {})
  } catch {
    return // already claimed by an earlier attempt
  }
  try {
    const { requestOrigin, sendPickupReadyEmail } = await import('../lib/mail')
    const [organization, location] = await Promise.all([
      sudo.query.Organization.findOne({ where: { id: notice.organizationId }, query: 'name operatorDisplayName supportPhone' }),
      sudo.query.PharmacyLocation.findOne({ where: { id: notice.locationId }, query: 'name phone' }),
    ])
    const origin = requestOrigin(context.req as any)
    const result = await sendPickupReadyEmail({
      to,
      storeName: organization?.operatorDisplayName || organization?.name || 'Pharmacy',
      kind: notice.kind,
      reference: notice.reference,
      locationName: location?.name || 'the pharmacy',
      phone: location?.phone || organization?.supportPhone,
      url: origin ? `${origin}${notice.path}` : '',
    })
    await record(':result', result.sent ? 'notice.pickup_ready.sent' : 'notice.pickup_ready.skipped', result.sent ? { messageId: result.messageId || null } : { reason: 'email_not_configured' })
  } catch (error) {
    await record(':result', 'notice.pickup_ready.failed', { error: error instanceof Error ? error.message.slice(0, 300) : 'send_failed' }).catch(() => {})
  }
}

/** A will-call fill was labelled and placed in the bin. */
export async function notifyPrescriptionReady(context: Context, input: { prescriptionId: string; fillId: string }) {
  try {
    const prescription = await context.sudo().query.Prescription.findOne({
      where: { id: input.prescriptionId },
      query: 'id prescriptionNumber status organization { id } location { id } patient { id email preferredContactMethod user { email } }',
    })
    if (!prescription || prescription.status !== 'ready_for_pickup') return
    const patient = prescription.patient
    const preference = patient?.preferredContactMethod || 'none'
    await deliver(context, {
      kind: 'prescription',
      noticeKey: `fill:${input.fillId}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      patientId: patient?.id,
      resourceType: 'PrescriptionFill',
      resourceId: input.fillId,
      reference: prescription.prescriptionNumber || '',
      to: patient?.email || patient?.user?.email,
      // Phone/SMS-only patients are called from will-call; email/portal/none (no stated preference) get email.
      consented: !['phone', 'sms'].includes(preference),
      path: '/prescriptions',
    })
  } catch (error) {
    console.error('Prescription ready notice failed:', error instanceof Error ? error.message : 'unknown')
  }
}

/** A storefront pickup order moved to ready. */
export async function notifyOrderReady(context: Context, input: { fulfillmentId: string }) {
  try {
    const fulfillment = await context.sudo().query.Fulfillment.findOne({
      where: { id: input.fulfillmentId },
      query: 'id method status organization { id } location { id } order { id orderNumber email customer { email } patient { id } }',
    })
    if (!fulfillment?.order || fulfillment.method !== 'pickup' || fulfillment.status !== 'ready') return
    const order = fulfillment.order
    await deliver(context, {
      kind: 'order',
      noticeKey: `fulfillment:${fulfillment.id}`,
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
      patientId: order.patient?.id,
      resourceType: 'Fulfillment',
      resourceId: fulfillment.id,
      reference: order.orderNumber,
      to: order.email || order.customer?.email,
      consented: true,
      path: `/order-status?${new URLSearchParams({ orderId: order.id })}`,
    })
  } catch (error) {
    console.error('Order ready notice failed:', error instanceof Error ? error.message : 'unknown')
  }
}
