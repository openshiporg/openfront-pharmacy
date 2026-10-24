# Openfront Pharmacy: schema map and platform coverage (2026-10-23)

Source: every list in `features/keystone/models/**` (46 lists), the custom GraphQL in `features/keystone/mutations/**` (49 queries, 46 mutations), and the onboarding seed (`features/platform/onboarding/lib/seed.json`).

Almost every clinical, inventory and money list is **read-only through the generic API** (`create/update/delete: denyAll`, `graphql.omit`). Their records change only through custom, attested commands: a reason, a human attestation, a `HumanApproval`, an `AuditEvent` and an `OutboxEvent`. Platform pages therefore read through the generic or custom queries and write through those commands. The generic Keystone create and edit drawers are used only for the lists that allow them: Product, DrugReference, Supplier, Prescriber, PharmacyLocation, PaymentProvider, OrganizationMembership and Organization.

## Lists

**Who** column: M = merchant/staff, C = customer, S = system/commands.

### Tenant and access

| List | Purpose in a pharmacy | Key fields | Relationships | Who | States / transitions |
| --- | --- | --- | --- | --- | --- |
| Organization | The pharmacy business (tenant) | name, slug, storefrontKey/Host, operatorDisplayName, tagline, logo, support email/phone, privacyNotice, cash policy (`cashSalesEnabled`, `cashTaxRateBps`, policy ref/reviewer), `prescriptionFillPolicy` | locations, memberships, patients, products, prescriptions, recalls, orders, integration/payment providers, outbox | S (onboarding); M edits branding | active → suspended → archived. Cash and fill policy change only via `recordPharmacyCashPolicy` / `recordPharmacyFillPolicy`. |
| PharmacyLocation | A store with a pharmacy counter | name, code, status, address JSON, timezone, hours JSON (store + pharmacy), phone, onlineOrderingEnabled, pickupEnabled, deliveryEnabled | organization, memberships, products, lots, prescriptions, recalls, orders | M (create needs org-wide membership) | active ⇄ temporarily_closed → archived |
| OrganizationMembership | A staff member's role at the pharmacy or one location | membershipRole (owner, administrator, pharmacist, technician, cashier, delivery, read_only), status, credential evidence (type, jurisdiction, identifier, expiry, reference, verifier) | user, organization, location (null = org-wide) | M (`canManageUsers`; only owners add or change owners) | invited → active ⇄ suspended → revoked. Credential evidence is set only by `recordPharmacyStaffCredentialReview`. |
| User | Staff and customer accounts | name, email, password, role, tokenVersion, onboardingStatus | role, memberships, patientProfile, carts, orders | C (sign-up), M, S (first admin) | none |
| Role | Permission sets (19 `can*` flags) | name, permission flags | assignedTo users | M (`canManageRoles`) | none |
| MachineCredential | API tokens for agents | tokenPrefix/hash, scopes, status, expiry, rate window | organization, location, createdBy | — (no issuing command or auth path exists) | active → revoked |

### Catalog and inventory

| List | Purpose in a pharmacy | Key fields | Relationships | Who | States / transitions |
| --- | --- | --- | --- | --- | --- |
| DrugReference | The NDC drug catalog entry an Rx product dispenses | ndc11 (unique, 11 digits), proprietary/generic name, strength, dosage form, route, labeler, controlledSchedule, marketingStatus, source and verification (read-only) | products, reviews, prescriptionItems | M (`canManageCatalog`) | Identity locks once reviewed. Schedule and marketing status are set only by `recordPharmacyDrugReferenceReview`. |
| DrugReferenceReview | Org-scoped evidence that a drug reference was checked | marketing/controlled snapshot, source name/version/reference | organization, drugReference, reviewedBy, approval | S (`recordPharmacyDrugReferenceReview`) | active → superseded / rejected |
| Product | What the pharmacy sells (OTC, supplies) or dispenses (Rx) | title, handle, sku, category, status, prescriptionRequirement, price (minor units), taxable, onlineAvailable, posAvailable, coldChainRequired, imageUrl | organization, location, drugReference (required for Rx), lots, cart/order/prescription items | M (`canManageCatalog`) | draft → published → archived. Rx requirement or drug-reference changes are blocked while open prescriptions use the product. Referenced products can't be deleted. |
| Supplier | Wholesalers lots are received from | name, accountReference, status | organization, integrationProvider, inventoryLots | M (`canManageInventory`) | pending_validation → active ⇄ suspended |
| InventoryLot | A received lot of a product at a location | lotNumber, serial, expiration, received/available/quarantined quantities, storageBin, cold-chain fields | product, location, supplier, movements, excursions, recalls | S (`receivePharmacyInventoryLot`) | quarantined → available → depleted / expired / recalled. Changed by `adjustPharmacyInventoryLot`, recall quarantine and disposition, and dispensing. |
| InventoryMovement | Append-only stock ledger | movementType (receive, reserve, dispense, sale, return, quarantine, release, recall, expire, destroy, adjust), quantityDelta, reason | lot, product, location, actor, patient, prescription, order, approval | S | append-only |
| TemperatureExcursion | Cold-chain breach on a lot | observed min/max °C, start/end, status, disposition reason | lot, location, reviewedBy, approval | S (`recordTemperatureExcursion` exists but is not exposed) | open → under_review → released / destroyed (no release/destroy command exists) |

