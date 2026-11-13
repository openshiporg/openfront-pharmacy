/**
 * Replays the 2026-11-13 PHI filter-leak audit against a real database.
 *
 * For each viewer (signed out, storefront customer, Read Only, Cashier, Delivery Driver, Pharmacy
 * Technician, Pharmacist, Admin) every probe counts rows twice: once with a prefix of the hidden value
 * and once with a prefix that matches nothing. A viewer who cannot read the hidden value must get the
 * same count both times or an access error; a viewer who can read it must see the difference.
 *
 * Needs DATABASE_URL pointing at a migrated, disposable database:
 *   DATABASE_URL=... timeout 300 npx vitest run tests/filter-access-leak.test.ts --no-file-parallelism
 */
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const hasDb = Boolean(process.env.DATABASE_URL)
process.env.SESSION_SECRET ||= randomBytes(24).toString('hex')

const run = randomBytes(4).toString('hex')
const MISS = 'Zq'

type Viewer = 'signedOut' | 'customer' | 'readOnly' | 'cashier' | 'driver' | 'technician' | 'pharmacist' | 'admin'
const VIEWERS: Viewer[] = ['signedOut', 'customer', 'readOnly', 'cashier', 'driver', 'technician', 'pharmacist', 'admin']

const NONE = {
  canAccessDashboard: true, canManageOrganizations: false, canManageLocations: false, canManageUsers: false,
  canManageRoles: false, canManageCatalog: false, canManageInventory: false, canManageRecalls: false,
  canManagePatients: false, canViewPatientPrivateData: false, canManagePrescriptions: false,
  canReviewPrescriptions: false, canDispenseMedications: false, canManageOrders: false, canManagePayments: false,
  canManageIntegrations: false, canManageOnboarding: false, canViewAuditLogs: false, canApproveConsequentialActions: false,
}
// The live store's roles (pharmacy.openship.org, 2026-11-13).
const ROLES: Record<Exclude<Viewer, 'signedOut' | 'customer'>, typeof NONE & { name: string }> = {
  admin: { ...Object.fromEntries(Object.keys(NONE).map((key) => [key, true])) as typeof NONE, name: 'Admin' },
  pharmacist: { ...NONE, name: 'Pharmacist', canManageInventory: true, canManageRecalls: true, canManagePatients: true, canViewPatientPrivateData: true, canManagePrescriptions: true, canReviewPrescriptions: true, canDispenseMedications: true, canManageOrders: true },
  technician: { ...NONE, name: 'Pharmacy Technician', canManageInventory: true, canManageRecalls: true, canManagePatients: true, canViewPatientPrivateData: true, canManagePrescriptions: true },
  cashier: { ...NONE, name: 'Cashier', canManageOrders: true, canManagePayments: true },
  driver: { ...NONE, name: 'Delivery Driver', canManageOrders: true },
  readOnly: { ...NONE, name: 'Read Only' },
}

const HIDDEN = {
  patientLast: `Bramwell${run}`,
  patientFirst: `Odile${run}`,
  patientPhone: '+1555867',
  rxNumber: `RX-${run}`,
  sig: `Take one tablet ${run}`,
  allergen: `Sulfa${run}`,
  orderEmail: `ordermail${run}@example.com`,
  orderPhone: '+1555244',
  orderName: `Quill${run}`,
  adminEmail: `owner${run}@example.com`,
  customerEmail: `buyer${run}@example.com`,
  paymentId: `pi_${run}secret`,
}
const prefix = (value: string) => value.slice(0, Math.max(4, value.length - 2))

type Probe = { label: string; count: string; where: (value: string) => string; value: string; visibleTo: Viewer[] }
const sw = (field: string) => (value: string) => `${field}: { startsWith: ${JSON.stringify(value)} }`

