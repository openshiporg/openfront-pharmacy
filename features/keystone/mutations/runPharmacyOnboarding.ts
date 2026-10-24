import type { Context } from '.keystone/types'
import seedDefaults from '../../platform/onboarding/lib/seed.json'
import { DEFAULT_STORE_LOGO_COLOR, DEFAULT_STORE_LOGO_ICON } from '../../lib/store-logo'
import { normalizeStorefrontTenantKey } from '../../pharmacy/branding'
import { permissions } from '../access'
import { recordAuditAndOutbox } from './lib/evidence'
import { withDomainTransaction } from './lib/transaction'
import { DomainError } from './lib/errors'

type OnboardingTemplate = 'minimal' | 'full'

const ONBOARDING_STATUSES = ['not_started', 'in_progress', 'completed', 'dismissed']

export async function pharmacyOnboardingState(_root: unknown, _args: unknown, context: Context) {
  const userId = context.session?.itemId
  if (!userId) throw new DomainError('Authentication required')
  const user = await context.sudo().query.User.findOne({ where: { id: userId }, query: 'id onboardingStatus' })
  if (!user) throw new DomainError('Authenticated user not found')
  return { userId: user.id, status: user.onboardingStatus || 'not_started', canManageOnboarding: permissions.canManageOnboarding({ session: context.session as any }) }
}

export async function setPharmacyOnboardingStatus(_root: unknown, args: { status: string }, context: Context) {
  const userId = context.session?.itemId
  if (!userId) throw new DomainError('Authentication required')
  if (!ONBOARDING_STATUSES.includes(args.status)) throw new DomainError('Invalid onboarding status')
  const user = await context.sudo().query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: args.status }, query: 'id onboardingStatus' })
  return { userId: user.id, status: user.onboardingStatus || args.status }
}

function relativeDate(days: number) {
  const value = new Date()
  value.setUTCDate(value.getUTCDate() + days)
  value.setUTCHours(12, 0, 0, 0)
  return value.toISOString()
}

function birthDate(yearsAgo: number) {
  const value = new Date()
  value.setUTCFullYear(value.getUTCFullYear() - yearsAgo)
  value.setUTCMonth(0, 15)
  value.setUTCHours(12, 0, 0, 0)
  return value.toISOString()
}

function requestStorefrontHost(context: Context) {
  const host = (context as any).req?.headers?.host
  if (typeof host !== 'string' || !host.trim()) return null
  try {
    const normalized = normalizeStorefrontTenantKey(host)
    return ['localhost', '127.0.0.1', '::1'].includes(normalized) ? null : normalized
  } catch {
    return null
  }
}

const forTemplate = <T extends { profile?: string }>(entries: T[] | undefined, template: OnboardingTemplate) =>
  (entries || []).filter((entry) => template === 'full' || entry.profile !== 'full')

const withoutProfile = <T extends { profile?: string }>({ profile: _profile, ...entry }: T) => entry

