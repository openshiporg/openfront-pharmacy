'use client'

import { useRef, useState, useTransition } from 'react'

import { Input } from '@/components/ui/input'
import type { PharmacyPatientPortalProjection } from '@/features/pharmacy/contracts'
import { Band, Field, TitleLine, buttonClass, type DotTone } from '../components/rx-ui'
import { requestRefill, type RefillRequestInput } from '../lib/data/prescriptions'
import { formatStatus } from '../lib/money'

type Prescription = PharmacyPatientPortalProjection['prescriptions'][number]

function prescriptionTone(status: string): DotTone {
  if (['dispensed', 'fill_closed', 'approved', 'ready_to_dispense'].includes(status)) return 'ok'
  if (['refill_requested', 'pending_review', 'transfer_requested', 'partially_dispensed'].includes(status)) return 'info'
  if (['needs_information', 'on_hold'].includes(status)) return 'warn'
  if (['expired', 'rejected', 'cancelled'].includes(status)) return 'danger'
  return 'muted'
}

export function PatientAccountPrescriptions({ patientId, prescriptions }: { patientId: string; prescriptions: Prescription[] }) {
  const [note, setNote] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, { tone: 'ok' | 'error'; text: string }>>({})
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()
  // Keeps the same idempotency key when a failed request is retried.
  const requests = useRef<Record<string, RefillRequestInput>>({})

  function submitRequest(prescription: Prescription) {
    const input = requests.current[prescription.id] ||= { prescriptionId: prescription.id, prescriptionItemId: prescription.prescriptionItemId, patientId, locationId: prescription.locationId, expectedItemVersion: prescription.itemVersion, note: note[prescription.id], idempotencyKey: `portal:${prescription.id}:${crypto.randomUUID()}` }
    startTransition(async () => {
      const result = await requestRefill(input)
      if (!result.success) return setMessages((value) => ({ ...value, [prescription.id]: { tone: 'error', text: result.error } }))
      delete requests.current[prescription.id]
      setCompleted((value) => ({ ...value, [prescription.id]: true }))
      setMessages((value) => ({ ...value, [prescription.id]: { tone: 'ok', text: 'Refill requested.' } }))
    })
  }

  if (!prescriptions.length) return <p className="rx-panel p-5 font-medium">No prescriptions yet</p>
  return <Band>{prescriptions.map((prescription) => {
    const canRefill = prescription.refillsRemaining > 0 && ['dispensed', 'fill_closed'].includes(prescription.status) && prescription.fillLineage === 'per_fill_v1' && prescription.refillEligible
    const message = messages[prescription.id]
    return <article key={prescription.id} className="px-4 py-5 sm:px-5">
      <TitleLine as="h3" title={prescription.medicationName} titleClassName="text-lg" tone={completed[prescription.id] ? 'info' : prescriptionTone(prescription.status)} state={<span className="capitalize">{completed[prescription.id] ? 'Refill requested' : formatStatus(prescription.status)}</span>} />
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
        <Field label="Rx number"><span className="rx-num">{prescription.prescriptionNumber}</span></Field>
        <Field label="Refills left"><span className="rx-num">{prescription.refillsRemaining}</span></Field>
        <Field label="Prescriber">{prescription.prescriberName}</Field>
        <Field label="Pharmacy">{prescription.locationName}</Field>
        {prescription.lastRefillStatus && <Field label="Last request"><span className="capitalize">{formatStatus(prescription.lastRefillStatus)}</span></Field>}
      </dl>
      {canRefill && !completed[prescription.id] && <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Input aria-label={`Note for ${prescription.medicationName} refill (optional)`} value={note[prescription.id] || ''} onChange={(event) => setNote((value) => ({ ...value, [prescription.id]: event.target.value }))} placeholder="Note for the pharmacist (optional)" maxLength={500} className="h-11 rounded-[4px] bg-background" />
        <button type="button" disabled={pending} onClick={() => submitRequest(prescription)} className={`${buttonClass} shrink-0`}>{requests.current[prescription.id] ? 'Try again' : 'Request refill'}</button>
      </div>}
      {message && <p role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-3 rounded-[4px] px-4 py-3 text-sm ${message.tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'}`}>{message.text}</p>}
    </article>
  })}</Band>
}
