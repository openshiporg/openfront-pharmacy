import { pharmacyCustomerAccount, pharmacyCustomerOrder, registerPharmacyCustomer } from './customerAccount'
import { mergeSchemas } from '@graphql-tools/schema'
import type { GraphQLSchema } from 'graphql'

import { pharmacyPosCustomers, pharmacyPosCashReceipt, refundPharmacyCashPayment, recordPharmacyCashPolicy, submitPharmacyPosCashOrder } from './cashWorkflows'
import { addPharmacyCartItem, createPharmacyCart, pharmacyCart, removePharmacyCartItem, updatePharmacyCartItem } from './cartOperations'
import { holdPrescriptionForClinicalReReview, recordPharmacyDrugReferenceReview, recordPrescriptionClinicalSafetyReview } from './clinicalWorkflows'
import { recordPharmacyPrescriberCredentialReview, recordPharmacyStaffCredentialReview } from './credentialWorkflows'
import { pharmacyFillPolicy, recordPharmacyFillPolicy, reservePharmacyPrescriptionFill, releasePharmacyPrescriptionFill } from './fillWorkflows'
import { pharmacyFillHistory } from './fillHistory'
import { pharmacyFillWorkbench } from './fillReadback'
import { transitionOrderFulfillment } from './fulfillmentWorkflows'
import { getGuestPharmacyOrder } from './getGuestPharmacyOrder'
import { adjustInventoryLot, quarantineRecallLots, receiveInventoryLot } from './inventoryWorkflows'
import { configurePharmacyIntegrationProvider, ingestPharmacyIntegrationWebhook, refreshPharmacyExternalWorkflow, submitPharmacyExternalWorkflow, validatePharmacyPrescriber } from './integrationWorkflows'
import { intakePharmacyPrescription } from './intakeWorkflows'
import { createPharmacyPatient, recordPharmacyPatientAllergy, recordPharmacyPatientMedication, updatePharmacyPatientContact } from './patientRecordWorkflows'
import { approvePrescriptionTransfer, linkPharmacyPatientAccount, requestPrescriptionRefill, requestPrescriptionTransfer, resolvePrescriptionRefill } from './patientWorkflows'
import {
  pharmacyAuditTimeline,
  pharmacyCatalogQueue,
  pharmacyCredentialReviewOptions,
  pharmacyIntegrationStatus,
  pharmacyInventoryReceiptOptions,
  pharmacyInventoryReceiptProductWorklist,
  pharmacyInventoryLotTask,
  pharmacyInventoryQueue,
  pharmacyOrderQueue,
  pharmacyOrderTask,
  pharmacyOperatorLocations,
  pharmacyOutboxQueue,
  pharmacyOutboxTimeline,
  pharmacyPatientAccountCandidates,
  pharmacyPatientDirectory,
  pharmacyPatientRecordOptions,
  pharmacyPatientPortal,
  pharmacyPatientSafeView,
  pharmacyPosCatalog,
  pharmacyPrescriberDirectory,
  pharmacyPrescriptionIntakeOptions,
  pharmacyPrescriptionQueue,
  pharmacyPrescriptionWorklist,
  pharmacyPrescriptionTask,
  pharmacyRecallOpenOptions,
  pharmacyRecallQueue,
  pharmacyRecallWorklist,
  pharmacyRecallTask,
} from './operationalQueries'
import { replayPharmacyOutboxEvent } from './outboxWorkflows'
import { activePharmacyPaymentProviders, initiatePharmacyPaymentSession, refundPharmacyPayment } from './paymentOperations'
import handlePaymentProviderWebhook from './handlePaymentProviderWebhook'
import { reconcilePharmacyPaymentSession } from './paymentRecovery'
import { authorizePrescriptionDispensing, recordPrescriptionDispensing, recordPrescriptionReview } from './prescriptionWorkflows'
import { closePharmacyRecall, disposeRecallLot, openPharmacyRecall, recordRecallExposureAction } from './recallWorkflows'
import { pharmacyOperationalSummary, publicPharmacyCatalog, publicPharmacyLocations, publicPharmacyTenant } from './publicQueries'
import redirectToInit from './redirectToInit'
import updateActiveUser from './updateActiveUser'
import { pharmacyOnboardingState, runPharmacyOnboarding, setPharmacyOnboardingStatus } from './runPharmacyOnboarding'
import { submitPharmacyOrder } from './submitPharmacyOrder'

const graphql = String.raw

