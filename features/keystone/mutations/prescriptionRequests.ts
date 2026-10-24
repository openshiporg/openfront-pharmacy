import { createHash } from 'node:crypto'
import { GraphQLError } from 'graphql'
import type { Context } from '.keystone/types'

import { permissions } from '../access'
import { requireTenantMembership } from './lib/authorization'
import { recordAuditAndOutbox } from './lib/evidence'
import { DomainError } from './lib/errors'

// Online prescription requests (patient registration, transfer, new prescription). The details are
// patient-reported. Staff review them and record the patient and prescription through the controlled
// workflows; nothing here creates a patient record or a prescription.

const KINDS = ['registration', 'transfer', 'new_prescription'] as const
const RESOLUTIONS = ['in_review', 'completed', 'declined'] as const
const REQUEST_FIELDS = 'id kind status createdAt resolvedAt resolutionNote firstName lastName dateOfBirth phone email allergies insurance counterpartyName counterpartyPhone prescriberName prescriberPhone medications note organization { id } location { id name } user { id name email } patient { id }'

type Kind = typeof KINDS[number]

type SubmitInput = {
  locationId: string
  kind: string
  idempotencyKey: string
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  allergies?: string | null
  insurance?: string | null
  counterpartyName?: string | null
  counterpartyPhone?: string | null
  prescriberName?: string | null
  prescriberPhone?: string | null
  medications?: string | null
  note?: string | null
}

function userInputError(message: string) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}

function clean(value: string | null | undefined, max: number) {
  const text = String(value ?? '').trim()
  if (text.length > max) throw userInputError(`Keep each answer under ${max} characters.`)
  return text
}

function customerProjection(request: any) {
  return { id: request.id, kind: request.kind, status: request.status, createdAt: request.createdAt, resolvedAt: request.resolvedAt, resolutionNote: request.resolutionNote || null, locationName: request.location?.name || 'Pharmacy', counterpartyName: request.counterpartyName || null, medications: request.medications || null }
}

function staffProjection(request: any) {
  return {
    ...customerProjection(request),
    customerName: request.user?.name || '',
    customerEmail: request.user?.email || '',
    organizationId: request.organization?.id || '',
    patientId: request.patient?.id || null,
    firstName: request.firstName || null,
    lastName: request.lastName || null,
    dateOfBirth: request.dateOfBirth || null,
    phone: request.phone || null,
    email: request.email || null,
    allergies: request.allergies || null,
    insurance: request.insurance || null,
    counterpartyPhone: request.counterpartyPhone || null,
    prescriberName: request.prescriberName || null,
    prescriberPhone: request.prescriberPhone || null,
    note: request.note || null,
  }
}

function requireCustomer(context: Context) {
  const userId = context.session?.itemId
  if (!userId || context.session?.listKey !== 'User') throw userInputError('Sign in to send a request.')
  return String(userId)
}

export async function submitPharmacyPrescriptionRequest(_root: unknown, args: { input: SubmitInput }, context: Context) {
  const userId = requireCustomer(context)
  const input = args.input
  if (!KINDS.includes(input.kind as Kind)) throw userInputError('Choose a request type.')
  const kind = input.kind as Kind
  const idempotencyKey = clean(input.idempotencyKey, 200)
  if (!idempotencyKey) throw userInputError('A request key is required.')
  const sudo = context.sudo()

  const existing = await sudo.query.PrescriptionRequest.findOne({ where: { idempotencyKey }, query: `${REQUEST_FIELDS}` })
  if (existing) {
    if (existing.user?.id !== userId) throw userInputError('This request key is already in use.')
    return customerProjection(existing)
  }

  const location = await sudo.query.PharmacyLocation.findOne({ where: { id: input.locationId }, query: 'id status organization { id status }' })
  if (!location || location.status !== 'active' || location.organization?.status !== 'active') throw userInputError('Choose an open pharmacy location.')

  const data = {
    firstName: clean(input.firstName, 120),
    lastName: clean(input.lastName, 120),
    phone: clean(input.phone, 40),
    allergies: clean(input.allergies, 1000),
    insurance: clean(input.insurance, 1000),
    counterpartyName: clean(input.counterpartyName, 200),
    counterpartyPhone: clean(input.counterpartyPhone, 40),
    prescriberName: clean(input.prescriberName, 200),
    prescriberPhone: clean(input.prescriberPhone, 40),
    medications: clean(input.medications, 2000),
    note: clean(input.note, 1000),
  }
  const dateOfBirth = input.dateOfBirth ? new Date(`${String(input.dateOfBirth).slice(0, 10)}T00:00:00.000Z`) : null
  if (dateOfBirth && (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now())) throw userInputError('Enter a valid date of birth.')
  if (!data.phone) throw userInputError('Enter a phone number the pharmacy can call.')
  if (kind === 'registration') {
    if (!data.firstName || !data.lastName || !dateOfBirth) throw userInputError('Enter your legal name and date of birth.')
    if (!data.allergies) throw userInputError('List your allergies, or enter "None".')
  }
  if (kind === 'transfer' && (!data.counterpartyName || !data.medications)) throw userInputError('Enter the pharmacy to transfer from and the medications.')
  if (kind === 'new_prescription' && (!data.prescriberName || !data.medications)) throw userInputError('Enter the prescriber and the medications.')

  const user = await sudo.query.User.findOne({ where: { id: userId }, query: 'id email patientProfile { id }' })
  const request = await sudo.query.PrescriptionRequest.createOne({
    data: {
      idempotencyKey,
      kind,
      status: 'requested',
      organization: { connect: { id: location.organization.id } },
      location: { connect: { id: location.id } },
      user: { connect: { id: userId } },
      ...(user?.patientProfile?.id ? { patient: { connect: { id: user.patientProfile.id } } } : {}),
      ...data,
      email: user?.email || '',
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
    },
    query: REQUEST_FIELDS,
  })
  await recordAuditAndOutbox(context, {
    eventKey: `prescription_request.submitted:${request.id}`,
    organizationId: location.organization.id,
    locationId: location.id,
    actorId: userId,
    patientId: user?.patientProfile?.id || undefined,
    eventType: 'prescription_request.submitted',
    resourceType: 'PrescriptionRequest',
    resourceId: request.id,
    metadata: { kind, fingerprint: createHash('sha256').update(idempotencyKey).digest('hex') },
  })
  return customerProjection(request)
}

