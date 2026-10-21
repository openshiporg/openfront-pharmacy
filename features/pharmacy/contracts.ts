export type PublicPharmacyOperatorBrandProjection = {
  organizationId: string
  tenantKey: string
  displayName: string
  tagline: string
  primaryColor: string
  accentColor: string
  logoUrl?: string | null
  logoIcon?: string | null
  logoColor?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
}

export type PublicPharmacyLocationProjection = {
  id: string
  name: string
  code: string
  address?: Record<string, unknown> | null
  phone?: string | null
  onlineOrderingEnabled: boolean
  pickupEnabled: boolean
  deliveryEnabled: boolean
}

export type PublicPharmacyTenantProjection = {
  brand: PublicPharmacyOperatorBrandProjection
  locations: PublicPharmacyLocationProjection[]
  locationsTotalCount: number
  hasMoreLocations: boolean
  nextLocationCursor: string | null
}

export type PharmacyCatalogProductProjection = {
  id: string
  title: string
  handle: string
  sku: string
  description?: string | null
  category?: string | null
  priceAmount: number
  currencyCode: string
  taxable: boolean
  imageUrl?: string | null
  prescriptionRequirement: string
  availableQuantity?: number
  inStock?: boolean
}

export type PublicPharmacyCatalogProductProjection = Omit<PharmacyCatalogProductProjection, 'availableQuantity' | 'inStock'> & {
  availableQuantity: number | null
  inStock: boolean | null
  inventorySummaryStatus: 'not_verified' | 'verified'
}

export type PublicPharmacyCatalogPageProjection = {
  items: PublicPharmacyCatalogProductProjection[]
  totalCount: number
  hasMore: boolean
  nextCursor: string | null
}

export type PharmacyCatalogQueueProjection = {
  id: string
  title: string
  handle: string
  sku: string
  status: string
  category: string
  prescriptionRequirement: string
  priceAmount: number
  currencyCode: string
  onlineAvailable: boolean
  posAvailable: boolean
  coldChainRequired: boolean
  locationId: string
  locationName: string
  availableQuantity: number | null
  quarantinedQuantity: number | null
  inventorySummaryStatus: 'not_verified'
}

export type PharmacyCartProductProjection = PharmacyCatalogProductProjection

export type PharmacyCartProjection = {
  id: string
  status: string
  fulfillmentMethod: string
  subtotalAmount: number
  taxAmount: number
  deliveryAmount: number
  totalAmount: number
  expiresAt?: string | null
  organization: { id: string; name: string }
  location: { id: string; name: string; pickupEnabled: boolean; deliveryEnabled: boolean }
  items: Array<{
    id: string
    quantity: number
    unitPriceAmount: number
    product: PharmacyCartProductProjection
  }>
}

export type PharmacyOperatorLocationProjection = Pick<PublicPharmacyLocationProjection, 'id' | 'name' | 'code' | 'pickupEnabled' | 'deliveryEnabled'> & { operatorDisplayName: string; operatorPhone?: string | null; cashSalesEnabled: boolean; cashTaxRateBps: number }
export type PharmacyPaymentProviderOption = { code: string; name: string }
export type PharmacyPaymentSessionResult = {
  id: string
  amount: number
  currencyCode: string
  status: string
  providerCode: string
  providerName: string
  clientSecret?: string | null
}

export type GuestPharmacyOrderProjection = {
  id: string
  orderNumber: string
  status: string
  fulfillmentMethod: string
  subtotalAmount: number
  taxAmount: number
  deliveryAmount: number
  totalAmount: number
  currencyCode: string
  pickupAt?: string | null
  deliveryWindow?: string | null
  createdAt: string
  locationName: string
  lines: Array<{ id: string; title: string; sku?: string | null; quantity: number; unitPriceAmount: number; lineTotalAmount: number; imageUrl?: string | null; prescriptionRequirement: string }>
  fulfillment?: { method: string; status: string; readyAt?: string | null; handedOffAt?: string | null } | null
}

export type SubmitPharmacyOrderProjection = {
  success: boolean
  reused?: boolean | null
  orderId: string
  orderNumber: string
  status: string
  fulfillmentStatus: string
  totalAmount: number
  currencyCode: string
  guestOrderToken?: string | null
}

export type PharmacyTaskOption = { id: string; label: string; scopeId: string; detail?: string | null }
export type PharmacyPrescriptionIntakeOptions = {
  organizations: PharmacyTaskOption[]
  locations: PharmacyTaskOption[]
  patients: PharmacyTaskOption[]
  prescribers: PharmacyTaskOption[]
  products: PharmacyTaskOption[]
}
export type PharmacyInventoryReceiptOptions = { locations: PharmacyTaskOption[]; suppliers: PharmacyTaskOption[] }
export type PharmacyProductOptionWorklistProjection = { items: PharmacyTaskOption[]; totalCount: number; hasMore: boolean; nextCursor?: string | null }
export type PharmacyRecallLotOption = { id: string; label: string; organizationId: string; locationId: string; detail?: string | null }
export type PharmacyRecallOpenOptions = { organizations: PharmacyTaskOption[]; organizationWideOrganizationIds: string[]; locations: PharmacyTaskOption[]; lots: PharmacyRecallLotOption[] }

