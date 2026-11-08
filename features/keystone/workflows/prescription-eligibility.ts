import { DomainError } from '../mutations/lib/errors'
import { calendarDateNotFuture, calendarDateStillValid } from './calendar-dates'

export type PrescriptionClinicalEligibility = {
  sourceVerificationStatus?: string | null
  writtenAt?: string | Date | null
  expiresAt?: string | Date | null
  /** Written and expiry are calendar dates, judged on the dispensing pharmacy's calendar. */
  location?: { timezone?: string | null } | null
  prescriber?: {
    npi?: string | null
    verificationStatus?: string | null
    externalValidationComplete?: boolean | null
    verificationMethod?: string | null
    credentialType?: string | null
    credentialJurisdiction?: string | null
    credentialIdentifier?: string | null
    credentialExpiresAt?: string | Date | null
    validationReference?: string | null
    verifiedBy?: { id?: string | null } | null
  } | null
}

export function isValidNpi(value: string | null | undefined) {
  if (!/^\d{10}$/.test(value || '')) return false
  const digits = `80840${value}`.split('').map(Number)
  const check = digits.pop()!
  let sum = 0
  for (let index = digits.length - 1, double = true; index >= 0; index -= 1, double = !double) {
    let digit = digits[index] * (double ? 2 : 1)
    if (digit > 9) digit -= 9
    sum += digit
  }
  return (10 - (sum % 10)) % 10 === check
}

export function assertPrescriptionClinicallyEligible(input: PrescriptionClinicalEligibility, now = Date.now()) {
  if (input.sourceVerificationStatus !== 'human_verified') throw new DomainError('Prescription source must be verified by an authorized human')
  const timeZone = input.location?.timezone
  if (!calendarDateNotFuture(input.writtenAt, timeZone, now)) throw new DomainError('Prescription written date is invalid')
  // A prescription that expires on May 5 can still be filled on May 5 at the pharmacy.
  if (!calendarDateStillValid(input.expiresAt, timeZone, now)) throw new DomainError('Prescription is expired')
  const prescriber = input.prescriber
  const credentialExpiry = prescriber?.credentialExpiresAt ? new Date(prescriber.credentialExpiresAt).getTime() : Number.NaN
  if (
    prescriber?.verificationStatus !== 'validated'
    || prescriber.externalValidationComplete !== true
    || !['organization_recorded', 'external_provider'].includes(prescriber.verificationMethod || '')
    || !isValidNpi(prescriber.npi)
    || !prescriber.credentialType?.trim()
    || !prescriber.credentialJurisdiction?.trim()
    || !prescriber.credentialIdentifier?.trim()
    || !prescriber.validationReference?.trim()
    || !prescriber.verifiedBy?.id
    || !Number.isFinite(credentialExpiry)
    || credentialExpiry <= now
  ) {
    throw new DomainError('Current organization-recorded prescriber identity and credential review evidence is required')
  }
}
