'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { recordPatientAllergyAction, recordPatientMedicationAction } from '../actions'

export function PatientHistoryForms({ patientId }: { patientId: string }) {
  const [allergen, setAllergen] = useState('')
  const [reaction, setReaction] = useState('')
  const [severity, setSeverity] = useState('unknown')
  const [medicationName, setMedicationName] = useState('')
  const [directions, setDirections] = useState('')
  const [source, setSource] = useState('patient_or_caregiver_report')
  const [sourceReference, setSourceReference] = useState('')
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const operationKeys = useRef<Record<string, string>>({})
  const keyFor = (operation: string) => operationKeys.current[operation] || (operationKeys.current[operation] = crypto.randomUUID())
  const commonReady = Boolean(source.trim() && sourceReference.trim() && reason.trim().length >= 8 && attested)
  const run = (task: () => Promise<{ status: string }>, onSuccess: () => void) => { setMessage(''); setError(''); startTransition(() => task().then((result) => { onSuccess(); setMessage(`Patient history evidence recorded with status ${result.status}.`) }).catch((cause) => setError(cause instanceof Error ? cause.message : 'History update failed'))) }
  return <div className="mt-6 space-y-5 border-t pt-5">
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">History source<Input value={source} onChange={(event) => setSource(event.target.value)} className="mt-2" /></label><label className="text-sm">Source reference<Input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Dated interview or document reference" className="mt-2" /></label><label className="text-sm sm:col-span-2">Recording reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label></div>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I attest that I recorded the patient/caregiver/source statement accurately. This software did not infer an allergy, interaction, or clinical conclusion.</label>
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"><h3 className="font-semibold sm:col-span-2">Add allergy history</h3><label className="text-sm">Allergen<Input value={allergen} onChange={(event) => setAllergen(event.target.value)} className="mt-2" /></label><label className="text-sm">Reaction<Input value={reaction} onChange={(event) => setReaction(event.target.value)} className="mt-2" /></label><label className="text-sm">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2"><option value="unknown">Unknown</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label><div className="self-end"><Button disabled={pending || !commonReady || !allergen.trim() || !reaction.trim()} onClick={() => run(() => recordPatientAllergyAction({ patientId, allergen, reaction, severity, source, sourceReference, idempotencyKey: keyFor('allergy'), reason, attested }), () => { delete operationKeys.current.allergy })}>Record allergy</Button></div></div>
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"><h3 className="font-semibold sm:col-span-2">Add current medication history</h3><label className="text-sm">Medication name<Input value={medicationName} onChange={(event) => setMedicationName(event.target.value)} className="mt-2" /></label><label className="text-sm">Directions (optional)<Input value={directions} onChange={(event) => setDirections(event.target.value)} className="mt-2" /></label><div className="sm:col-span-2"><Button disabled={pending || !commonReady || !medicationName.trim()} onClick={() => run(() => recordPatientMedicationAction({ patientId, medicationName, directions: directions || undefined, source, sourceReference, idempotencyKey: keyFor('medication'), reason, attested }), () => { delete operationKeys.current.medication })}>Record medication</Button></div></div>
    {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  </div>
}
