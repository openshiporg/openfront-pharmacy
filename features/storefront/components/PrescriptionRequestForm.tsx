'use client'

import { useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitPrescriptionRequest, type RequestKind } from '../lib/data/requests'
import { Notice, Pill, Track, buttonClass } from './rx-ui'

const inputClass = 'h-11 rounded-[4px] bg-background'
const areaClass = 'min-h-20 rounded-[4px] bg-background'

const KIND_LABELS: Record<RequestKind, string> = { registration: 'New patient', transfer: 'Transfer', new_prescription: 'New prescription', refill: 'Refill' }

/** Types the slashes for the patient: "04091986" reads as 04/09/1986. */
function formatBirthDate(event: { currentTarget: HTMLInputElement }) {
  const iso = event.currentTarget.value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) { event.currentTarget.value = `${iso[2]}/${iso[3]}/${iso[1]}`; return }
  const digits = event.currentTarget.value.replace(/\D/g, '').slice(0, 8)
  event.currentTarget.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** MM/DD/YYYY as typed, sent to the pharmacy as YYYY-MM-DD. */
function isoBirthDate(value?: string) {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[1]}-${match[2]}` : value
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label>{children}</div>
}

/** Online request to the pharmacy team: register as a patient, transfer a prescription, or fill a new one. */
export function PrescriptionRequestForm({ kinds, locationId, needsIdentity, defaultPhone }: { kinds: RequestKind[]; locationId: string; needsIdentity: boolean; defaultPhone?: string | null }) {
  const [kind, setKind] = useState<RequestKind>(kinds[0])
  // Two forms can share a page (refill and transfer): every field id is scoped to this form.
  const uid = useId()
  const fid = (name: string) => `${uid}-${name}`
  const [error, setError] = useState('')
  const [sent, setSent] = useState<RequestKind | null>(null)
  const [pending, startTransition] = useTransition()
  // Keeps one idempotency key per kind until the request is sent, so a retry never doubles it.
  const keys = useRef<Partial<Record<RequestKind, string>>>({})
  const identity = needsIdentity || kind === 'registration'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (name: string) => String(data.get(name) || '').trim() || undefined
    const idempotencyKey = keys.current[kind] ||= `request:${kind}:${crypto.randomUUID()}`
    setError('')
    startTransition(async () => {
      const result = await submitPrescriptionRequest({
        locationId,
        kind,
        idempotencyKey,
        firstName: value('firstName'),
        lastName: value('lastName'),
        dateOfBirth: isoBirthDate(value('dateOfBirth')),
        phone: value('phone'),
        allergies: value('allergies'),
        insurance: value('insurance'),
        counterpartyName: value('counterpartyName'),
        counterpartyPhone: value('counterpartyPhone'),
        prescriberName: value('prescriberName'),
        prescriberPhone: value('prescriberPhone'),
        medications: value('medications'),
        note: value('note'),
      })
      if (!result.success) return setError(result.error)
      delete keys.current[kind]
      setSent(kind)
      form.reset()
    })
  }

  return <form onSubmit={submit} className="grid gap-5">
    {kinds.length > 1 && <Track label="Request type" className="w-fit">
      {kinds.map((entry) => <Pill key={entry} active={kind === entry} onClick={() => { setKind(entry); setSent(null); setError('') }}>{KIND_LABELS[entry]}</Pill>)}
    </Track>}

    {identity && <div className="grid gap-4 sm:grid-cols-3">
      <Field id={fid("rq-first")} label="Legal first name"><Input id={fid("rq-first")} name="firstName" autoComplete="given-name" maxLength={120} required className={inputClass} /></Field>
      <Field id={fid("rq-last")} label="Legal last name"><Input id={fid("rq-last")} name="lastName" autoComplete="family-name" maxLength={120} required className={inputClass} /></Field>
      <Field id={fid("rq-dob")} label="Date of birth"><Input id={fid("rq-dob")} name="dateOfBirth" type="text" inputMode="numeric" placeholder="MM/DD/YYYY" maxLength={10} pattern="(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/(19|20)[0-9]{2}" title="Month/day/year, for example 04/09/1986" autoComplete="bday" required onChange={formatBirthDate} className={inputClass} /></Field>
    </div>}

    {kind === 'transfer' && <div className="grid gap-4 sm:grid-cols-2">
      <Field id={fid("rq-from")} label="Transfer from (pharmacy)"><Input id={fid("rq-from")} name="counterpartyName" maxLength={200} required className={inputClass} /></Field>
      <Field id={fid("rq-from-phone")} label="That pharmacy's phone"><Input id={fid("rq-from-phone")} name="counterpartyPhone" type="tel" maxLength={40} className={inputClass} /></Field>
    </div>}

    {kind === 'new_prescription' && <div className="grid gap-4 sm:grid-cols-2">
      <Field id={fid("rq-prescriber")} label="Prescriber"><Input id={fid("rq-prescriber")} name="prescriberName" maxLength={200} required className={inputClass} /></Field>
      <Field id={fid("rq-prescriber-phone")} label="Prescriber's phone"><Input id={fid("rq-prescriber-phone")} name="prescriberPhone" type="tel" maxLength={40} className={inputClass} /></Field>
    </div>}

    {kind === 'refill' && <Field id={fid("rq-rx")} label="Rx number(s), one per line"><Textarea id={fid("rq-rx")} name="medications" maxLength={2000} required placeholder="The Rx number is printed on your label" className={areaClass} /></Field>}

    {kind !== 'registration' && kind !== 'refill' && <Field id={fid("rq-meds")} label="Medications"><Textarea id={fid("rq-meds")} name="medications" maxLength={2000} required className={areaClass} /></Field>}

    {identity && <div className="grid gap-4 sm:grid-cols-2">
      <Field id={fid("rq-allergies")} label="Allergies (or None)"><Textarea id={fid("rq-allergies")} name="allergies" maxLength={1000} required={kind === 'registration'} className={areaClass} /></Field>
      <Field id={fid("rq-insurance")} label="Insurance (optional)"><Textarea id={fid("rq-insurance")} name="insurance" maxLength={1000} className={areaClass} /></Field>
    </div>}

    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={fid("rq-phone")} label="Your phone"><Input id={fid("rq-phone")} name="phone" type="tel" autoComplete="tel" defaultValue={defaultPhone || ''} maxLength={40} required className={inputClass} /></Field>
      <Field id={fid("rq-note")} label="Note (optional)"><Input id={fid("rq-note")} name="note" maxLength={1000} className={inputClass} /></Field>
    </div>

    {error && <Notice tone="danger">{error}</Notice>}
    {sent === kind && <Notice tone="brand">Request sent. It shows in your account with its status.</Notice>}
    <button type="submit" disabled={pending} className={`${buttonClass} w-fit min-w-40`}>{pending ? 'Sending…' : 'Send request'}</button>
  </form>
}