export type PharmacyPrescriptionQueueProjection = {
  id: string
  prescriptionNumber: string
  status: string
  source: string
  sourceVerificationStatus: string
  createdAt: string
  writtenAt?: string | null
  patientDisplayName: string
  prescriberName: string
  prescriberVerificationStatus: string
  locationName: string
  medicationName?: string | null
  quantityPrescribed?: number | null
  refillsRemaining?: number | null
  openRefillCount?: number | null
  openTransferCount?: number | null
}

export type PharmacyPrescriptionTaskProjection = {
  id: string
  prescriptionNumber: string
  status: string
  source: string
  sourceVerificationStatus: string
  writtenAt?: string | null
  expiresAt?: string | null
  patientId: string
  patientDisplayName: string
  patientIdentityVerificationStatus: string
  patientIdentityEvidenceRecorded: boolean
  prescriberId: string
  prescriberName: string
  prescriberVerificationStatus: string
  locationId: string
  locationName: string
  operatorDisplayName: string
  operatorPhone?: string | null
  cashSalesEnabled: boolean
  cashTaxRateBps: number
  approvalRecorded: boolean
  approvedAt?: string | null
  availableActions: string[]
  items: Array<{
    id: string
    fillLineage?: string | null
    medicationName: string
    sig: string
    quantityPrescribed: number
    daysSupply?: number | null
    refillsAuthorized: number
    refillsRemaining: number
    substitutionAllowed: boolean
    productId: string
    productTitle: string
    productSku: string
    priceAmount: number
    currencyCode: string
    taxable: boolean
    eligibleLots: Array<{ id: string; lotNumber: string; expirationDate: string; eligibleQuantity: number; coldChainRequired: boolean }>
  }>
  patientAllergies: Array<{ id: string; allergen: string; reaction: string; severity: string }>
  patientMedications: Array<{ id: string; medicationName: string; directions?: string | null }>
  safetyReviews: Array<{ id: string; fillNumber: number; outcome: string; reviewReference: string; notes?: string | null; overrideReason?: string | null; reviewedAt: string; pharmacistName: string }>
  dispensingLabels: Array<{ id: string; labelNumber: string; fillNumber: number; operatorName: string; operatorPhone?: string | null; locationName: string; locationAddress?: Record<string, unknown> | null; patientName: string; prescriberName: string; medicationName: string; sig: string; quantityDispensed: number; lotNumber: string; ndc11?: string | null; expirationDate: string; auxiliaryWarnings: string[]; counselingOutcome: string; dispensedAt: string }>
  refillRequests: Array<{ id: string; status: string; requestNote?: string | null; resolutionNote?: string | null; requestedAt: string; resolvedAt?: string | null; prescriptionItemId: string; medicationName: string }>
  transfers: Array<{ id: string; direction: string; status: string; counterpartyName: string; counterpartyPhone?: string | null; requestedAt: string; completedAt?: string | null; consentRecorded: boolean }>
  reviews: Array<{ id: string; decision: string; reason: string; reviewedAt: string; pharmacistName: string }>
}

export type PharmacyInventoryLotProjection = {
  id: string
  lotNumber: string
  status: string
  expirationDate: string
  quantityAvailable: number
  quantityQuarantined: number
  coldChainRequired: boolean
  coldChainEvidenceComplete: boolean
  storageBin?: string | null
  productTitle: string
  productSku: string
  locationName: string
  activeRecallCount: number
  openExcursionCount: number
}