### Patients and prescriptions

| List | Purpose in a pharmacy | Key fields | Relationships | Who | States / transitions |
| --- | --- | --- | --- | --- | --- |
| PatientProfile | A pharmacy patient | patientNumber, name, DOB, contact, address, preferredContactMethod, identity verification evidence | user (portal link), organizations, consents, allergies, medications, prescriptions, refills, transfers, orders | M (`createPharmacyPatient`, attested identity match) | active → inactive → archived. Identity is unverified → confirmed / rejected. |
| PatientAllergy / PatientMedication | Safety history used in clinical review | allergen, reaction, severity, status / medication name, directions, status; source and reference | patient, recordedBy, approval | M (`recordPharmacyPatientAllergy` / `…Medication`) | active / current → inactive / discontinued / entered_in_error |
| ConsentRecord | Privacy, communications, transfer and delivery consents | consentType, policyVersion, statementKey, captureMethod, granted/revoked | patient, transfer or order (exactly one) | S (checkout, transfer) | granted → revoked |
| Prescriber | Doctors who write prescriptions | name, NPI, phone, fax, verification state and credential evidence (read-only) | organization, integrationProvider, prescriptions | M (`canManagePrescriptions`); evidence only via `recordPharmacyPrescriberCredentialReview` | unverified → pending → validated / rejected |
| Prescription | The prescription workflow record | prescriptionNumber, source, sourceVerificationStatus, status, written/expires, approved/dispensed | patient, prescriber, location, items, reviews, safetyReviews, labels, refills, transfers, orders | M (`intakePharmacyPrescription`) | draft → pending_review → needs_information / approved → ready_to_dispense → partially_dispensed → dispensed → fill_closed; also rejected and cancelled (`assertPrescriptionTransition`) |
| PrescriptionItem | A medication line with directions | medication name, sig, quantity, days supply, refills authorized/remaining/reserved, substitution, fillLineage | prescription, drugReference, product, refills, labels | S (intake) | counters change via fills and dispensing |
| PrescriptionReview | Pharmacist decision record | decision, reason, humanAttested | prescription, patient, pharmacist, approval | S (`recordPrescriptionReview`) | append-only |
| ClinicalSafetyReview | DUR checklist per fill | outcome, the seven review checkboxes, reference, override reason | prescription, patient, pharmacist, approval | S (`recordPrescriptionClinicalSafetyReview`, `holdPrescriptionForClinicalReReview`) | append-only |
| PrescriptionFill / PrescriptionFillEvent | Per-fill entitlement and its event log | fillNumber, kind, status, authorized/dispensed/released, policy snapshot, expiry | prescription, item, refill, approval | S (`reserve…`/`release…Fill`, dispensing) | requested → reserved → dispensed / released |
| DispensingLabel | The printed label snapshot | label number, patient, prescriber, drug, sig, lot, NDC, warnings, counseling | prescription, item, order, pharmacist, approval | S (`recordPrescriptionDispensing`) | immutable |
| RefillRequest | A patient's refill ask | status, request/resolution note, requested/resolved | patient, prescription, item, location, approval | C (`requestPrescriptionRefill`); M resolves | requested → under_review → prescriber_contacted → approved / fulfilled / rejected / cancelled |
| PrescriptionTransfer | Transfer in or out of the pharmacy | direction, status, counterparty name/phone | patient, prescription, consent, approval | M (`requestPrescriptionTransfer`, `approvePrescriptionTransfer`) | requested → consent_recorded → under_review → accepted → completed; rejected / cancelled |
| PrescriptionRequest | A customer's online registration, transfer-in or new-Rx request | kind, status, patient-reported identity, allergies, insurance, counterparty, prescriber, medications | organization, location, user, patient, resolvedBy | C (`submitPharmacyPrescriptionRequest`); M (`resolvePharmacyPrescriptionRequest`) | requested → in_review → completed / declined |

