import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDateNotFuture, calendarDateStillValid, endOfPharmacyDay, lotNumberKey, parseCalendarDateInput, pharmacyToday } from './calendar-dates'
import { eligibleLotQuantity } from './lot-eligibility'
import { assertPrescriptionClinicallyEligible } from './prescription-eligibility'

const NY = 'America/New_York'
// 8:30 pm in New York on Sept 20 is already Sept 21 in UTC.
const eveningSept20 = Date.parse('2027-09-21T00:30:00.000Z')

test('pharmacy today follows the store calendar, not UTC', () => {
  assert.equal(pharmacyToday(NY, eveningSept20), '2027-09-20')
  assert.equal(pharmacyToday('Not/AZone', eveningSept20), '2027-09-20')
  assert.equal(pharmacyToday('UTC', eveningSept20), '2027-09-21')
})

test('a lot is sellable through its expiration day at the pharmacy', () => {
  const lot = { status: 'available', expirationDate: '2027-09-20T12:00:00.000Z', quantityAvailable: 30, quantityQuarantined: 0, location: { timezone: NY } }
  assert.equal(eligibleLotQuantity(lot, Date.parse('2027-09-20T15:00:00.000Z')), 30, 'afternoon of the expiry day (was refused after noon UTC)')
  assert.equal(eligibleLotQuantity(lot, eveningSept20), 30, 'evening of the expiry day in New York')
  assert.equal(eligibleLotQuantity(lot, Date.parse('2027-09-21T04:30:00.000Z')), 0, 'after local midnight')
})

test('a prescription can be filled on its expiry day and not written in the future', () => {
  const prescriber = { npi: '1245319599', verificationStatus: 'validated', externalValidationComplete: true, verificationMethod: 'organization_recorded', credentialType: 'MD', credentialJurisdiction: 'NY', credentialIdentifier: '301562', credentialExpiresAt: '2030-01-01T00:00:00.000Z', validationReference: 'NPPES', verifiedBy: { id: 'u1' } }
  const base = { sourceVerificationStatus: 'human_verified', writtenAt: '2026-11-06T00:00:00.000Z', location: { timezone: NY }, prescriber }
  // Stored at UTC midnight of May 5 = 8 pm May 4 in New York; it used to expire the evening before.
  assert.doesNotThrow(() => assertPrescriptionClinicallyEligible({ ...base, expiresAt: '2027-05-05T00:00:00.000Z' }, Date.parse('2027-05-05T18:00:00.000Z')))
  assert.doesNotThrow(() => assertPrescriptionClinicallyEligible({ ...base, expiresAt: '2027-05-05T00:00:00.000Z' }, Date.parse('2027-05-05T02:00:00.000Z')))
  assert.throws(() => assertPrescriptionClinicallyEligible({ ...base, expiresAt: '2027-05-05T00:00:00.000Z' }, Date.parse('2027-05-06T05:00:00.000Z')), /expired/)
  // Written "today" at 8 pm in New York is not in the future even though UTC is already tomorrow.
  assert.doesNotThrow(() => assertPrescriptionClinicallyEligible({ ...base, writtenAt: '2027-09-20T00:00:00.000Z', expiresAt: '2028-03-20T00:00:00.000Z' }, eveningSept20))
  assert.throws(() => assertPrescriptionClinicallyEligible({ ...base, writtenAt: '2027-09-21T00:00:00.000Z', expiresAt: '2028-03-20T00:00:00.000Z' }, eveningSept20), /written/)
})

test('calendar helpers', () => {
  assert.equal(parseCalendarDateInput('2027-02-30'), null)
  assert.equal(parseCalendarDateInput('2027-09-20T12:00:00.000Z'), '2027-09-20')
  assert.equal(parseCalendarDateInput('September'), null)
  assert.equal(calendarDateStillValid(null, NY), false)
  assert.equal(calendarDateNotFuture('2027-09-21', NY, eveningSept20), false)
  assert.equal(endOfPharmacyDay('2027-05-05T00:00:00.000Z', NY)?.toISOString(), '2027-05-06T04:00:00.000Z')
  assert.equal(endOfPharmacyDay('2027-01-05', NY)?.toISOString(), '2027-01-06T05:00:00.000Z')
  assert.equal(lotNumberKey('  nn4k 825 '), 'NN4K 825')
})