export type PharmacyInventoryWorklistProjection = {
  items: PharmacyInventoryLotProjection[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string | null
}

export type PharmacyInventoryLotTaskProjection = {
  id: string
  lotNumber: string
  serialNumber?: string | null
  status: string
  expirationDate: string
  receivedAt: string
  quantityReceived: number
  quantityAvailable: number
  quantityQuarantined: number
  eligibleQuantity: number
  storageBin?: string | null
  coldChainRequired: boolean
  minimumTemperatureC?: number | null
  maximumTemperatureC?: number | null
  coldChainEvidenceComplete: boolean
  productId: string
  productTitle: string
  productSku: string
  locationId: string
  locationName: string
  canAdjust: boolean
  recalls: Array<{ id: string; recallNumber: string; status: string; classification: string }>
  excursions: Array<{ id: string; status: string; observedMinimumC: number; observedMaximumC: number; startedAt: string; endedAt?: string | null }>
  movements: Array<{ id: string; movementType: string; quantityDelta: number; reason: string; occurredAt: string; actorName: string }>
}

export type PharmacyRecallQueueProjection = {
  id: string
  recallNumber: string
  classification: string
  status: string
  reason: string
  source?: string | null
  initiatedAt: string
  locationName?: string | null
  affectedLotCount: number
  quarantinedLotCount: number
  unresolvedExposureCount: number
  approvalRecorded: boolean
  approvedAt?: string | null
  approvedBy?: string | null
}

export type PharmacyRecallTaskProjection = {
  id: string
  recallNumber: string
  classification: string
  status: string
  reason: string
  source?: string | null
  initiatedAt: string
  closedAt?: string | null
  locationId?: string | null
  locationName?: string | null
  approvalRecorded: boolean
  approvedAt?: string | null
  approvedBy?: string | null
  canQuarantine: boolean
  canClose: boolean
  unlinkedExposureCount: number
  exposureReconciliationComplete: boolean
  exposures: Array<{ id: string; status: string; quantityDispensed: number; contactMethod?: string | null; outcome?: string | null; notes?: string | null; lastActionAt?: string | null; resolvedAt?: string | null; patientId: string; patientDisplayName: string; prescriptionId?: string | null; prescriptionNumber?: string | null; orderId?: string | null; orderNumber?: string | null }>
  lots: Array<{ id: string; lotNumber: string; status: string; quantityAvailable: number; quantityQuarantined: number; productTitle: string; productSku: string; locationName: string }>
}

export type PharmacyOrderQueueProjection = {
  id: string
  orderNumber: string
  status: string
  fulfillmentMethod: string
  totalAmount: number
  currencyCode: string
  createdAt: string
  locationName: string
  lineItemCount: number
  hasPrescriptionLines: boolean
  fulfillmentId?: string | null
  fulfillmentStatus: string
  paymentStatus: string
}

export type PharmacyOrderWorklistProjection = {
  items: PharmacyOrderQueueProjection[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string | null
}

export type PharmacyOrderTaskProjection = {
  id: string
  orderNumber: string
  status: string
  fulfillmentMethod: string
  subtotalAmount: number
  taxAmount: number
  deliveryAmount: number
  totalAmount: number
  currencyCode: string
  createdAt: string
  pickupAt?: string | null
  deliveryWindow?: string | null
  locationId: string
  locationName: string
  availableFulfillmentStatuses: string[]
  lines: Array<{ id: string; title: string; sku?: string | null; ndc11?: string | null; quantity: number; unitPriceAmount: number; lineTotalAmount: number; prescriptionRequirement: string }>
  fulfillment?: { id: string; method: string; status: string; readyAt?: string | null; handedOffAt?: string | null; assignedToName?: string | null } | null
  payment?: { id: string; status: string; amount: number; currencyCode: string; processedAt?: string | null; tenderMethod: string; cashReceivedAmount?: number | null; changeDueAmount?: number | null; providerName: string; providerCode: string } | null
}

export type PharmacyPatientPortalProjection = {
  id: string
  patientNumber: string
  displayName: string
  preferredContactMethod: string
  prescriptions: Array<{ id: string; prescriptionItemId: string; prescriptionNumber: string; status: string; locationId: string; locationName: string; prescriberName: string; medicationName: string; refillsRemaining: number; itemVersion?: string | null; fillLineage?: string | null; refillEligible?: boolean; lastRefillStatus?: string | null }>
  orders: Array<{ id: string; orderNumber: string; status: string; fulfillmentStatus: string; totalAmount: number; currencyCode: string; createdAt: string }>
}

export type PatientSafeProjection = {
  id: string
  patientNumber: string
  displayName: string
  status: string
  preferredContactMethod: string
  identityVerificationStatus: string
  hasIdentityEvidence: boolean
  organizationNames: string[]
  prescriptionCount: number
  activeConsentCount: number
  latestConsentAt?: string | null
  allergies: Array<{ id: string; allergen: string; reaction: string; severity: string; status: string; source: string; recordedAt: string }>
  medications: Array<{ id: string; medicationName: string; directions?: string | null; status: string; source: string; recordedAt: string }>
}

export type PharmacyIntegrationStatusProjection = {
  id: string
  name: string
  code: string
  providerType: string
  status: string
  externalValidationComplete: boolean
  hasValidationReference: boolean
  organizationName: string
}

export type PharmacyAuditTimelineProjection = {
  id: string
  eventKey?: string | null
  eventType: string
  resourceType: string
  resourceId: string
  occurredAt: string
  actorType: string
  actorName?: string | null
  locationName?: string | null
}

export type PharmacyOutboxTimelineProjection = {
  id: string
  eventKey: string
  eventType: string
  aggregateType: string
  aggregateId: string
  status: string
  attempts: number
  replayCount: number
  occurredAt: string
  processedAt?: string | null
  hasError: boolean
}
