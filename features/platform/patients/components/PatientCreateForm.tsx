'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { createPatientAction } from '../actions'

export function PatientCreateForm({ organizations }: { organizations: PharmacyTaskOption[] }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')
  const [patientNumber, setPatientNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState('phone')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [identityMethod, setIdentityMethod] = useState('operator_record_review')
  const [identityReference, setIdentityReference] = useState('')
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const ready = Boolean(organizationId && patientNumber.trim() && firstName.trim() && lastName.trim() && dateOfBirth && identityMethod.trim() && identityReference.trim() && reason.trim().length >= 8 && attested)
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Organization<select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{organizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <label className="text-sm">Patient number<Input value={patientNumber} onChange={(event) => setPatientNumber(event.target.value.toUpperCase())} placeholder="PATIENT-002" className="mt-2" /></label>
    <label className="text-sm">First name<Input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-2" /></label><label className="text-sm">Last name<Input value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Date of birth<Input type="date" max={new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)} value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Preferred contact<select value={preferredContactMethod} onChange={(event) => setPreferredContactMethod(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="phone">Phone</option><option value="sms">SMS</option><option value="email">Email</option><option value="portal">Portal</option><option value="none">None</option></select></label>
    <label className="text-sm">Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" /></label><label className="text-sm">Phone<Input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2" /></label>
    <label className="text-sm sm:col-span-2">Street address<Input value={line1} onChange={(event) => setLine1(event.target.value)} className="mt-2" /></label><label className="text-sm">City<Input value={city} onChange={(event) => setCity(event.target.value)} className="mt-2" /></label><label className="text-sm">State / region<Input value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2" /></label><label className="text-sm">Postal code<Input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Identity matching method<Input value={identityMethod} onChange={(event) => setIdentityMethod(event.target.value)} className="mt-2" /></label><label className="text-sm sm:col-span-2">Identity matching reference<Input value={identityReference} onChange={(event) => setIdentityReference(event.target.value)} placeholder="Operator record or document reference; do not enter secret document numbers" className="mt-2" /></label>
    <label className="text-sm sm:col-span-2">Creation reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label>
    <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I attest that I matched the patient under the operator’s procedure. This software did not validate government identity.</label>
    <div className="sm:col-span-2"><Button disabled={pending || !ready} onClick={() => { setError(''); setMessage(''); startTransition(() => createPatientAction({ organizationId, patientNumber, firstName, lastName, dateOfBirth: new Date(`${dateOfBirth}T12:00:00.000Z`).toISOString(), email: email || undefined, phone: phone || undefined, preferredContactMethod, address: line1 || city || region || postalCode ? { line1, city, region, postalCode, countryCode: 'US' } : undefined, identityMethod, identityReference, reason, attested }).then((result) => setMessage(`Patient ${result.patientNumber} recorded with status ${result.status}.`)).catch((cause) => setError(cause instanceof Error ? cause.message : 'Patient creation failed'))) }}>Create patient record</Button></div>
    {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900 sm:col-span-2">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900 sm:col-span-2">{error}</p>}
  </div>
}