export function extendGraphqlSchema(baseSchema: GraphQLSchema) {
  return mergeSchemas({
    schemas: [baseSchema],
    typeDefs: graphql`
      type PharmacyCatalogProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        imageUrl: String
        prescriptionRequirement: String!
        availableQuantity: Int!
        inStock: Boolean!
      }

      type PublicPharmacyCatalogProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        imageUrl: String
        prescriptionRequirement: String!
        availableQuantity: Int
        inStock: Boolean
        inventorySummaryStatus: String!
      }
      type PublicPharmacyCatalogWorklist { items: [PublicPharmacyCatalogProduct!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }

      type PharmacyCatalogQueueItem {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        status: String!
        category: String!
        prescriptionRequirement: String!
        priceAmount: Int!
        currencyCode: String!
        onlineAvailable: Boolean!
        posAvailable: Boolean!
        coldChainRequired: Boolean!
        locationId: ID!
        locationName: String!
        availableQuantity: Int
        quarantinedQuantity: Int
        inventorySummaryStatus: String!
      }

      type PharmacyTaskOption { id: ID!, label: String!, scopeId: ID!, detail: String }
      type PharmacyPrescriptionIntakeOptions {
        organizations: [PharmacyTaskOption!]!
        locations: [PharmacyTaskOption!]!
        patients: [PharmacyTaskOption!]!
        prescribers: [PharmacyTaskOption!]!
        products: [PharmacyTaskOption!]!
      }
      type PharmacyRecallLotOption { id: ID!, label: String!, organizationId: ID!, locationId: ID!, detail: String }
      type PharmacyRecallOpenOptions { organizations: [PharmacyTaskOption!]!, organizationWideOrganizationIds: [ID!]!, locations: [PharmacyTaskOption!]!, lots: [PharmacyRecallLotOption!]! }
      type PharmacyInventoryReceiptOptions {
        locations: [PharmacyTaskOption!]!
        suppliers: [PharmacyTaskOption!]!
      }
      type PharmacyProductOptionWorklist { items: [PharmacyTaskOption!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyPatientRecordOptions { organizations: [PharmacyTaskOption!]! }
      type PharmacyCredentialReviewOptions {
        organizationWideOrganizationIds: [ID!]!
        organizations: [PharmacyTaskOption!]!
        memberships: [PharmacyTaskOption!]!
        prescribers: [PharmacyTaskOption!]!
        drugReferences: [PharmacyTaskOption!]!
      }

      type PublicPharmacyLocation {
        id: ID!
        name: String!
        code: String!
        address: JSON
        phone: String
        onlineOrderingEnabled: Boolean!
        pickupEnabled: Boolean!
        deliveryEnabled: Boolean!
      }
      type PublicPharmacyOperatorBrand {
        organizationId: ID!
        tenantKey: String!
        displayName: String!
        tagline: String!
        primaryColor: String!
        accentColor: String!
        logoUrl: String
        logoIcon: String
        logoColor: String
        supportEmail: String
        supportPhone: String
      }
      type PublicPharmacyTenant {
        brand: PublicPharmacyOperatorBrand!
        locations: [PublicPharmacyLocation!]!
        locationsTotalCount: Int!
        hasMoreLocations: Boolean!
        nextLocationCursor: String
      }

      type PharmacyCartProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        imageUrl: String
        prescriptionRequirement: String!
      }
      type PharmacyCartItem { id: ID!, quantity: Int!, unitPriceAmount: Int!, product: PharmacyCartProduct! }
      type PharmacyCartOrganization { id: ID!, name: String! }
      type PharmacyCartLocation { id: ID!, name: String!, pickupEnabled: Boolean!, deliveryEnabled: Boolean! }
      type PharmacyCart {
        id: ID!
        status: String!
        fulfillmentMethod: String!
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        expiresAt: String
        organization: PharmacyCartOrganization!
        location: PharmacyCartLocation!
        items: [PharmacyCartItem!]!
      }
      type CreatePharmacyCartResult { cart: PharmacyCart!, guestToken: String }

      type PharmacyOperatorLocation { id: ID!, name: String!, code: String!, pickupEnabled: Boolean!, deliveryEnabled: Boolean!, operatorDisplayName: String!, operatorPhone: String, cashSalesEnabled: Boolean!, cashTaxRateBps: Int! }
      type PharmacyPaymentProviderOption { code: String!, name: String! }
      type PharmacyPaymentSessionResult {
        id: ID!
        amount: Int!
        currencyCode: String!
        status: String!
        providerCode: String!
        providerName: String!
        clientSecret: String
      }

      type GuestPharmacyOrderLine {
        id: ID!
        title: String!
        sku: String
        quantity: Int!
        unitPriceAmount: Int!
        lineTotalAmount: Int!
        imageUrl: String
        prescriptionRequirement: String!
      }
      type GuestPharmacyFulfillment { method: String!, status: String!, readyAt: String, handedOffAt: String }
      type GuestPharmacyOrder {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        currencyCode: String!
        pickupAt: String
        deliveryWindow: String
        createdAt: String!
        locationName: String!
        lines: [GuestPharmacyOrderLine!]!
        fulfillment: GuestPharmacyFulfillment
      }

      type PharmacyPrescriberDirectoryItem {
        id: ID!
        name: String!
        npi: String
        phone: String
        fax: String
        verificationStatus: String!
        externalValidationComplete: Boolean!
        organizationName: String!
        prescriptionCount: Int!
      }

      type PharmacyPrescriptionQueueItem {
        id: ID!
        prescriptionNumber: String!
        status: String!
        source: String!
        sourceVerificationStatus: String!
        createdAt: String!
        writtenAt: String
        patientDisplayName: String!
        prescriberName: String!
        prescriberVerificationStatus: String!
        locationName: String!
        medicationName: String
        quantityPrescribed: Int
        refillsRemaining: Int
        openRefillCount: Int
        openTransferCount: Int
      }
      type PharmacyPrescriptionWorklist { items: [PharmacyPrescriptionQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyEligibleLot {
        id: ID!
        lotNumber: String!
        expirationDate: String!
        eligibleQuantity: Int!
        coldChainRequired: Boolean!
      }
      type PharmacyPrescriptionTaskItem {
        id: ID!
        fillLineage: String
        medicationName: String!
        sig: String!
        quantityPrescribed: Int!
        daysSupply: Int
        refillsAuthorized: Int!
        refillsRemaining: Int!
        substitutionAllowed: Boolean!
        productId: ID!
        productTitle: String!
        productSku: String!
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        eligibleLots: [PharmacyEligibleLot!]!
      }
      type PharmacyPrescriptionPatientAllergy { id: ID!, allergen: String!, reaction: String!, severity: String! }
      type PharmacyPrescriptionPatientMedication { id: ID!, medicationName: String!, directions: String }
      type PharmacyClinicalSafetyReviewProjection { id: ID!, fillNumber: Int!, outcome: String!, reviewReference: String!, notes: String, overrideReason: String, reviewedAt: String!, pharmacistName: String! }
      type PharmacyDispensingLabelProjection { id: ID!, labelNumber: String!, fillNumber: Int!, operatorName: String!, operatorPhone: String, locationName: String!, locationAddress: JSON, patientName: String!, prescriberName: String!, medicationName: String!, sig: String!, quantityDispensed: Int!, lotNumber: String!, ndc11: String, expirationDate: String!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, dispensedAt: String! }
      type PharmacyRefillTaskProjection { id: ID!, status: String!, requestNote: String, resolutionNote: String, requestedAt: String!, resolvedAt: String, prescriptionItemId: ID!, medicationName: String! }
      type PharmacyTransferTaskProjection { id: ID!, direction: String!, status: String!, counterpartyName: String!, counterpartyPhone: String, requestedAt: String!, completedAt: String, consentRecorded: Boolean! }
      type PharmacyPrescriptionReviewProjection {
        id: ID!
        decision: String!
        reason: String!
        reviewedAt: String!
        pharmacistName: String!
      }
      type PharmacyPrescriptionTask {
        id: ID!
        prescriptionNumber: String!
        status: String!
        source: String!
        sourceVerificationStatus: String!
        writtenAt: String
        expiresAt: String
        patientId: ID!
        patientDisplayName: String!
        patientIdentityVerificationStatus: String!
        patientIdentityEvidenceRecorded: Boolean!
        prescriberId: ID!
        prescriberName: String!
        prescriberVerificationStatus: String!
        locationId: ID!
        locationName: String!
        operatorDisplayName: String!
        operatorPhone: String
        cashSalesEnabled: Boolean!
        cashTaxRateBps: Int!
        approvalRecorded: Boolean!
        approvedAt: String
        availableActions: [String!]!
        items: [PharmacyPrescriptionTaskItem!]!
        patientAllergies: [PharmacyPrescriptionPatientAllergy!]!
        patientMedications: [PharmacyPrescriptionPatientMedication!]!
        safetyReviews: [PharmacyClinicalSafetyReviewProjection!]!
        dispensingLabels: [PharmacyDispensingLabelProjection!]!
        refillRequests: [PharmacyRefillTaskProjection!]!
        transfers: [PharmacyTransferTaskProjection!]!
        reviews: [PharmacyPrescriptionReviewProjection!]!
      }

      type PharmacyInventoryLotQueueItem {
        id: ID!
        lotNumber: String!
        status: String!
        expirationDate: String!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        coldChainRequired: Boolean!
        coldChainEvidenceComplete: Boolean!
        storageBin: String
        productTitle: String!
        productSku: String!
        locationName: String!
        activeRecallCount: Int!
        openExcursionCount: Int!
      }
      type PharmacyInventoryWorklist { items: [PharmacyInventoryLotQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyInventoryMovementProjection {
        id: ID!
        movementType: String!
        quantityDelta: Int!
        reason: String!
        occurredAt: String!
        actorName: String!
      }
      type PharmacyTemperatureExcursionProjection {
        id: ID!
        status: String!
        observedMinimumC: Float!
        observedMaximumC: Float!
        startedAt: String!
        endedAt: String
      }
      type PharmacyRecallReference { id: ID!, recallNumber: String!, status: String!, classification: String! }
      type PharmacyInventoryLotTask {
        id: ID!
        lotNumber: String!
        serialNumber: String
        status: String!
        expirationDate: String!
        receivedAt: String!
        quantityReceived: Int!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        eligibleQuantity: Int!
        storageBin: String
        coldChainRequired: Boolean!
        minimumTemperatureC: Float
        maximumTemperatureC: Float
        coldChainEvidenceComplete: Boolean!
        productId: ID!
        productTitle: String!
        productSku: String!
        locationId: ID!
        locationName: String!
        canAdjust: Boolean!
        recalls: [PharmacyRecallReference!]!
        excursions: [PharmacyTemperatureExcursionProjection!]!
        movements: [PharmacyInventoryMovementProjection!]!
      }

      type PharmacyRecallQueueItem {
        id: ID!
        recallNumber: String!
        classification: String!
        status: String!
        reason: String!
        source: String
        initiatedAt: String!
        locationName: String
        affectedLotCount: Int!
        quarantinedLotCount: Int!
        unresolvedExposureCount: Int!
        approvalRecorded: Boolean!
        approvedAt: String
        approvedBy: String
      }
      type PharmacyRecallWorklist { items: [PharmacyRecallQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyRecallExposureProjection { id: ID!, status: String!, quantityDispensed: Int!, contactMethod: String, outcome: String, notes: String, lastActionAt: String, resolvedAt: String, patientId: ID!, patientDisplayName: String!, prescriptionId: ID, prescriptionNumber: String, orderId: ID, orderNumber: String }
      type PharmacyRecallLotProjection {
        id: ID!
        lotNumber: String!
        status: String!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        productTitle: String!
        productSku: String!
        locationName: String!
      }
      type PharmacyRecallTask {
        id: ID!
        recallNumber: String!
        classification: String!
        status: String!
        reason: String!
        source: String
        initiatedAt: String!
        closedAt: String
        locationId: ID
        locationName: String
        approvalRecorded: Boolean!
        approvedAt: String
        approvedBy: String
        canQuarantine: Boolean!
        canClose: Boolean!
        unlinkedExposureCount: Int!
        exposureReconciliationComplete: Boolean!
        exposures: [PharmacyRecallExposureProjection!]!
        lots: [PharmacyRecallLotProjection!]!
      }

      type PharmacyOrderQueueItem {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
        locationName: String!
        lineItemCount: Int!
        hasPrescriptionLines: Boolean!
        fulfillmentId: ID
        fulfillmentStatus: String!
        paymentStatus: String!
      }
      type PharmacyOrderWorklist { items: [PharmacyOrderQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyOrderLineProjection {
        id: ID!
        title: String!
        sku: String
        ndc11: String
        quantity: Int!
        unitPriceAmount: Int!
        lineTotalAmount: Int!
        prescriptionRequirement: String!
      }
      type PharmacyFulfillmentProjection {
        id: ID!
        method: String!
        status: String!
        readyAt: String
        handedOffAt: String
        assignedToName: String
      }
      type PharmacyPaymentProjection {
        id: ID!
        status: String!
        amount: Int!
        currencyCode: String!
        processedAt: String
        tenderMethod: String!
        cashReceivedAmount: Int
        changeDueAmount: Int
        providerName: String!
        providerCode: String!
      }
      type PharmacyOrderTask {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
        pickupAt: String
        deliveryWindow: String
        locationId: ID!
        locationName: String!
        availableFulfillmentStatuses: [String!]!
        lines: [PharmacyOrderLineProjection!]!
        fulfillment: PharmacyFulfillmentProjection
        payment: PharmacyPaymentProjection
      }

      type PharmacyPatientPortalPrescription {
        id: ID!
        prescriptionItemId: ID!
        prescriptionNumber: String!
        status: String!
        locationId: ID!
        locationName: String!
        prescriberName: String!
        medicationName: String!
        refillsRemaining: Int!
        itemVersion: String
        refillEligible: Boolean
        fillLineage: String
        lastRefillStatus: String
      }
      type PharmacyPatientPortalOrder {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentStatus: String!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
      }
      type PharmacyPatientPortal {
        id: ID!
        patientNumber: String!
        displayName: String!
        preferredContactMethod: String!
        prescriptions: [PharmacyPatientPortalPrescription!]!
        orders: [PharmacyPatientPortalOrder!]!
      }

      type PatientAllergyProjection { id: ID!, allergen: String!, reaction: String!, severity: String!, status: String!, source: String!, recordedAt: String! }
      type PatientMedicationProjection { id: ID!, medicationName: String!, directions: String, status: String!, source: String!, recordedAt: String! }
      type PatientSafeProjection {
        id: ID!
        patientNumber: String!
        displayName: String!
        status: String!
        preferredContactMethod: String!
        identityVerificationStatus: String!
        hasIdentityEvidence: Boolean!
        organizationNames: [String!]!
        prescriptionCount: Int!
        activeConsentCount: Int!
        latestConsentAt: String
        allergies: [PatientAllergyProjection!]!
        medications: [PatientMedicationProjection!]!
      }

      type PharmacyIntegrationStatus {
        id: ID!
        name: String!
        code: String!
        providerType: String!
        status: String!
        externalValidationComplete: Boolean!
        hasValidationReference: Boolean!
        organizationName: String!
      }
      type PharmacyAuditTimelineEvent {
        id: ID!
        eventKey: String
        eventType: String!
        resourceType: String!
        resourceId: String!
        occurredAt: String!
        actorType: String!
        actorName: String
        locationName: String
      }
      type PharmacyOutboxTimelineEvent {
        id: ID!
        eventKey: String!
        eventType: String!
        aggregateType: String!
        aggregateId: String!
        status: String!
        attempts: Int!
        replayCount: Int!
        occurredAt: String!
        processedAt: String
        hasError: Boolean!
      }

      type PharmacyPatientAccountLinkResult { success: Boolean!, reused: Boolean, patientId: ID!, userId: ID! }
      type PharmacyPatientRecordResult { success: Boolean!, reused: Boolean!, patientId: ID!, patientNumber: String, status: String! }
      type PharmacyPatientHistoryResult { success: Boolean!, reused: Boolean!, recordId: ID!, status: String! }
      type PharmacyClinicalSafetyReviewResult { success: Boolean!, reused: Boolean!, reviewId: ID!, prescriptionId: ID!, outcome: String!, approvalId: ID! }
      type PharmacyDrugReferenceReviewResult { success: Boolean!, reused: Boolean!, reviewId: ID!, status: String!, approvalId: ID! }
      type PharmacyCredentialReviewResult { success: Boolean!, membershipId: ID, prescriberId: ID, status: String!, expiresAt: String!, approvalId: ID! }
      type PharmacyRefundResult { success: Boolean!, reused: Boolean, paymentId: ID!, status: String!, amount: Int! }
      type PharmacyCashPolicyResult { success: Boolean!, organizationId: ID!, status: String!, taxRateBps: Int!, approvalId: ID! }
      type PharmacyPosCashReceiptLine { title: String!, sku: String!, quantity: Int!, unitPriceAmount: Int!, lineTotalAmount: Int! }
      type PharmacyPosCashOrderResult { success: Boolean!, reused: Boolean!, orderId: ID!, orderNumber: String!, status: String!, recordedAt: String!, lines: [PharmacyPosCashReceiptLine!]!, subtotalAmount: Int!, taxAmount: Int!, totalAmount: Int!, currencyCode: String!, paymentId: ID!, paymentStatus: String!, cashReceivedAmount: Int!, changeDueAmount: Int! }
      type PharmacyPaymentReconciliationResult { success: Boolean!, paymentSessionId: ID!, status: String! }
      type PharmacyPaymentWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyIntegrationConfigurationResult { success: Boolean!, providerId: ID!, status: String! }
      type PharmacyPrescriberValidationResult { success: Boolean!, prescriberId: ID!, status: String!, validationReference: String! }
      type PharmacyExternalWorkflowResult { success: Boolean!, reused: Boolean!, workflowId: ID!, status: String!, externalReference: String }
      type PharmacyIntegrationWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyPrescriptionActionResult { success: Boolean!, reused: Boolean, prescriptionId: ID, reviewId: ID, approvalId: ID, orderId: ID, orderNumber: String, receiptItemTitle: String, paymentId: ID, labelId: ID, status: String, totalAmount: Int, cashReceivedAmount: Int, changeDueAmount: Int, currencyCode: String }
      type PharmacyTransferResult { success: Boolean!, reused: Boolean, transferId: ID!, approvalId: ID, status: String! }
      type PharmacyRefillResult { success: Boolean!, reused: Boolean, refillRequestId: ID!, status: String!, approvalId: ID }
      type PharmacyFillCommandResult { success: Boolean!, reused: Boolean!, fillId: ID, status: String!, version: Int }
      type PharmacyFillEventProjection { id: ID!, action: String!, version: Int!, quantity: Int!, occurredAt: String!, actorName: String!, reason: String, orderId: ID, orderNumber: String }
      type PharmacyFillProjection {
        id: ID!, prescriptionItemId: ID!, refillRequestId: ID, kind: String!, status: String!, version: Int!, fillNumber: Int!,
        creditState: String!, authorizedQuantity: Int!, quantityDispensed: Int!, quantityReleased: Int!, quantityRemaining: Int!,
        expiresAt: String!, policyVersion: String!, policyReference: String!, allowPartial: Boolean!, releaseReasons: [String!]!,
        priceAmount: Int!, taxAmount: Int!, currencyCode: String!, taxable: Boolean!, itemVersion: String!,
        events: [PharmacyFillEventProjection!]!, hasMoreEvents: Boolean!
      }
      type PharmacyFillItemProjection { id: ID!, itemVersion: String!, lineage: String!, originalReservable: Boolean! }
      type PharmacyFillPolicyReadback { organizationId: ID!, configured: Boolean!, version: String }
      type PharmacyFillHistory { events: [PharmacyFillEventProjection!]!, hasMore: Boolean!, nextCursor: String }
      type PharmacyFillWorkbench { organizationId: ID!, policyConfigured: Boolean!, canConfigure: Boolean!,
        items: [PharmacyFillItemProjection!]!, fills: [PharmacyFillProjection!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyInventoryActionResult { success: Boolean!, reused: Boolean, movementId: ID, lotId: ID, quantityAvailable: Int, recallId: ID, lotCount: Int, unlinkedExposureCount: Int, approvalId: ID, status: String }
      type PharmacyRecallExposureActionResult { success: Boolean!, reused: Boolean!, exposureId: ID!, status: String!, approvalId: ID! }
      type SubmitPharmacyOrderResult {
        success: Boolean!
        reused: Boolean
        orderId: ID!
        orderNumber: String!
        status: String!
        fulfillmentStatus: String!
        totalAmount: Int!
        currencyCode: String!
        guestOrderToken: String
      }
      type PharmacyFulfillmentResult { success: Boolean!, reused: Boolean, fulfillmentId: ID!, orderId: ID!, approvalId: ID, status: String! }
      type PharmacyOutboxReplayResult { id: ID!, status: String!, replayCount: Int!, reused: Boolean! }
      type PharmacyOnboardingCounts { drugReferences: Int!, paymentProviders: Int!, suppliers: Int!, products: Int!, lots: Int!, patients: Int!, prescribers: Int!, prescriptions: Int! }
      type PharmacyOnboardingResult { completed: Boolean!, reused: Boolean!, template: String!, organizationId: ID!, locationId: ID, counts: PharmacyOnboardingCounts! }
      input UserUpdateProfileInput { email: String, name: String, password: String, onboardingStatus: String }
      type PharmacyOnboardingState { userId: ID!, status: String!, canManageOnboarding: Boolean! }
      type PharmacyOnboardingStatusResult { userId: ID!, status: String! }
      type PharmacyOperationalSummary { pendingReview: Int!, readyToDispense: Int!, activeRecalls: Int!, expiringLots: Int!, processingOrders: Int! }

      input PharmacyPosCashItemInput { productId: ID!, quantity: Int! }
      input PharmacyPrescriptionIntakeItemInput {
        productId: ID!
        medicationName: String!
        sig: String!
        quantity: Int!
        daysSupply: Int
        refillsAuthorized: Int!
        substitutionAllowed: Boolean!
      }
      input SubmitPharmacyOrderInput {
        cartId: ID!
        paymentSessionId: ID!
        idempotencyKey: String!
        guestToken: String
        email: String!
        phone: String
        fulfillmentMethod: String!
        pickupAt: String
        deliveryWindow: String
        shippingAddress: JSON
        privacyConsentAccepted: Boolean!
        policyVersion: String!
        statementKey: String!
      }

      type PharmacyCustomerLine { title: String!, quantity: Int!, unitPriceAmount: Int! }
      type PharmacyCustomerOrder { id: ID!, orderNumber: String!, status: String!, totalAmount: Int!, currencyCode: String!, createdAt: String!, lineItems: [PharmacyCustomerLine!]! }
      type PharmacyCustomerAccount { id: ID!, name: String!, hasPatientProfile: Boolean!, orders: [PharmacyCustomerOrder!]! }
      type Query {
        pharmacyPosCustomers(locationId: ID!): [PharmacyTaskOption!]!
        pharmacyCustomerAccount: PharmacyCustomerAccount!
        pharmacyCustomerOrder(orderId: ID!): PharmacyCustomerOrder!
        pharmacyFillPolicy(organizationId: ID!): PharmacyFillPolicyReadback!
        pharmacyFillHistory(prescriptionId: ID!, fillId: ID!, after: String): PharmacyFillHistory!
        pharmacyFillWorkbench(prescriptionId: ID!, after: String): PharmacyFillWorkbench!
        redirectToInit: Boolean
        publicPharmacyTenant(tenantKey: String, search: String, first: Int, after: String): PublicPharmacyTenant!
        publicPharmacyLocations(tenantKey: String): [PublicPharmacyLocation!]!
        publicPharmacyCatalog(tenantKey: String, locationId: ID!, search: String, first: Int, after: String): PublicPharmacyCatalogWorklist!
        pharmacyCatalogQueue: [PharmacyCatalogQueueItem!]!
        pharmacyPrescriptionIntakeOptions: PharmacyPrescriptionIntakeOptions!
        pharmacyInventoryReceiptOptions: PharmacyInventoryReceiptOptions!
        pharmacyInventoryReceiptProductWorklist(locationId: ID!, first: Int, after: String, status: String): PharmacyProductOptionWorklist!
        pharmacyCredentialReviewOptions: PharmacyCredentialReviewOptions!
        pharmacyPatientRecordOptions: PharmacyPatientRecordOptions!
        pharmacyCart(cartId: ID!, guestToken: String): PharmacyCart
        activePharmacyPaymentProviders(locationId: ID!): [PharmacyPaymentProviderOption!]!
        guestPharmacyOrder(orderId: ID!, guestOrderToken: String!): GuestPharmacyOrder
        pharmacyOperationalSummary: PharmacyOperationalSummary!
        pharmacyOnboardingState: PharmacyOnboardingState!
        pharmacyOperatorLocations: [PharmacyOperatorLocation!]!
        pharmacyPosCatalog(locationId: ID!): [PharmacyCatalogProduct!]!
        pharmacyPosCashReceipt(idempotencyKey: String!): PharmacyPosCashOrderResult
        pharmacyPrescriberDirectory: [PharmacyPrescriberDirectoryItem!]!
        pharmacyPrescriptionQueue: [PharmacyPrescriptionQueueItem!]!
        pharmacyPrescriptionWorklist(first: Int, after: String): PharmacyPrescriptionWorklist!
        pharmacyPrescriptionTask(prescriptionId: ID!): PharmacyPrescriptionTask!
        pharmacyInventoryQueue(first: Int, after: String, locationId: ID, status: String): PharmacyInventoryWorklist!
        pharmacyInventoryLotTask(lotId: ID!): PharmacyInventoryLotTask!
        pharmacyRecallOpenOptions: PharmacyRecallOpenOptions!
        pharmacyRecallQueue: [PharmacyRecallQueueItem!]!
        pharmacyRecallWorklist(first: Int, after: String): PharmacyRecallWorklist!
        pharmacyRecallTask(recallId: ID!): PharmacyRecallTask!
        pharmacyOrderQueue(first: Int, after: String, status: String, fulfillmentMethod: String): PharmacyOrderWorklist!
        pharmacyOrderTask(orderId: ID!): PharmacyOrderTask!
        pharmacyPatientAccountCandidates(patientId: ID!): [PharmacyTaskOption!]!
        pharmacyPatientDirectory: [PatientSafeProjection!]!
        pharmacyPatientPortal: PharmacyPatientPortal!
        pharmacyPatientSafeView(patientId: ID!): PatientSafeProjection!
        pharmacyIntegrationStatus: [PharmacyIntegrationStatus!]!
        pharmacyAuditTimeline(take: Int): [PharmacyAuditTimelineEvent!]!
        pharmacyOutboxTimeline(take: Int): [PharmacyOutboxTimelineEvent!]!
        pharmacyOutboxQueue(take: Int): [PharmacyOutboxTimelineEvent!]!
      }

      type Mutation {
        registerPharmacyCustomer(name: String!, email: String!, password: String!): Boolean!
        updateActiveUser(data: UserUpdateProfileInput!, oldPassword: String): User
        recordPharmacyFillPolicy(organizationId: ID!, policy: JSON!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        reservePharmacyPrescriptionFill(prescriptionId: ID!, prescriptionItemId: ID!, expectedItemVersion: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        releasePharmacyPrescriptionFill(prescriptionId: ID!, fillId: ID!, expectedVersion: Int!, cause: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        createPharmacyCart(locationId: ID!, tenantKey: String): CreatePharmacyCartResult!
        addPharmacyCartItem(cartId: ID!, productId: ID!, quantity: Int!, guestToken: String): PharmacyCart!
        updatePharmacyCartItem(cartItemId: ID!, quantity: Int!, guestToken: String): PharmacyCart!
        removePharmacyCartItem(cartItemId: ID!, guestToken: String): PharmacyCart!
        initiatePharmacyPaymentSession(cartId: ID!, providerCode: String!, guestToken: String): PharmacyPaymentSessionResult!
        submitPharmacyOrder(input: SubmitPharmacyOrderInput!): SubmitPharmacyOrderResult!
        refundPharmacyPayment(paymentId: ID!, reason: String!, attested: Boolean!): PharmacyRefundResult!
        refundPharmacyCashPayment(paymentId: ID!, cashReturnedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyRefundResult!
        recordPharmacyCashPolicy(organizationId: ID!, taxRateBps: Int!, policyReference: String!, reason: String!, attested: Boolean!): PharmacyCashPolicyResult!
        submitPharmacyPosCashOrder(locationId: ID!, customerCartId: ID, fulfillmentMethod: String, items: [PharmacyPosCashItemInput!]!, cashReceivedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPosCashOrderResult!
        reconcilePharmacyPaymentSession(paymentSessionId: ID!): PharmacyPaymentReconciliationResult!
        handlePaymentProviderWebhook(providerId: ID!, event: JSON!, headers: JSON!): PharmacyPaymentWebhookResult!
        configurePharmacyIntegrationProvider(providerId: ID!, baseUrl: String!, validationPath: String!, submitPath: String!, statusPath: String!, prescriberValidationPath: String, bearerToken: String!, webhookSecret: String!): PharmacyIntegrationConfigurationResult!
        validatePharmacyPrescriber(providerId: ID!, prescriberId: ID!): PharmacyPrescriberValidationResult!
        submitPharmacyExternalWorkflow(providerId: ID!, resourceId: ID!, idempotencyKey: String!): PharmacyExternalWorkflowResult!
        refreshPharmacyExternalWorkflow(workflowId: ID!): PharmacyExternalWorkflowResult!
        ingestPharmacyIntegrationWebhook(providerKey: String!, event: JSON!, headers: JSON!): PharmacyIntegrationWebhookResult!

        intakePharmacyPrescription(organizationId: ID!, locationId: ID!, patientId: ID!, prescriberId: ID!, prescriptionNumber: String!, source: String!, externalReference: String, writtenAt: String!, expiresAt: String!, items: [PharmacyPrescriptionIntakeItemInput!]!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        recordPrescriptionReview(prescriptionId: ID!, decision: String!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        authorizePrescriptionDispensing(prescriptionId: ID!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        recordPrescriptionDispensing(prescriptionId: ID!, prescriptionItemId: ID!, lotId: ID!, quantity: Int!, cashReceivedAmount: Int!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, idempotencyKey: String!, reason: String!, attested: Boolean!, fillId: ID, expectedFillVersion: Int): PharmacyPrescriptionActionResult!
        createPharmacyPatient(organizationId: ID!, patientNumber: String!, firstName: String!, lastName: String!, dateOfBirth: String!, email: String, phone: String, preferredContactMethod: String!, address: JSON, identityMethod: String!, identityReference: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        updatePharmacyPatientContact(patientId: ID!, email: String, phone: String, preferredContactMethod: String!, address: JSON, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        recordPharmacyPatientAllergy(patientId: ID!, allergen: String!, reaction: String!, severity: String!, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        recordPharmacyPatientMedication(patientId: ID!, medicationName: String!, directions: String, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        linkPharmacyPatientAccount(patientId: ID!, userId: ID!): PharmacyPatientAccountLinkResult!
        requestPrescriptionRefill(prescriptionId: ID!, prescriptionItemId: ID!, patientId: ID!, locationId: ID!, note: String, idempotencyKey: String!, expectedItemVersion: String): PharmacyRefillResult!
        resolvePrescriptionRefill(refillRequestId: ID!, decision: String!, reason: String!, attested: Boolean!, expectedFillVersion: Int): PharmacyRefillResult!
        requestPrescriptionTransfer(prescriptionId: ID!, patientId: ID!, direction: String!, counterpartyName: String!, counterpartyPhone: String, consentAccepted: Boolean!, policyVersion: String!, statementKey: String!, idempotencyKey: String!): PharmacyTransferResult!
        approvePrescriptionTransfer(transferId: ID!, reason: String!, attested: Boolean!): PharmacyTransferResult!
        recordPharmacyStaffCredentialReview(membershipId: ID!, credentialType: String!, jurisdiction: String!, identifier: String!, expiresAt: String!, verificationReference: String!, reason: String!, attested: Boolean!): PharmacyCredentialReviewResult!
        recordPharmacyPrescriberCredentialReview(prescriberId: ID!, credentialType: String!, jurisdiction: String!, identifier: String!, expiresAt: String!, verificationReference: String!, reason: String!, attested: Boolean!): PharmacyCredentialReviewResult!
        recordPharmacyDrugReferenceReview(organizationId: ID!, drugReferenceId: ID!, marketingStatus: String!, controlledSchedule: String!, sourceName: String!, sourceVersion: String!, sourceReference: String!, reason: String!, attested: Boolean!): PharmacyDrugReferenceReviewResult!
        recordPrescriptionClinicalSafetyReview(prescriptionId: ID!, outcome: String!, allergiesReviewed: Boolean!, medicationHistoryReviewed: Boolean!, interactionsReviewed: Boolean!, duplicateTherapyReviewed: Boolean!, contraindicationsReviewed: Boolean!, doseReviewed: Boolean!, counselingPlanReviewed: Boolean!, reviewReference: String!, notes: String, overrideReason: String, idempotencyKey: String!, reason: String!, attested: Boolean!, fillId: ID, expectedFillVersion: Int): PharmacyClinicalSafetyReviewResult!
        holdPrescriptionForClinicalReReview(prescriptionId: ID!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!

        receivePharmacyInventoryLot(productId: ID!, locationId: ID!, supplierId: ID, lotNumber: String!, serialNumber: String, expirationDate: String!, quantity: Int!, coldChainRequired: Boolean!, minimumTemperatureC: Float, maximumTemperatureC: Float, coldChainEvidenceComplete: Boolean!, reason: String!, idempotencyKey: String!, attested: Boolean!): PharmacyInventoryActionResult!
        adjustPharmacyInventoryLot(lotId: ID!, targetQuantity: Int!, reason: String!, idempotencyKey: String!, attested: Boolean!): PharmacyInventoryActionResult!
        openPharmacyRecall(organizationId: ID!, locationId: ID, recallNumber: String!, classification: String!, reason: String!, source: String!, sourceReference: String!, lotIds: [ID!]!, attested: Boolean!): PharmacyInventoryActionResult!
        quarantineRecallLots(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        recordRecallExposureAction(exposureId: ID!, status: String!, contactMethod: String!, outcome: String!, notes: String, reason: String!, attested: Boolean!): PharmacyRecallExposureActionResult!
        disposeRecallLot(recallId: ID!, lotId: ID!, quantity: Int!, dispositionReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        closePharmacyRecall(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        transitionOrderFulfillment(fulfillmentId: ID!, status: String!, reason: String!, attested: Boolean!): PharmacyFulfillmentResult!
        replayPharmacyOutboxEvent(eventId: ID!): PharmacyOutboxReplayResult!
        setPharmacyOnboardingStatus(status: String!): PharmacyOnboardingStatusResult!
        runPharmacyOnboarding(template: String): PharmacyOnboardingResult!
      }
    `,
    resolvers: {
      Query: {
        pharmacyPosCustomers,
        pharmacyCustomerAccount,
        pharmacyCustomerOrder,
        pharmacyFillPolicy,
        pharmacyFillWorkbench,
        pharmacyFillHistory,
        redirectToInit,
        publicPharmacyTenant,
        publicPharmacyLocations,
        publicPharmacyCatalog,
        pharmacyCatalogQueue,
        pharmacyPrescriptionIntakeOptions,
        pharmacyInventoryReceiptOptions,
        pharmacyInventoryReceiptProductWorklist,
        pharmacyCredentialReviewOptions,
        pharmacyPatientRecordOptions,
        pharmacyCart,
        activePharmacyPaymentProviders,
        guestPharmacyOrder: getGuestPharmacyOrder,
        pharmacyOperationalSummary,
        pharmacyOnboardingState,
        pharmacyOperatorLocations,
        pharmacyPosCatalog,
        pharmacyPosCashReceipt,
        pharmacyPrescriberDirectory,
        pharmacyPrescriptionQueue,
        pharmacyPrescriptionWorklist,
        pharmacyPrescriptionTask,
        pharmacyInventoryQueue,
        pharmacyInventoryLotTask,
        pharmacyRecallOpenOptions,
        pharmacyRecallQueue,
        pharmacyRecallWorklist,
        pharmacyRecallTask,
        pharmacyOrderQueue,
        pharmacyOrderTask,
        pharmacyPatientAccountCandidates,
        pharmacyPatientDirectory,
        pharmacyPatientPortal,
        pharmacyPatientSafeView,
        pharmacyIntegrationStatus,
        pharmacyAuditTimeline,
        pharmacyOutboxTimeline,
        pharmacyOutboxQueue,
      },
      Mutation: {
        registerPharmacyCustomer,
        updateActiveUser,
        recordPharmacyFillPolicy,
        reservePharmacyPrescriptionFill,
        releasePharmacyPrescriptionFill,
        createPharmacyCart,
        addPharmacyCartItem,
        updatePharmacyCartItem,
        removePharmacyCartItem,
        initiatePharmacyPaymentSession,
        submitPharmacyOrder,
        refundPharmacyPayment,
        refundPharmacyCashPayment,
        recordPharmacyCashPolicy,
        submitPharmacyPosCashOrder,
        reconcilePharmacyPaymentSession,
        handlePaymentProviderWebhook,
        configurePharmacyIntegrationProvider,
        validatePharmacyPrescriber,
        submitPharmacyExternalWorkflow,
        refreshPharmacyExternalWorkflow,
        ingestPharmacyIntegrationWebhook,
        intakePharmacyPrescription,
        recordPrescriptionReview,
        authorizePrescriptionDispensing,
        recordPrescriptionDispensing,
        createPharmacyPatient,
        updatePharmacyPatientContact,
        recordPharmacyPatientAllergy,
        recordPharmacyPatientMedication,
        linkPharmacyPatientAccount,
        requestPrescriptionRefill,
        resolvePrescriptionRefill,
        requestPrescriptionTransfer,
        approvePrescriptionTransfer,
        recordPharmacyStaffCredentialReview,
        recordPharmacyPrescriberCredentialReview,
        recordPharmacyDrugReferenceReview,
        recordPrescriptionClinicalSafetyReview,
        holdPrescriptionForClinicalReReview,
        receivePharmacyInventoryLot: receiveInventoryLot,
        adjustPharmacyInventoryLot: adjustInventoryLot,
        openPharmacyRecall,
        quarantineRecallLots,
        recordRecallExposureAction,
        disposeRecallLot,
        closePharmacyRecall,
        transitionOrderFulfillment,
        replayPharmacyOutboxEvent,
        setPharmacyOnboardingStatus,
        runPharmacyOnboarding,
      },
    },
  })
}