export async function runPharmacyOnboarding(_root: unknown, args: { template?: OnboardingTemplate | null }, context: Context) {
  const userId = context.session?.itemId
  if (!userId || !permissions.canManageOnboarding({ session: context.session as any })) throw new DomainError('You do not have permission to run onboarding')
  const template: OnboardingTemplate = args.template === 'minimal' ? 'minimal' : 'full'
  const seed: any = seedDefaults
  const products = forTemplate<any>(seed.products, template)
  const selectedSkus = new Set(products.map((product: any) => product.sku))
  const lots = (seed.lots || []).filter((lot: any) => selectedSkus.has(lot.sku))
  const paymentProviders = forTemplate<any>(seed.paymentProviders, template)
  const suppliers = forTemplate<any>(seed.suppliers, template)
  const patients = template === 'full' ? seed.patients || [] : []
  const prescribers = template === 'full' ? seed.prescribers || [] : []
  const storefrontHost = requestStorefrontHost(context) || seed.organization.slug

  return withDomainTransaction(context, [`onboarding:${userId}`, `onboarding-store:${seed.organization.slug}`], async (transactionContext) => {
    const sudo = transactionContext.sudo()
    const [memberships, existingOrganizations, existingLocations] = await Promise.all([
      sudo.query.OrganizationMembership.findMany({ where: { user: { id: { equals: userId } } }, query: 'id status location { id } organization { id }' }),
      sudo.query.Organization.findMany({ where: { OR: [{ slug: { equals: seed.organization.slug } }, { storefrontKey: { equals: seed.organization.storefrontKey } }, { storefrontHost: { equals: storefrontHost } }] }, take: 1, query: 'id' }),
      sudo.query.PharmacyLocation.findMany({ where: { code: { equals: seed.location.code } }, take: 1, query: 'id organization { id }' }),
    ])
    const organizationConflict = existingOrganizations[0]
    const locationConflict = existingLocations[0]

    // Re-running after a completed setup returns the existing store instead of creating a second one.
    const ownerMembership = organizationConflict
      ? memberships.find((entry: any) => entry.organization?.id === organizationConflict.id && !entry.location && entry.status === 'active')
      : null
    if (ownerMembership && organizationConflict) {
      await sudo.query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: 'completed' }, query: 'id' })
      const [productCount, lotCount, patientCount, prescriberCount, supplierCount, paymentProviderCount] = await Promise.all([
        sudo.query.Product.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.InventoryLot.count({ where: { product: { organization: { id: { equals: organizationConflict.id } } } } }),
        sudo.query.PatientProfile.count({ where: { organizations: { some: { id: { equals: organizationConflict.id } } } } }),
        sudo.query.Prescriber.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.Supplier.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.PaymentProvider.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
      ])
      return {
        completed: true,
        reused: true,
        template,
        organizationId: organizationConflict.id,
        locationId: locationConflict?.organization?.id === organizationConflict.id ? locationConflict.id : null,
        counts: { drugReferences: 0, paymentProviders: paymentProviderCount, suppliers: supplierCount, products: productCount, lots: lotCount, patients: patientCount, prescribers: prescriberCount, prescriptions: 0 },
      }
    }
    if (memberships.some((entry: any) => entry.status === 'active') || organizationConflict || locationConflict) {
      throw new DomainError('Store data already exists. Onboarding can only run on a new installation.')
    }

    const organization = await sudo.query.Organization.createOne({
      data: {
        logoIcon: DEFAULT_STORE_LOGO_ICON,
        logoColor: DEFAULT_STORE_LOGO_COLOR,
        ...seed.organization,
        storefrontHost,
        status: 'active',
        cashSalesEnabled: true,
        cashTaxRateBps: seed.cashPolicy?.taxRateBps ?? 0,
        cashTaxPolicyReference: seed.cashPolicy?.policyReference,
        cashPolicyReviewedAt: new Date().toISOString(),
        cashPolicyReviewedBy: { connect: { id: userId } },
      },
      query: 'id',
    })
    const connectOrganization = { connect: { id: organization.id } }
    // The owner's organization-wide membership comes first: PharmacyLocation requires it to create a location.
    await sudo.query.OrganizationMembership.createOne({
      data: { user: { connect: { id: userId } }, organization: connectOrganization, status: 'active', membershipRole: 'owner' },
      query: 'id',
    })
    const location = await sudo.query.PharmacyLocation.createOne({
      data: { ...seed.location, status: 'active', organization: connectOrganization, onlineOrderingEnabled: true, pickupEnabled: true, deliveryEnabled: false },
      query: 'id',
    })
    const connectLocation = { connect: { id: location.id } }

    for (const provider of paymentProviders) {
      await sudo.query.PaymentProvider.createOne({ data: { ...withoutProfile(provider), organization: connectOrganization }, query: 'id' })
    }
    for (const provider of seed.integrationProviders || []) {
      await sudo.query.IntegrationProvider.createOne({
        data: { ...provider, status: 'unconfigured', submitFunction: 'unconfigured', statusFunction: 'unconfigured', webhookFunction: 'unconfigured', externalValidationComplete: false, organization: connectOrganization },
        query: 'id',
      })
    }
    const supplierIds: string[] = []
    for (const supplier of suppliers) {
      const created = await sudo.query.Supplier.createOne({ data: { ...withoutProfile(supplier), organization: connectOrganization }, query: 'id' })
      supplierIds.push(created.id)
    }

    const references = new Map<string, string>()
    for (const entry of seed.drugReferences || []) {
      const existing = await sudo.query.DrugReference.findOne({ where: { ndc11: entry.ndc11 }, query: 'id' })
      const reference = existing || await sudo.query.DrugReference.createOne({ data: entry, query: 'id' })
      references.set(entry.ndc11, reference.id)
    }

    const productIds = new Map<string, string>()
    for (const entry of products) {
      const product = await sudo.query.Product.createOne({
        data: {
          title: entry.title,
          handle: entry.handle,
          sku: entry.sku,
          category: entry.category,
          description: entry.description,
          prescriptionRequirement: entry.prescriptionRequirement,
          priceAmount: entry.priceAmount,
          imageUrl: entry.imageUrl,
          status: 'published',
          onlineAvailable: entry.prescriptionRequirement === 'none',
          posAvailable: true,
          organization: connectOrganization,
          location: connectLocation,
          ...(entry.ndc11 && references.get(entry.ndc11) ? { drugReference: { connect: { id: references.get(entry.ndc11) } } } : {}),
        },
        query: 'id',
      })
      productIds.set(entry.sku, product.id)
    }
    for (const entry of lots) {
      const productId = productIds.get(entry.sku)
      if (!productId) throw new DomainError(`Product ${entry.sku} is missing for lot ${entry.lotNumber}`)
      const lot = await sudo.query.InventoryLot.createOne({
        data: {
          lotNumber: entry.lotNumber,
          product: { connect: { id: productId } },
          location: connectLocation,
          ...(supplierIds[0] ? { supplier: { connect: { id: supplierIds[0] } } } : {}),
          expirationDate: relativeDate(entry.expirationOffsetDays),
          quantityReceived: entry.quantity,
          quantityAvailable: entry.quantity,
          quantityQuarantined: 0,
          status: 'available',
          storageBin: `MAIN-${entry.sku}`,
          coldChainRequired: entry.coldChainRequired,
          coldChainEvidenceComplete: !entry.coldChainRequired,
        },
        query: 'id',
      })
      await sudo.query.InventoryMovement.createOne({
        data: {
          movementType: 'receive',
          quantityDelta: entry.quantity,
          reason: 'Opening stock',
          idempotencyKey: `onboarding:${organization.id}:lot:${lot.id}`,
          occurredAt: new Date().toISOString(),
          organization: connectOrganization,
          location: connectLocation,
          product: { connect: { id: productId } },
          lot: { connect: { id: lot.id } },
          actor: { connect: { id: userId } },
        },
        query: 'id',
      })
    }

    for (const { ageYears, ...patient } of patients) {
      await sudo.query.PatientProfile.createOne({
        data: { ...patient, dateOfBirth: birthDate(ageYears || 40), status: 'active', organizations: { connect: [{ id: organization.id }] } },
        query: 'id',
      })
    }
    for (const prescriber of prescribers) {
      await sudo.query.Prescriber.createOne({
        data: { ...prescriber, verificationStatus: 'unverified', organization: connectOrganization },
        query: 'id',
      })
    }

    await sudo.query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: 'completed' }, query: 'id' })
    const counts = {
      drugReferences: references.size,
      paymentProviders: paymentProviders.length,
      suppliers: suppliers.length,
      products: products.length,
      lots: lots.length,
      patients: patients.length,
      prescribers: prescribers.length,
      prescriptions: 0,
    }
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `onboarding.completed:${organization.id}`,
      organizationId: organization.id,
      locationId: location.id,
      actorId: userId,
      eventType: 'onboarding.completed',
      resourceType: 'Organization',
      resourceId: organization.id,
      metadata: { template, ...counts },
    })
    return { completed: true, reused: false, template, organizationId: organization.id, locationId: location.id, counts }
  })
}
