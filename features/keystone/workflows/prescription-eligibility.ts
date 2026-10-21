export type PrescriptionClinicalEligibility = {
  sourceVerificationStatus?: string | null
  writtenAt?: string | Date | null
  expiresAt?: string | Date | null
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
  if (input.sourceVerificationStatus !== 'human_verified') throw new Error('Prescription source must be verified by an authorized human')
  if (!input.writtenAt || new Date(input.writtenAt).getTime() > now) throw new Error('Prescription written date is invalid')
  if (!input.expiresAt || new Date(input.expiresAt).getTime() <= now) throw new Error('Prescription is expired')
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
    throw new Error('Current organization-recorded prescriber identity and credential review evidence is required')
  }
}