### Orders, payments and fulfilment

| List | Purpose in a pharmacy | Key fields | Relationships | Who | States / transitions |
| --- | --- | --- | --- | --- | --- |
| Cart / CartItem | Storefront and POS baskets | status, fulfillment method, totals, expiry / quantity, unit price | location, customer, items, paymentSessions, order | C, S | active → submitted / expired / abandoned |
| Order / OrderLineItem | Pickup, delivery and counter orders | orderNumber, status, fulfillmentMethod, totals, pickupAt, deliveryWindow, address snapshots / line snapshots | location, customer, patient, prescription, lines, payments, fulfillment, labels | S (`submitPharmacyOrder`, `submitPharmacyPosCashOrder`, dispensing) | pending → review_required → approved → processing → ready → out_for_delivery → completed; cancelled |
| Fulfillment | Pickup and delivery handoff | method, status, ready/handedOff, assignedTo | order, location | S (`transitionOrderFulfillment`) | pending → preparing → ready → out_for_delivery → handed_off; cancelled |
| PaymentProvider | Stripe, pay at pickup | name, code, isInstalled, adapter functions | organization, sessions, payments, webhooks | M (`canManagePayments`) | installed ⇄ uninstalled; delete blocked once there is history |
| PaymentSession | Checkout payment attempt and reconciliation | status, reconciliationStatus, idempotency, externalPaymentId, failureReason | cart, provider, payment | S (`initiatePharmacyPaymentSession`, `reconcilePharmacyPaymentSession`) | pending → requires_action → authorized / captured → settled_unordered → compensation_pending → compensated; failed / cancelled |
| Payment | Money received for an order | amount, status, tenderMethod (provider / cash), cash received and change | order, provider, session, recordedBy, approval | S | pending → authorized → captured → refund_pending → refunded; failed |
| PaymentWebhookEvent | Provider webhooks | eventType, status, error | provider | S | received → processed / ignored / failed |

### Recalls, integrations and evidence

| List | Purpose in a pharmacy | Key fields | Relationships | Who | States / transitions |
| --- | --- | --- | --- | --- | --- |
| Recall / RecallExposure | FDA and manufacturer recalls and patient outreach | recallNumber, classification, status, reason, source / exposure status, contact method, outcome | lots, exposures (patient, prescription, order, movement) | M (`openPharmacyRecall` …) | draft → active → quarantined → resolved → closed; cancelled. Exposures: outreach_required → contacted / returned / unable_to_reach → resolved |
| IntegrationProvider / ExternalIntegrationWorkflow / IntegrationWebhookEvent | eRx, wholesaler, insurance and tax adapters, with their submissions and webhooks | providerType, status, configuration, credentials (write-only), validation / workflow status, attempts | organization, suppliers, prescribers, payment providers | M (`configurePharmacyIntegrationProvider`); S (submit, refresh, webhooks) | unconfigured → sandbox / active → disabled; workflows pending_submission → submitted → accepted / rejected / failed |
| HumanApproval | The attestation behind every consequential action | actionType (17 kinds), reason, attested, evidence | actor, organization, location, the records it approved | S | immutable |
| AuditEvent / OutboxEvent | Audit trail and the event delivery queue | eventKey, eventType, resource, actor / status, attempts, replayCount | organization, location | S; M replays (`replayPharmacyOutboxEvent`) | outbox: pending → processing → delivered / failed → dead_letter |

