'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PharmacyPrescriptionIntakeOptions } from '@/features/pharmacy/contracts'
import { intakePrescriptionAction } from '../actions'

function relativeDateInput(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

export function PrescriptionIntakeForm({ options }: { options: PharmacyPrescriptionIntakeOptions }) {
  const [organizationId, setOrganizationId] = useState(options.organizations[0]?.id || '')
  const locations = useMemo(() => options.locations.filter((entry) => entry.scopeId === organizationId), [options.locations, organizationId])
  const [locationId, setLocationId] = useState(locations[0]?.id || '')
  const [patientId, setPatientId] = useState(options.patients.find((entry) => entry.scopeId === organizationId)?.id || '')
  const [prescriberId, setPrescriberId] = useState(options.prescribers.find((entry) => entry.scopeId === organizationId)?.id || '')
  const products = options.products.filter((entry) => entry.scopeId === locationId)
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [prescriptionNumber, setPrescriptionNumber] = useState('')
  const [source, setSource] = useState('paper')
  const [writtenAt, setWrittenAt] = useState(relativeDateInput(0))
  const [expiresAt, setExpiresAt] = useState(relativeDateInput(180))
  const [medicationName, setMedicationName] = useState('')
  const [sig, setSig] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [refills, setRefills] = useState(0)
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    setMessage(''); setError('')
    startTransition(() => intakePrescriptionAction({
      organizationId, locationId, patientId, prescriberId, prescriptionNumber, source, writtenAt, expiresAt,
      items: [{ productId, medicationName, sig, quantity, refillsAuthorized: refills, substitutionAllowed: false }],
      reason, attested,
    }).then((result) => setMessage(`Prescription recorded (${String(result.status).replaceAll('_', ' ')}).`)).catch((cause) => setError(cause instanceof Error ? cause.message : 'Intake failed')))
  }

  const ready = organizationId && locationId && patientId && prescriberId && productId && prescriptionNumber.trim() && source && writtenAt && expiresAt && new Date(expiresAt).getTime() > new Date(writtenAt).getTime() && medicationName.trim() && sig.trim() && quantity > 0 && reason.trim().length >= 8 && attested
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Organization<select value={organizationId} onChange={(event) => { setOrganizationId(event.target.value); setLocationId(''); setPatientId(''); setPrescriberId(''); setProductId('') }} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{options.organizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <label className="text-sm">Location<select value={locationId} onChange={(event) => { setLocationId(event.target.value); setProductId('') }} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="">Select</option>{locations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <label className="text-sm">Patient<select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="">Select</option>{options.patients.filter((entry) => entry.scopeId === organizationId).map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label>
    <label className="text-sm">Prescriber<select value={prescriberId} onChange={(event) => setPrescriberId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="">Select</option>{options.prescribers.filter((entry) => entry.scopeId === organizationId).map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label>
    <label className="text-sm">Prescription number<Input value={prescriptionNumber} onChange={(event) => setPrescriptionNumber(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Source<select value={source} onChange={(event) => setSource(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="paper">Paper</option><option value="phone">Phone</option></select><span className="mt-1 block text-xs text-muted-foreground">Transfers use the consent and pharmacist-acceptance workflow. eRx remains provider- and certification-blocked.</span></label>
    <label className="text-sm">Written date<Input type="date" value={writtenAt} max={relativeDateInput(0)} onChange={(event) => setWrittenAt(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Expiration date<Input type="date" value={expiresAt} min={writtenAt || relativeDateInput(0)} onChange={(event) => setExpiresAt(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Product<select value={productId} onChange={(event) => { setProductId(event.target.value); const selected = products.find((entry) => entry.id === event.target.value); if (selected) setMedicationName(selected.label) }} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="">Select</option>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label>
    <label className="text-sm">Medication snapshot<Input value={medicationName} onChange={(event) => setMedicationName(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Directions<Input value={sig} onChange={(event) => setSig(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Quantity<Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-2" /></label>
    <label className="text-sm">Authorized refills<Input type="number" min={0} value={refills} onChange={(event) => setRefills(Number(event.target.value))} className="mt-2" /></label>
    <label className="text-sm sm:col-span-2">Source-verification reason<Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the source evidence reviewed by the authorized pharmacist" className="mt-2" /></label>
    <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" /><span>I am the organization-authorized pharmacist recording this source review. I verified the source and dates under the operator’s procedure; this software does not validate licensure or make a clinical decision.</span></label>
    <div className="sm:col-span-2"><Button disabled={pending || !ready} onClick={submit}>Record prescription intake</Button></div>
    {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 sm:col-span-2">{message}</p>}
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
  </div>
}
