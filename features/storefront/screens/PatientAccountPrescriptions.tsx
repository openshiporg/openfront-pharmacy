'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PharmacyPatientPortalProjection } from '@/features/pharmacy/contracts'
import { requestRefill, type RefillRequestInput } from '../lib/data/prescriptions'
import { formatStatus } from '../lib/money'

type Prescription = PharmacyPatientPortalProjection['prescriptions'][number]

export function PatientAccountPrescriptions({ patientId, prescriptions }: { patientId: string; prescriptions: Prescription[] }) {
  const [note, setNote] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()
  // Keeps the same idempotency key when a failed request is retried.
  const requests = useRef<Record<string, RefillRequestInput>>({})

  function submitRequest(prescription: Prescription) {
    const input = requests.current[prescription.id] ||= { prescriptionId: prescription.id, prescriptionItemId: prescription.prescriptionItemId, patientId, locationId: prescription.locationId, expectedItemVersion: prescription.itemVersion, note: note[prescription.id], idempotencyKey: `portal:${prescription.id}:${crypto.randomUUID()}` }
    startTransition(async () => {
      const result = await requestRefill(input)
      if (!result.success) return setMessages((value) => ({ ...value, [prescription.id]: result.error }))
      delete requests.current[prescription.id]
      setCompleted((value) => ({ ...value, [prescription.id]: true }))
      setMessages((value) => ({ ...value, [prescription.id]: 'Refill requested. The pharmacy will review it.' }))
    })
  }

  if (!prescriptions.length) return <p className="mt-4 rounded-2xl bg-card p-6 text-muted-foreground">No prescriptions yet.</p>
  return <div className="mt-4 grid gap-4">{prescriptions.map((prescription) => {
    const canRefill = prescription.refillsRemaining > 0 && ['dispensed', 'fill_closed'].includes(prescription.status) && prescription.fillLineage === 'per_fill_v1' && prescription.refillEligible
    return <article key={prescription.id} className="rounded-2xl bg-card p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Rx {prescription.prescriptionNumber}</p><h3 className="mt-2 text-xl font-semibold">{prescription.medicationName}</h3><p className="mt-2 text-sm text-muted-foreground">{prescription.prescriberName} · {prescription.locationName}</p></div>
        <div className="text-sm sm:text-right"><p className="font-semibold capitalize">{formatStatus(prescription.status)}</p><p className="mt-1 text-muted-foreground">{prescription.refillsRemaining} refills remaining</p>{prescription.lastRefillStatus && <p className="mt-1 capitalize text-primary">Latest request: {formatStatus(prescription.lastRefillStatus)}</p>}</div>
      </div>
      {canRefill && <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row">
        <Input value={note[prescription.id] || ''} onChange={(event) => setNote((value) => ({ ...value, [prescription.id]: event.target.value }))} placeholder="Note for the pharmacy (optional)" maxLength={500} />
        <Button disabled={pending || completed[prescription.id]} onClick={() => submitRequest(prescription)}>{completed[prescription.id] ? 'Requested' : requests.current[prescription.id] ? 'Try again' : 'Request refill'}</Button>
      </div>}
      {messages[prescription.id] && <p role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm">{messages[prescription.id]}</p>}
    </article>
  })}</div>
}