## Merchant workflows

| # | Workflow | Lists it touches |
| --- | --- | --- |
| W1 | **Set up the pharmacy:** onboarding, store branding, privacy notice, locations, hours, ordering and delivery switches | Organization, PharmacyLocation |
| W2 | **Staff and credentials:** invite, assign role and location, record license evidence, suspend or revoke | User, OrganizationMembership, Role, HumanApproval |
| W3 | **Drug catalog:** add an NDC drug reference, record its review (marketing status, schedule) | DrugReference, DrugReferenceReview |
| W4 | **Product catalog:** create OTC and Rx products, price, category, online/POS availability, publish, archive | Product, DrugReference |
| W5 | **Suppliers and receiving:** maintain wholesalers, receive lots with expiry, bin, quantity | Supplier, InventoryLot, InventoryMovement |
| W6 | **Inventory control:** expiry, quarantine, counts and adjustments | InventoryLot, InventoryMovement, (TemperatureExcursion) |
| W7 | **Patients:** create a patient with an identity match, contact details, allergies, medications, portal link | PatientProfile, PatientAllergy, PatientMedication, User |
| W8 | **Prescribers:** add, update contact, record credential evidence, validate through eRx | Prescriber, IntegrationProvider |
| W9 | **Prescription lifecycle:** intake → review → clinical safety review → fill reservation → authorize → dispense (lot, label, cash) → handoff | Prescription, PrescriptionItem, PrescriptionReview, ClinicalSafetyReview, PrescriptionFill(+Event), DispensingLabel, InventoryMovement, Order, Payment |
| W10 | **Refills:** patient requests → pharmacist resolves | RefillRequest, PrescriptionFill |
| W11 | **Transfers:** in (online request or phone) and out, with consent | PrescriptionTransfer, ConsentRecord, PrescriptionRequest |
| W12 | **Online requests:** registration, transfer-in, new Rx from the storefront | PrescriptionRequest |
| W13 | **Online orders:** pickup and delivery → prepare → ready → handoff | Cart, Order, OrderLineItem, Fulfillment |
| W14 | **Point of sale:** counter cash sale, receipt | Cart, Order, Payment, InventoryMovement |
| W15 | **Payments:** providers (install Stripe), ledger, refunds, session reconciliation, cash/tax policy | PaymentProvider, PaymentSession, Payment, PaymentWebhookEvent, Organization |
| W16 | **Recalls:** open → quarantine lots → patient outreach → lot disposition → close | Recall, RecallExposure, InventoryLot, InventoryMovement |
| W17 | **Integrations:** configure eRx and insurance, validate, workflow status | IntegrationProvider, ExternalIntegrationWorkflow, IntegrationWebhookEvent |
| W18 | **Audit:** audit trail, delivery failures and replay | AuditEvent, OutboxEvent, HumanApproval |

## Coverage

Routes are under `/dashboard`. "Generic" means the shared Keystone list or item screen (`app/dashboard/(admin)/[listKey]`), which renders fields but has none of the pharmacy workflow on it.