export async function pharmacyCustomerPrescriptionRequests(_root: unknown, _args: unknown, context: Context) {
  const userId = requireCustomer(context)
  const requests = await context.sudo().query.PrescriptionRequest.findMany({ where: { user: { id: { equals: userId } } }, orderBy: [{ createdAt: 'desc' }], take: 25, query: REQUEST_FIELDS })
  return requests.map(customerProjection)
}

function canWorkRequests(context: Context) {
  const session = context.session as any
  return permissions.canManagePatients({ session }) || permissions.canManagePrescriptions({ session })
}

export async function pharmacyPrescriptionRequestQueue(_root: unknown, args: { status?: string | null; requestId?: string | null }, context: Context) {
  const userId = context.session?.itemId
  if (!userId) throw new DomainError('Authentication required')
  if (!canWorkRequests(context)) throw new DomainError('Permission required: canManagePatients or canManagePrescriptions')
  const sudo = context.sudo()
  const memberships = await sudo.query.OrganizationMembership.findMany({
    where: { user: { id: { equals: String(userId) } }, status: { equals: 'active' }, organization: { status: { equals: 'active' } } },
    query: 'organization { id } location { id }',
  })
  const scopes = memberships.map((membership: any) => membership.location?.id
    ? { location: { id: { equals: membership.location.id } } }
    : { organization: { id: { equals: membership.organization.id } } })
  if (!scopes.length) return []
  const status = args.status && ['requested', ...RESOLUTIONS].includes(args.status) ? args.status : null
  const requests = await sudo.query.PrescriptionRequest.findMany({
    where: { AND: [{ OR: scopes }, ...(status ? [{ status: { equals: status } }] : []), ...(args.requestId ? [{ id: { equals: args.requestId } }] : [])] },
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
    query: REQUEST_FIELDS,
  })
  return requests.map(staffProjection)
}

export async function resolvePharmacyPrescriptionRequest(_root: unknown, args: { requestId: string; status: string; note?: string | null; patientId?: string | null }, context: Context) {
  if (!canWorkRequests(context)) throw new DomainError('Permission required: canManagePatients or canManagePrescriptions')
  if (!RESOLUTIONS.includes(args.status as typeof RESOLUTIONS[number])) throw new DomainError('Choose in review, completed or declined')
  const note = clean(args.note, 1000)
  if (args.status === 'declined' && note.length < 3) throw userInputError('Give the reason for declining.')
  const sudo = context.sudo()
  const request = await sudo.query.PrescriptionRequest.findOne({ where: { id: args.requestId }, query: REQUEST_FIELDS })
  if (!request) throw new DomainError('Request not found')
  const { userId } = await requireTenantMembership(context, { organizationId: request.organization.id, locationId: request.location.id })
  if (['completed', 'declined'].includes(request.status)) throw userInputError('This request is already closed.')
  const terminal = args.status !== 'in_review'
  // Recording the patient made from this request: tie it to the request and, when neither side is linked
  // yet, to the customer's storefront account so they see their prescriptions online.
  const patient = args.patientId
    ? await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: 'id user { id } organizations { id }' })
    : null
  if (args.patientId && !patient?.organizations?.some((organization: any) => organization.id === request.organization.id)) throw new DomainError('Patient not found in this pharmacy')
  if (patient && !patient.user && request.user?.id) {
    const customer = await sudo.query.User.findOne({ where: { id: request.user.id }, query: 'id patientProfile { id }' })
    if (customer && !customer.patientProfile) {
      await sudo.query.PatientProfile.updateOne({ where: { id: patient.id }, data: { user: { connect: { id: customer.id } } } })
      await recordAuditAndOutbox(context, {
        eventKey: `patient.account_linked:${patient.id}:${customer.id}`,
        organizationId: request.organization.id,
        actorId: String(userId),
        patientId: patient.id,
        eventType: 'patient.account_linked',
        resourceType: 'PatientProfile',
        resourceId: patient.id,
        metadata: { userId: customer.id, requestId: request.id },
      })
    }
  }
  const updated = await sudo.query.PrescriptionRequest.updateOne({
    where: { id: request.id },
    data: { status: args.status, resolutionNote: note || request.resolutionNote || '', ...(patient ? { patient: { connect: { id: patient.id } } } : {}), ...(terminal ? { resolvedAt: new Date().toISOString(), resolvedBy: { connect: { id: String(userId) } } } : {}) },
    query: REQUEST_FIELDS,
  })
  await recordAuditAndOutbox(context, {
    eventKey: `prescription_request.${args.status}:${request.id}`,
    organizationId: request.organization.id,
    locationId: request.location.id,
    actorId: String(userId),
    patientId: request.patient?.id || undefined,
    eventType: `prescription_request.${args.status}`,
    resourceType: 'PrescriptionRequest',
    resourceId: request.id,
    metadata: { kind: request.kind },
  })
  return staffProjection(updated)
}
