import { AuditEvent } from './AuditEvent'
import { Cart } from './Cart'
import { CartItem } from './CartItem'
import { ClinicalSafetyReview } from './ClinicalSafetyReview'
import { ConsentRecord } from './ConsentRecord'
import { DispensingLabel } from './DispensingLabel'
import { DrugReference } from './DrugReference'
import { DrugReferenceReview } from './DrugReferenceReview'
import { ExternalIntegrationWorkflow } from './ExternalIntegrationWorkflow'
import { Fulfillment } from './Fulfillment'
import { HumanApproval } from './HumanApproval'
import { IntegrationProvider } from './IntegrationProvider'
import { InventoryLot } from './InventoryLot'
import { IntegrationWebhookEvent } from './IntegrationWebhookEvent'
import { InventoryMovement } from './InventoryMovement'
import { MachineCredential } from './MachineCredential'
import { Order } from './Order'
import { OrderLineItem } from './OrderLineItem'
import { OutboxEvent } from './OutboxEvent'
import { Organization } from './Organization'
import { OrganizationMembership } from './OrganizationMembership'
import { PatientAllergy } from './PatientAllergy'
import { PatientMedication } from './PatientMedication'
import { PatientProfile } from './PatientProfile'
import { Payment } from './Payment'
import { PaymentProvider } from './PaymentProvider'
import { PaymentSession } from './PaymentSession'
import { PaymentWebhookEvent } from './PaymentWebhookEvent'
import { PharmacyLocation } from './PharmacyLocation'
import { Prescriber } from './Prescriber'
import { Prescription } from './Prescription'
import { PrescriptionFill } from './PrescriptionFill'
import { PrescriptionFillEvent } from './PrescriptionFillEvent'
import { PrescriptionItem } from './PrescriptionItem'
import { PrescriptionReview } from './PrescriptionReview'
import { PrescriptionTransfer } from './PrescriptionTransfer'
import { Product } from './Product'
import { Recall } from './Recall'
import { RecallExposure } from './RecallExposure'
import { RefillRequest } from './RefillRequest'
import { PrescriptionRequest } from './PrescriptionRequest'
import { Role } from './Role'
import { Supplier } from './Supplier'
import { TemperatureExcursion } from './TemperatureExcursion'
import { User } from './User'

export const models = {
  AuditEvent,
  Cart,
  CartItem,
  ClinicalSafetyReview,
  ConsentRecord,
  DispensingLabel,
  DrugReference,
  DrugReferenceReview,
  ExternalIntegrationWorkflow,
  Fulfillment,
  HumanApproval,
  IntegrationProvider,
  IntegrationWebhookEvent,
  InventoryLot,
  InventoryMovement,
  MachineCredential,
  Order,
  OrderLineItem,
  OutboxEvent,
  Organization,
  OrganizationMembership,
  PatientAllergy,
  PatientMedication,
  PatientProfile,
  Payment,
  PaymentProvider,
  PaymentSession,
  PaymentWebhookEvent,
  PharmacyLocation,
  Prescriber,
  Prescription,
  PrescriptionFill,
  PrescriptionFillEvent,
  PrescriptionItem,
  PrescriptionRequest,
  PrescriptionReview,
  PrescriptionTransfer,
  Product,
  Recall,
  RecallExposure,
  RefillRequest,
  Role,
  Supplier,
  TemperatureExcursion,
  User,
}

export default models