| Workflow / list | Before this pass | After |
| --- | --- | --- |
| W1 Store branding, privacy notice | `/platform/store-settings` (store-settings) | same |
| W1 Locations (create, address, phone, status, ordering/pickup/delivery switches) | **MISSING.** Hours only, in Store Settings | `/platform/locations`, `/platform/locations/[id]` (locations) |
| W2 Staff memberships and roles | **THIN.** Generic `/users` and `/roles`; memberships have no page | `/platform/staff` (staff) |
| W2 Staff credential evidence | `/platform/credentials` (credentials) | same, linked from Staff |
| W3 Drug references and reviews | **MISSING.** Review form buried in Credential review; no list, create or detail | `/platform/drug-references`, `/platform/drug-references/[id]` (drug-references) |
| W4 Products | **THIN.** Generic `/products` (no stock, no publish/archive actions, no Rx rules surfaced) | `/platform/products`, `/platform/products/[id]` (products) |
| W5 Suppliers | **MISSING** (generic `/suppliers` was not in the nav) | `/platform/suppliers`, `/platform/suppliers/[id]` (suppliers) |
| W5 Receiving | `/platform/inventory/receive` (inventory) | same |
| W6 Inventory lots, counts, quarantine | `/platform/inventory`, `/platform/inventory/[id]` (inventory) | same |
| W6 Temperature excursions | **MISSING** (no exposed command; cold-chain receiving is disabled) | **MISSING**, see "Left missing" |
| W7 Patients, allergies, medications, account link | `/platform/patients`, `/create`, `/[id]` (patients) | same |
| W7 Patient contact update | **THIN.** `updatePharmacyPatientContact` had no screen | contact form on `/platform/patients/[id]` |
| W8 Prescribers | **THIN.** List only; rows linked to the generic item page; eRx validation had no screen | `/platform/prescribers/[id]` (prescribers): prescriptions, credential state, edit, eRx validation |
| W9 Prescription lifecycle | `/platform/prescriptions`, `/intake`, `/[id]` (prescriptions) | same |
| W10 Refills | **THIN.** Resolved on the prescription page; no queue of requests | `/platform/refills` (refills) |
| W11 Transfers in | approve on the prescription page | same |
| W11 Transfers out | **THIN.** `requestPrescriptionTransfer` had no screen | transfer-out form on `/platform/prescriptions/[id]` |
| W12 Online requests | `/platform/requests` (requests), added in QA round 1 | same |
| W13 Online orders and fulfilment | `/platform/orders`, `/[id]` (orders) | same |
| W14 Point of sale | `/platform/pos` (pos) | same |
| W15 Payment ledger, reconciliation, providers, cash policy | **MISSING.** Refunds only per order; generic `/payment-providers`; cash policy inside Credential review | `/platform/payments` (payments) |
| W16 Recalls and exposures | `/platform/recalls`, `/open`, `/[id]` (recalls) | same |
| W17 Integrations | **THIN.** Status list only; `configure…`, `validate…`, `submit…` and `refresh…` had no screen | configure drawer on `/platform/integrations` (integrations) |
| W18 Audit and outbox | **THIN.** Read-only; `replayPharmacyOutboxEvent` had no screen | replay action on `/platform/audit` (audit) |
| Overview | `/platform/overview` | same, plus refills, requests and payments in the queue cards |

### Lists covered by a parent page (no page of their own)

| List | Parent page |
| --- | --- |
| PrescriptionItem, PrescriptionReview, ClinicalSafetyReview, PrescriptionFill, PrescriptionFillEvent, DispensingLabel, PrescriptionTransfer | Prescription detail |
| PatientAllergy, PatientMedication, ConsentRecord | Patient detail |
| RecallExposure | Recall detail |
| InventoryMovement | Lot detail |
| Cart, CartItem, OrderLineItem, Fulfillment | Order detail |
| PaymentSession, PaymentWebhookEvent | Payments |
| DrugReferenceReview | Drug reference detail |
| ExternalIntegrationWorkflow, IntegrationWebhookEvent | Integrations |
| HumanApproval, AuditEvent, OutboxEvent | Audit log |
| Role, User | generic `/roles` and `/users` (shared shell), linked from Staff |

### Left missing

| Item | Reason |
| --- | --- |
| TemperatureExcursion recording and disposition | Cold-chain receiving is disabled (`InventoryReceiveForm`), and there is no release/destroy command. Exposing `recordTemperatureExcursion` alone would quarantine lots with no way to release them. This needs a designed cold-chain disposition workflow first. |
| MachineCredential (agent API tokens) | No issue, rotate or authenticate path exists anywhere in the API. Building one adds a new authentication surface, which is a security design decision, not a page. |

## Storefront workflows

| Customer workflow | Before | After |
| --- | --- | --- |
| Browse the OTC catalog by category | Category filter only when the whole catalog fits on one page (client-side) | server-side `category` on `publicPharmacyCatalog`; `/products?category=` category track |
| Product detail → related products | Detail only | related products from the same category |
| Cart → checkout (pickup or delivery, card or pay at pickup) → confirmation | Complete (QA round 1) | same |
| Track an order (number + email) and account order history | Complete (QA round 1) | same |
| Refill a prescription | Account | same |
| Register as a patient, transfer in, new prescription | Complete (QA round 1) | same |
| Hours, privacy notice | Complete (QA round 1) | same |