const PROBES: Probe[] = [
  // Signed out, through the public drug reference list.
  { label: 'DrugReference > prescription > patient.lastName', count: 'drugReferencesCount', value: HIDDEN.patientLast, visibleTo: [],
    where: (v) => `{ prescriptionItems: { some: { prescription: { patient: { ${sw('lastName')(v)} } } } } }` },
  { label: 'DrugReference > prescription > patient.phone', count: 'drugReferencesCount', value: HIDDEN.patientPhone, visibleTo: [],
    where: (v) => `{ prescriptionItems: { some: { prescription: { patient: { ${sw('phone')(v)} } } } } }` },
  { label: 'DrugReference > prescription.prescriptionNumber', count: 'drugReferencesCount', value: HIDDEN.rxNumber, visibleTo: ['admin', 'pharmacist', 'technician'],
    where: (v) => `{ prescriptionItems: { some: { prescription: { ${sw('prescriptionNumber')(v)} } } } }` },
  { label: 'DrugReference > prescriptionItems.sig', count: 'drugReferencesCount', value: HIDDEN.sig, visibleTo: ['admin', 'pharmacist', 'technician'],
    where: (v) => `{ prescriptionItems: { some: { ${sw('sig')(v)} } } }` },
  { label: 'DrugReference > prescriptionItems none', count: 'drugReferencesCount', value: HIDDEN.sig, visibleTo: ['admin', 'pharmacist', 'technician'],
    where: (v) => `{ prescriptionItems: { none: { ${sw('sig')(v)} } } }` },
  { label: 'DrugReference > prescriptionItems every', count: 'drugReferencesCount', value: HIDDEN.sig, visibleTo: ['admin', 'pharmacist', 'technician'],
    where: (v) => `{ prescriptionItems: { every: { ${sw('sig')(v)} } } }` },
  { label: 'DrugReference > patient allergy', count: 'drugReferencesCount', value: HIDDEN.allergen, visibleTo: [],
    where: (v) => `{ prescriptionItems: { some: { prescription: { patient: { allergies: { some: { ${sw('allergen')(v)} } } } } } } }` },
  { label: 'DrugReference > products > organization > patients.firstName', count: 'drugReferencesCount', value: HIDDEN.patientFirst, visibleTo: [],
    where: (v) => `{ products: { some: { organization: { patients: { some: { ${sw('firstName')(v)} } } } } } }` },
  { label: 'DrugReference > products > organization > orders.email', count: 'drugReferencesCount', value: HIDDEN.orderEmail, visibleTo: ['admin', 'pharmacist', 'technician'],
    where: (v) => `{ products: { some: { organization: { orders: { some: { ${sw('email')(v)} } } } } } }` },
  { label: 'DrugReference > products > organization > memberships.user.email', count: 'drugReferencesCount', value: HIDDEN.adminEmail, visibleTo: ['admin'],
    where: (v) => `{ products: { some: { organization: { memberships: { some: { user: { ${sw('email')(v)} } } } } } } }` },
  { label: 'DrugReference > reviewedBy.email', count: 'drugReferencesCount', value: HIDDEN.adminEmail, visibleTo: ['admin'],
    where: (v) => `{ reviewedBy: { ${sw('email')(v)} } }` },
  // Limited staff, through lists they can read.
  { label: 'Order.email', count: 'ordersCount', value: HIDDEN.orderEmail, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ ${sw('email')(v)} }` },
  { label: 'Order.phone', count: 'ordersCount', value: HIDDEN.orderPhone, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ ${sw('phone')(v)} }` },
  { label: 'Order.customerName', count: 'ordersCount', value: HIDDEN.orderName, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ ${sw('customerName')(v)} }` },
  { label: 'Order > patient.lastName', count: 'ordersCount', value: HIDDEN.patientLast, visibleTo: [], where: (v) => `{ patient: { ${sw('lastName')(v)} } }` },
  { label: 'Order > patient allergy', count: 'ordersCount', value: HIDDEN.allergen, visibleTo: [], where: (v) => `{ patient: { allergies: { some: { ${sw('allergen')(v)} } } } }` },
  { label: 'Order > prescription.prescriptionNumber', count: 'ordersCount', value: HIDDEN.rxNumber, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ prescription: { ${sw('prescriptionNumber')(v)} } }` },
  { label: 'Order > prescription > items.sig', count: 'ordersCount', value: HIDDEN.sig, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ prescription: { items: { some: { ${sw('sig')(v)} } } } }` },
  { label: 'Order > payments.externalPaymentId', count: 'ordersCount', value: HIDDEN.paymentId, visibleTo: ['admin', 'cashier'], where: (v) => `{ payments: { some: { ${sw('externalPaymentId')(v)} } } }` },
  { label: 'Order > customer.email', count: 'ordersCount', value: HIDDEN.customerEmail, visibleTo: [], where: (v) => `{ customer: { ${sw('email')(v)} } }` },
  { label: 'Order > organization > memberships.user.email', count: 'ordersCount', value: HIDDEN.adminEmail, visibleTo: ['admin'], where: (v) => `{ organization: { memberships: { some: { user: { ${sw('email')(v)} } } } } }` },
  { label: 'Role > assignedTo.email', count: 'rolesCount', value: HIDDEN.adminEmail, visibleTo: ['admin'], where: (v) => `{ assignedTo: { some: { ${sw('email')(v)} } } }` },
  { label: 'Organization > patients.firstName', count: 'organizationsCount', value: HIDDEN.patientFirst, visibleTo: [], where: (v) => `{ patients: { some: { ${sw('firstName')(v)} } } }` },
  { label: 'Organization > memberships.user.email', count: 'organizationsCount', value: HIDDEN.adminEmail, visibleTo: ['admin'], where: (v) => `{ memberships: { some: { user: { ${sw('email')(v)} } } } }` },
  { label: 'PharmacyLocation > prescriptions > patient.lastName', count: 'pharmacyLocationsCount', value: HIDDEN.patientLast, visibleTo: [], where: (v) => `{ prescriptions: { some: { patient: { ${sw('lastName')(v)} } } } }` },
  { label: 'Fulfillment > order.email', count: 'fulfillmentsCount', value: HIDDEN.orderEmail, visibleTo: ['admin', 'pharmacist', 'technician'], where: (v) => `{ order: { ${sw('email')(v)} } }` },
]

describe.skipIf(!hasDb)('relation and hidden-field filters never reveal what the viewer cannot read', () => {
  let context: any
  const sessions: Partial<Record<Viewer, any>> = {}

  beforeAll(async () => {
    const [{ getContext }, prismaModule, configModule] = await Promise.all([
      import('@keystone-6/core/context'),
      import('@prisma/client'),
      import('../features/keystone'),
    ])
    context = getContext(configModule.default as any, prismaModule as any)
    const db = context.prisma

    const org = await db.organization.create({ data: { name: `Store ${run}`, slug: `store-${run}`, storefrontKey: `store-${run}`, storefrontHost: `store-${run}.example.com`, status: 'active' } })
    const location = await db.pharmacyLocation.create({ data: { name: `Main ${run}`, code: `M${run}`, organizationId: org.id, status: 'active' } })
    const users: Partial<Record<Viewer, any>> = {}
    for (const [viewer, role] of Object.entries(ROLES) as [keyof typeof ROLES, typeof ROLES[keyof typeof ROLES]][]) {
      const { name, ...flags } = role
      const roleRow = await db.role.create({ data: { name: `${name} ${run}`, ...flags } })
      const email = viewer === 'admin' ? HIDDEN.adminEmail : `${viewer}${run}@example.com`
      const user = await db.user.create({ data: { name: `${name} ${run}`, email, password: 'x', roleId: roleRow.id } })
      await db.organizationMembership.create({ data: {
        membershipKey: `${org.id}:${user.id}`, userId: user.id, organizationId: org.id, status: 'active',
        // The admin is organization-wide; every other role is bound to the location, as on the live store.
        locationId: viewer === 'admin' ? null : location.id,
      } })
      users[viewer] = user
      sessions[viewer] = { itemId: user.id, listKey: 'User', data: { name: user.name, role: { id: roleRow.id, ...role } } }
    }
    const buyer = await db.user.create({ data: { name: 'Buyer', email: HIDDEN.customerEmail, password: 'x' } })
    const viewerCustomer = await db.user.create({ data: { name: 'Other shopper', email: `shopper${run}@example.com`, password: 'x' } })
    sessions.customer = { itemId: viewerCustomer.id, listKey: 'User', data: { name: viewerCustomer.name, role: null } }

    const drug = await db.drugReference.create({ data: { ndc11: String(Date.now()).slice(-11).padStart(11, '7'), proprietaryName: `Drug ${run}`, genericName: 'g', strength: '5 mg', dosageForm: 'tablet', reviewedById: users.admin.id } })
    const product = await db.product.create({ data: { title: `Product ${run}`, handle: `product-${run}`, sku: `SKU-${run}`, priceAmount: 100, organizationId: org.id, locationId: location.id, drugReferenceId: drug.id } })
    const patient = await db.patientProfile.create({ data: { patientNumber: `P-${run}`, firstName: HIDDEN.patientFirst, lastName: HIDDEN.patientLast, phone: `${HIDDEN.patientPhone}0101`, organizations: { connect: [{ id: org.id }] } } })
    await db.patientAllergy.create({ data: { allergyKey: `allergy:${run}`, requestFingerprint: run, allergen: HIDDEN.allergen, organizationId: org.id, patientId: patient.id, recordedById: users.admin.id } })
    const prescriber = await db.prescriber.create({ data: { name: `Dr ${run}`, organizationId: org.id } })
    const prescription = await db.prescription.create({ data: { prescriptionNumber: HIDDEN.rxNumber, organizationId: org.id, locationId: location.id, patientId: patient.id, prescriberId: prescriber.id } })
    await db.prescriptionItem.create({ data: { medicationNameSnapshot: `Drug ${run}`, sig: HIDDEN.sig, quantityPrescribed: 30, prescriptionId: prescription.id, drugReferenceId: drug.id, productId: product.id } })
    const order = await db.order.create({ data: {
      orderNumber: `RXO-${run}`, idempotencyKey: `order-${run}`, guestTokenHash: `hash-${run}`, email: HIDDEN.orderEmail, phone: `${HIDDEN.orderPhone}0199`,
      customerName: HIDDEN.orderName, subtotalAmount: 100, totalAmount: 100, organizationId: org.id, locationId: location.id,
      customerId: buyer.id, patientId: patient.id, prescriptionId: prescription.id,
    } })
    await db.payment.create({ data: { amount: 100, externalPaymentId: HIDDEN.paymentId, orderId: order.id, organizationId: org.id, locationId: location.id } })
    await db.fulfillment.create({ data: { method: 'pickup', organizationId: org.id, locationId: location.id, orderId: order.id } })
  }, 120_000)

  afterAll(async () => { await context?.prisma.$disconnect() })

  function as(viewer: Viewer) {
    return viewer === 'signedOut' ? context.withSession(undefined) : context.withSession(sessions[viewer])
  }

  async function count(viewer: Viewer, probe: Probe, value: string): Promise<number | 'refused'> {
    const result = await as(viewer).graphql.raw({ query: `{ n: ${probe.count}(where: ${probe.where(value)}) }` })
    if (result.errors?.length) return 'refused'
    return result.data.n as number
  }

  for (const viewer of VIEWERS) {
    it(`${viewer}: every probe gives the same count for a hit and a miss unless the value is readable`, async () => {
      const leaks: string[] = []
      const blind: string[] = []
      for (const probe of PROBES) {
        const hit = await count(viewer, probe, prefix(probe.value))
        const miss = await count(viewer, probe, MISS)
        const readable = probe.visibleTo.includes(viewer)
        if (!readable && hit !== 'refused' && hit !== miss) leaks.push(`${probe.label}: ${hit} vs ${miss}`)
        if (readable && !(typeof hit === 'number' && typeof miss === 'number' && hit !== miss)) blind.push(`${probe.label}: ${hit} vs ${miss}`)
      }
      expect(leaks, 'filters that reveal hidden data').toEqual([])
      expect(blind, 'filters the viewer is entitled to that stopped working').toEqual([])
    }, 120_000)
  }

  it('Order email, phone and customer name sort only for roles that can read them', async () => {
    for (const viewer of VIEWERS) {
      for (const field of ['email', 'phone', 'customerName']) {
        const result = await as(viewer).graphql.raw({ query: `{ orders(orderBy: [{ ${field}: asc }], take: 1) { id } }` })
        const allowed = ['admin', 'pharmacist', 'technician'].includes(viewer)
        if (viewer === 'signedOut' || viewer === 'customer') continue // no orders to sort; refused or empty is fine
        expect(Boolean(result.errors?.length), `${viewer} orderBy ${field}`).toBe(!allowed)
      }
    }
  }, 60_000)

  it('secrets are never filterable, even for the admin', async () => {
    for (const viewer of VIEWERS) {
      for (const query of [
        '{ n: usersCount(where: { password: { isSet: true } }) }',
        `{ n: ordersCount(where: { guestTokenHash: { startsWith: "hash" } }) }`,
        `{ n: usersCount(where: { tokenVersion: { equals: 0 } }) }`,
      ]) {
        const result = await as(viewer).graphql.raw({ query })
        expect(Boolean(result.errors?.length), `${viewer} ${query}`).toBe(true)
      }
    }
  }, 60_000)

  it('sudo contexts keep full relation filters for server code', async () => {
    const n = await context.sudo().query.DrugReference.count({ where: { prescriptionItems: { some: { prescription: { patient: { lastName: { startsWith: prefix(HIDDEN.patientLast) } } } } } } })
    expect(n).toBe(1)
  })
})
